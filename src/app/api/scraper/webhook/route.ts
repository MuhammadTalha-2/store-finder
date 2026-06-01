import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scrapeJobs } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

const webhookSchema = z.object({
  status: z.enum(["completed", "failed"]),
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

  // Find the most recent "running" scrape job and mark it done
  const [latestJob] = await db
    .select({ id: scrapeJobs.id })
    .from(scrapeJobs)
    .where(eq(scrapeJobs.status, "running"))
    .orderBy(desc(scrapeJobs.startedAt))
    .limit(1);

  if (latestJob) {
    await db
      .update(scrapeJobs)
      .set({
        status: data.status,
        completedAt: new Date(),
        errorMessage: data.errorMessage,
      })
      .where(eq(scrapeJobs.id, latestJob.id));
  }

  return NextResponse.json({ ok: true });
}
