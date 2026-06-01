import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { campaigns, campaignRecipients, stores } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, Number(id)))
    .limit(1);

  if (!campaign) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const recipients = await db
    .select({
      id: campaignRecipients.id,
      storeId: campaignRecipients.storeId,
      email: campaignRecipients.email,
      status: campaignRecipients.status,
      sentAt: campaignRecipients.sentAt,
      errorMessage: campaignRecipients.errorMessage,
      storeName: stores.name,
      storeUrl: stores.url,
    })
    .from(campaignRecipients)
    .leftJoin(stores, eq(campaignRecipients.storeId, stores.id))
    .where(eq(campaignRecipients.campaignId, Number(id)));

  return NextResponse.json({ ...campaign, recipients });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(campaigns).where(eq(campaigns.id, Number(id)));
  return NextResponse.json({ ok: true });
}
