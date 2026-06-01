import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scrapeJobs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const webhookSchema = z.object({
  jobId: z.number(),
  status: z.enum(["completed", "failed"]),
  storesDiscovered: z.number().optional(),
  storesUpdated: z.number().optional(),
  storesFailed: z.number().optional(),
  errorMessage: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.SCRAPER_SECRET;

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const data = webhookSchema.parse(body);

  await db
    .update(scrapeJobs)
    .set({
      status: data.status,
      completedAt: new Date(),
      storesDiscovered: data.storesDiscovered,
      storesUpdated: data.storesUpdated,
      storesFailed: data.storesFailed,
      errorMessage: data.errorMessage,
    })
    .where(eq(scrapeJobs.id, data.jobId));

  return NextResponse.json({ ok: true });
}
