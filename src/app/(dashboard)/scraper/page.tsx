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

export const dynamic = "force-dynamic";

export default async function ScraperPage() {
  const jobs = await db
    .select()
    .from(scrapeJobs)
    .orderBy(desc(scrapeJobs.startedAt))
    .limit(20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Scraper</h1>
        <p className="text-sm text-muted-foreground">
          Monitor scrape job history. Jobs run via GitHub Actions (Mon + Thu) or
          locally via the CLI.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>CLI Commands</CardTitle>
          <CardDescription>
            Run the scraper locally from the <code>scraper/</code> directory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-sm">
            <p>
              <code className="rounded bg-muted px-2 py-1">
                npx tsx src/index.ts discover --source app-reviews --limit 500
              </code>
            </p>
            <p>
              <code className="rounded bg-muted px-2 py-1">
                npx tsx src/index.ts extract --batch-size 50
              </code>
            </p>
            <p>
              <code className="rounded bg-muted px-2 py-1">
                npx tsx src/index.ts full --limit 200
              </code>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Job History</CardTitle>
          <CardDescription>Recent scrape jobs</CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No scrape jobs yet. Run the scraper to get started.
            </p>
          ) : (
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
                    <TableCell className="text-sm">{job.source}</TableCell>
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
                        ? format(new Date(job.completedAt), "MMM d, h:mma")
                        : "—"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-destructive">
                      {job.errorMessage || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
