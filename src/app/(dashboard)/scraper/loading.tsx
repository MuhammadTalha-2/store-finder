import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ScraperLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-4 w-56" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Scraper controls */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-24" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-32" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Partners sync */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-3 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      </div>

      {/* Job history table */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-36" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-4 pb-2 border-b">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-16" />
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
