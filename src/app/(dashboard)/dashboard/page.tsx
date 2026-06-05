import type { Metadata } from "next";
import { db } from "@/lib/db";
import { stores, campaigns, scrapeJobs } from "@/lib/db/schema";
import { count, eq, isNotNull, sql, desc } from "drizzle-orm";
import { StatsCard } from "@/components/layout/StatsCard";
import { Store, Mail, Database, Clock } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [totalStores] = await db
    .select({ count: count() })
    .from(stores)
    .where(eq(stores.isActive, true));

  const [storesWithEmail] = await db
    .select({ count: count() })
    .from(stores)
    .where(isNotNull(stores.contactEmail));

  const [activeCampaigns] = await db
    .select({ count: count() })
    .from(campaigns)
    .where(eq(campaigns.status, "sending"));

  const recentJobs = await db
    .select()
    .from(scrapeJobs)
    .orderBy(desc(scrapeJobs.startedAt))
    .limit(5);

  const categoryBreakdown = await db
    .select({
      category: stores.category,
      count: count(),
    })
    .from(stores)
    .where(eq(stores.isActive, true))
    .groupBy(stores.category)
    .orderBy(sql`count(*) desc`)
    .limit(10);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Stores"
          value={totalStores.count.toLocaleString()}
          icon={Store}
        />
        <StatsCard
          title="With Email"
          value={storesWithEmail.count.toLocaleString()}
          description={`${totalStores.count > 0 ? Math.round((storesWithEmail.count / totalStores.count) * 100) : 0}% of total`}
          icon={Mail}
        />
        <StatsCard
          title="Active Campaigns"
          value={activeCampaigns.count}
          icon={Database}
        />
        <StatsCard
          title="Last Scrape"
          value={
            recentJobs[0]
              ? format(new Date(recentJobs[0].startedAt), "MMM d")
              : "Never"
          }
          icon={Clock}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Stores by Category</CardTitle>
            <CardDescription>Top categories in your database</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No stores yet. Run the scraper to populate data.
              </p>
            ) : (
              <div className="space-y-3">
                {categoryBreakdown.map((row) => (
                  <div
                    key={row.category || "unknown"}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm capitalize">
                      {(row.category || "uncategorized").replace("-", " ")}
                    </span>
                    <Badge variant="secondary">{row.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Scrape Jobs</CardTitle>
            <CardDescription>Latest scraper activity</CardDescription>
          </CardHeader>
          <CardContent>
            {recentJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No scrape jobs yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Discovered</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentJobs.map((job) => (
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
                      <TableCell className="text-sm">
                        {job.storesDiscovered}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(job.startedAt), "MMM d, h:mma")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
