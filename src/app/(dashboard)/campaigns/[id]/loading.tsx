import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function CampaignDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-4 pb-2 border-b">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
