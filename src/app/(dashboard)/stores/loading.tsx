import { Skeleton } from "@/components/ui/skeleton";

export default function StoresLoading() {
  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="space-y-1">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 rounded-lg border bg-muted/20 px-4 py-2 shrink-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-24" />
        ))}
      </div>

      {/* Filter toggle */}
      <div className="shrink-0">
        <Skeleton className="h-8 w-24" />
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 rounded-md border">
        <div className="p-4 space-y-3">
          <div className="flex gap-4 pb-2 border-b">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-20" />
            ))}
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-4 py-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between shrink-0">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-8 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
