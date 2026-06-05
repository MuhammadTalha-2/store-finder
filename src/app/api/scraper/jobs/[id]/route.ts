import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scrapeJobs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET — Get job status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const jobId = parseInt(idParam);

    const [job] = await db
      .select()
      .from(scrapeJobs)
      .where(eq(scrapeJobs.id, jobId))
      .limit(1);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const metadata = job.metadata as Record<string, unknown>;
    const total =
      metadata.type === "import"
        ? (metadata.urls as string[]).length
        : (metadata.queue as number[])?.length || 0;

    return NextResponse.json({
      job,
      total,
      processed: (metadata.cursor as number) || 0,
    });
  } catch (error) {
    console.error("Error fetching job:", error);
    return NextResponse.json(
      { error: "Failed to fetch job" },
      { status: 500 }
    );
  }
}

// PATCH — Stop/pause a running job
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const jobId = parseInt(idParam);
    const body = await request.json();

    if (body.action === "stop") {
      await db
        .update(scrapeJobs)
        .set({
          status: "stopped",
          completedAt: new Date(),
        })
        .where(eq(scrapeJobs.id, jobId));

      return NextResponse.json({ ok: true, status: "stopped" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating job:", error);
    return NextResponse.json(
      { error: "Failed to update job" },
      { status: 500 }
    );
  }
}
