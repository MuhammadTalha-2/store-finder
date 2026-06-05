import type { Metadata } from "next";
import { db } from "@/lib/db";
import { scrapeJobs } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ScraperClient } from "./scraper-client";
import { PartnersSync } from "@/components/scraper/PartnersSync";

export const metadata: Metadata = { title: "Scraper" };
export const dynamic = "force-dynamic";

export default async function ScraperPage() {
  const jobs = await db
    .select()
    .from(scrapeJobs)
    .orderBy(desc(scrapeJobs.startedAt))
    .limit(20);

  // Serialize dates for client component
  const serializedJobs = jobs.map((job) => ({
    ...job,
    startedAt: job.startedAt.toISOString(),
    completedAt: job.completedAt?.toISOString() || null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Scraper</h1>
        <p className="text-sm text-muted-foreground">
          Scan stores, import new URLs, and manage scraping jobs.
        </p>
      </div>

      {/* Client-side scraper controls */}
      <ScraperClient initialJobs={serializedJobs as any} />

      {/* Partners API Sync — for admin-only app detection */}
      <PartnersSync />

      {/* Job History — server-rendered */}
      <Card>
        <CardHeader>
          <CardTitle>Job History</CardTitle>
          <CardDescription>
            Recent scrape jobs from web, CLI, and GitHub Actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No scrape jobs yet. Use the controls above to get started.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Discovered</TableHead>
                    <TableHead className="text-right">Updated</TableHead>
                    <TableHead className="text-right">Failed</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="text-sm">
                        <Badge
                          variant="outline"
                          className="font-mono text-xs"
                        >
                          {job.source}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            job.status === "completed"
                              ? "default"
                              : job.status === "running"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {job.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {job.storesDiscovered}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {job.storesUpdated}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {job.storesFailed}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(job.startedAt), "MMM d, h:mma")}
                      </TableCell>
                      <TableCell className="text-sm">
                        {job.completedAt
                          ? format(
                              new Date(job.completedAt),
                              "MMM d, h:mma"
                            )
                          : "—"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-destructive">
                        {job.errorMessage || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
