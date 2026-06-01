"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink } from "lucide-react";
import type { Store } from "@/lib/db/schema";

interface StoreWithApps extends Store {
  installedApps: string[];
}

interface StoreTableProps {
  stores: StoreWithApps[];
  loading?: boolean;
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onToggleAll: () => void;
}

export function StoreTable({
  stores,
  loading,
  selectedIds,
  onToggleSelect,
  onToggleAll,
}: StoreTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-medium">No stores found</p>
        <p className="text-sm text-muted-foreground">
          Try adjusting your filters or run the scraper to discover stores.
        </p>
      </div>
    );
  }

  const allSelected =
    stores.length > 0 && stores.every((s) => selectedIds.has(s.id));

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox checked={allSelected} onCheckedChange={onToggleAll} />
            </TableHead>
            <TableHead>Store</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Country</TableHead>
            <TableHead className="text-right">Products</TableHead>
            <TableHead>Apps</TableHead>
            <TableHead>Email</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stores.map((store) => (
            <TableRow key={store.id}>
              <TableCell>
                <Checkbox
                  checked={selectedIds.has(store.id)}
                  onCheckedChange={() => onToggleSelect(store.id)}
                />
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium text-sm">
                    {store.name || "Unknown"}
                  </div>
                  <a
                    href={store.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {store.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </TableCell>
              <TableCell>
                {store.category && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {store.category.replace("-", " ")}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-sm">{store.country || "—"}</TableCell>
              <TableCell className="text-right text-sm">
                {store.productCount ?? "—"}
              </TableCell>
              <TableCell>
                {store.installedApps.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {store.installedApps.slice(0, 3).map((app) => (
                      <Badge
                        key={app}
                        variant="secondary"
                        className="text-xs"
                      >
                        {app}
                      </Badge>
                    ))}
                    {store.installedApps.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{store.installedApps.length - 3}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">None</span>
                )}
              </TableCell>
              <TableCell className="text-sm">
                {store.contactEmail ? (
                  <span className="max-w-[150px] truncate block text-xs">
                    {store.contactEmail}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
