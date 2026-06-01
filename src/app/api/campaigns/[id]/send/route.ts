import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  campaigns,
  campaignRecipients,
  emailTemplates,
  stores,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { resend } from "@/lib/resend";
import { renderTemplate } from "@/lib/email-templates";

const BATCH_SIZE = 10;
const DAILY_LIMIT = 95;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const campaignId = Number(id);

  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  if (!campaign.templateId) {
    return NextResponse.json({ error: "No template set" }, { status: 400 });
  }

  const [template] = await db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.id, campaign.templateId))
    .limit(1);

  if (!template) {
    return NextResponse.json(
      { error: "Template not found" },
      { status: 404 }
    );
  }

  const pendingRecipients = await db
    .select({
      recipient: campaignRecipients,
      store: stores,
    })
    .from(campaignRecipients)
    .innerJoin(stores, eq(campaignRecipients.storeId, stores.id))
    .where(
      and(
        eq(campaignRecipients.campaignId, campaignId),
        eq(campaignRecipients.status, "pending")
      )
    )
    .limit(BATCH_SIZE);

  if (pendingRecipients.length === 0) {
    await db
      .update(campaigns)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(campaigns.id, campaignId));

    return NextResponse.json({
      sent: 0,
      failed: 0,
      remaining: 0,
      status: "completed",
    });
  }

  if (campaign.status === "draft") {
    await db
      .update(campaigns)
      .set({ status: "sending" })
      .where(eq(campaigns.id, campaignId));
  }

  let sent = 0;
  let failed = 0;

  for (const { recipient, store } of pendingRecipients) {
    try {
      const subject = renderTemplate(template.subject, { store });
      const html = renderTemplate(template.bodyHtml, { store });

      const { data } = await resend.emails.send({
        from: process.env.EMAIL_FROM || "onboarding@resend.dev",
        to: recipient.email,
        replyTo: process.env.REPLY_TO_EMAIL,
        subject,
        html,
      });

      await db
        .update(campaignRecipients)
        .set({
          status: "sent",
          resendId: data?.id,
          sentAt: new Date(),
        })
        .where(eq(campaignRecipients.id, recipient.id));

      sent++;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Unknown error";

      await db
        .update(campaignRecipients)
        .set({
          status: "failed",
          errorMessage: errorMsg,
        })
        .where(eq(campaignRecipients.id, recipient.id));

      failed++;
    }
  }

  await db
    .update(campaigns)
    .set({
      sentCount: campaign.sentCount + sent,
      failedCount: campaign.failedCount + failed,
      updatedAt: new Date(),
    })
    .where(eq(campaigns.id, campaignId));

  const [remainingResult] = await db
    .select({ count: campaignRecipients.id })
    .from(campaignRecipients)
    .where(
      and(
        eq(campaignRecipients.campaignId, campaignId),
        eq(campaignRecipients.status, "pending")
      )
    );

  return NextResponse.json({
    sent,
    failed,
    remaining: pendingRecipients.length - BATCH_SIZE + (pendingRecipients.length === BATCH_SIZE ? 1 : 0),
    status: "sending",
  });
}
