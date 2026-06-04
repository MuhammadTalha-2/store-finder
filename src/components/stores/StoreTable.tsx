"use client";

import { useState } from "react";
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
import { ExternalLink, Flame, Thermometer, Snowflake } from "lucide-react";
import { StoreDetailModal } from "./StoreDetailModal";
import {
  APP_CATEGORY_LABELS,
  OUR_APP_CATEGORIES,
  CORE_CATEGORIES,
} from "@/lib/app-gaps";
import {
  getLeadScoreLabel,
  getLeadScoreColor,
  type LeadScoreBreakdown,
} from "@/lib/lead-score";
import type { Store } from "@/lib/db/schema";

interface StoreWithApps extends Store {
  installedApps: string[];
  missingCategories?: string[];
  gapScore?: number;
  leadScore?: number;
  leadScoreBreakdown?: LeadScoreBreakdown;
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
  const [selectedStore, setSelectedStore] = useState<StoreWithApps | null>(
    null
  );

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
    <>
      <div className="rounded-md border overflow-hidden">
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={onToggleAll} />
              </TableHead>
              <TableHead className="w-[24%]">Store</TableHead>
              <TableHead className="w-[8%]">Category</TableHead>
              <TableHead className="w-[6%]">Country</TableHead>
              <TableHead className="w-[6%] text-right">Products</TableHead>
              <TableHead className="w-[7%] text-center">Score</TableHead>
              <TableHead className="w-[14%]">Apps</TableHead>
              <TableHead className="w-[18%]">Opportunities</TableHead>
              <TableHead className="w-[12%]">Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stores.map((store) => (
              <TableRow
                key={store.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedStore(store)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.has(store.id)}
                    onCheckedChange={() => onToggleSelect(store.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">
                      {store.name || "Unknown"}
                    </div>
                    <div className="truncate">
                      <a
                        href={store.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {store.url
                          .replace(/^https?:\/\//, "")
                          .replace(/\/$/, "")}
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {store.category && (
                    <Badge
                      variant="outline"
                      className="text-xs capitalize truncate max-w-full"
                    >
                      {store.category.replace(/-/g, " ")}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {store.country || "—"}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {store.productCount ?? "—"}
                </TableCell>
                <TableCell className="text-center">
                  {store.leadScore != null ? (
                    <LeadScoreBadge score={store.leadScore} />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {store.installedApps.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {store.installedApps.slice(0, 3).map((app) => (
                        <Badge
                          key={app}
                          variant="secondary"
                          className="text-xs truncate max-w-[80px]"
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
                <TableCell>
                  {store.missingCategories &&
                  store.missingCategories.length > 0 ? (
                    <div className="flex flex-wrap gap-0.5">
                      {/* Show our app gaps first (highlighted) */}
                      {store.missingCategories
                        .filter((c) => OUR_APP_CATEGORIES.has(c))
                        .slice(0, 2)
                        .map((cat) => (
                          <Badge
                            key={cat}
                            variant="destructive"
                            className="text-[10px] px-1.5 py-0 cursor-default"
                            title={`No ${APP_CATEGORY_LABELS[cat] || cat} app — pitch our app!`}
                          >
                            {APP_CATEGORY_LABELS[cat] || cat}
                          </Badge>
                        ))}
                      {/* Then show core category gaps */}
                      {store.missingCategories
                        .filter(
                          (c) =>
                            !OUR_APP_CATEGORIES.has(c) &&
                            CORE_CATEGORIES.has(c)
                        )
                        .slice(0, 2)
                        .map((cat) => (
                          <Badge
                            key={cat}
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 text-orange-600 border-orange-200"
                          >
                            {APP_CATEGORY_LABELS[cat] || cat}
                          </Badge>
                        ))}
                      {/* Count remaining */}
                      {store.missingCategories.length > 4 && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 cursor-default"
                          title={`${store.missingCategories.length} total missing categories`}
                        >
                          +{store.missingCategories.length - 4}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {store.contactEmail ? (
                    <span className="text-xs truncate block max-w-full">
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

      <StoreDetailModal
        store={selectedStore}
        open={selectedStore !== null}
        onClose={() => setSelectedStore(null)}
      />
    </>
  );
}

function LeadScoreBadge({ score }: { score: number }) {
  const label = getLeadScoreLabel(score);
  const colors = getLeadScoreColor(score);
  const Icon =
    score >= 80 ? Flame : score >= 40 ? Thermometer : Snowflake;

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${colors.bg} ${colors.text} ${colors.border}`}
      title={`Lead Score: ${score}/100 (${label})`}
    >
      <Icon className="h-3 w-3" />
      {score}
    </span>
  );
}
