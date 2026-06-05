import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted/40">
      <div className="text-center space-y-2">
        <h1 className="text-6xl font-bold text-muted-foreground/50">404</h1>
        <h2 className="text-xl font-semibold">Page not found</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <Link href="/dashboard">
        <Button>Back to Dashboard</Button>
      </Link>
    </div>
  );
}
