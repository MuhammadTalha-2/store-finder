import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { campaigns, campaignRecipients, stores } from "@/lib/db/schema";
import { desc, eq, inArray, isNotNull } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET() {
  const results = await db
    .select()
    .from(campaigns)
    .orderBy(desc(campaigns.createdAt));

  return NextResponse.json(results);
}

const createSchema = z.object({
  name: z.string().min(1),
  templateId: z.number(),
  storeIds: z.array(z.number()).min(1),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const data = createSchema.parse(body);

  const storeRows = await db
    .select({ id: stores.id, contactEmail: stores.contactEmail })
    .from(stores)
    .where(inArray(stores.id, data.storeIds));

  const storesWithEmail = storeRows.filter((s) => s.contactEmail);

  const [campaign] = await db
    .insert(campaigns)
    .values({
      name: data.name,
      templateId: data.templateId,
      totalRecipients: storesWithEmail.length,
      status: "draft",
    })
    .returning();

  if (storesWithEmail.length > 0) {
    await db.insert(campaignRecipients).values(
      storesWithEmail.map((store) => ({
        campaignId: campaign.id,
        storeId: store.id,
        email: store.contactEmail!,
      }))
    );
  }

  return NextResponse.json(campaign, { status: 201 });
}
