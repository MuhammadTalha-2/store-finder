import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function NewCampaignLoading() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-56" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3 w-52" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
