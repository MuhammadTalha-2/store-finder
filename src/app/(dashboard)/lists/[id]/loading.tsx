import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ListDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8" />
          <div className="space-y-1">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-md border p-4 space-y-3">
        <div className="flex gap-4 pb-2 border-b">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-20" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}
