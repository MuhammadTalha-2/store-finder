import { Skeleton } from "@/components/ui/skeleton";

export default function ListsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-5 w-6 rounded-full" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-3 w-3 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-48" />
                <div className="flex gap-3">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </div>
            <Skeleton className="h-8 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}
