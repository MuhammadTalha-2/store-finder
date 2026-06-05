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
import {
  ExternalLink,
  Flame,
  Thermometer,
  Snowflake,
  ShieldCheck,
  Copy,
  CheckCheck,
} from "lucide-react";
import { StoreDetailModal } from "./StoreDetailModal";
import {
  APP_CATEGORY_LABELS,
  OUR_APP_CATEGORIES,
} from "@/lib/app-gaps";
import {
  getLeadScoreLabel,
  getLeadScoreColor,
  type LeadScoreBreakdown,
} from "@/lib/lead-score";
import type { Store } from "@/lib/db/schema";

import type { SocialLinks, AdPixels } from "./StoreDetailModal";

interface StoreWithApps extends Omit<Store, "socialLinks" | "adPixels"> {
  installedApps: string[];
  confirmedOurApps?: string[];
  missingCategories?: string[];
  gapScore?: number;
  leadScore?: number;
  leadScoreBreakdown?: LeadScoreBreakdown;
  socialLinks?: SocialLinks | null;
  adPixels?: AdPixels | null;
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
      <div className="rounded-md border h-full overflow-auto [&_[data-slot=table-container]]:!overflow-visible">
        <Table className="w-full">
          <TableHeader className="sticky top-0 z-10 bg-background shadow-[0_1px_0_0] shadow-border">
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={onToggleAll} />
              </TableHead>
              <TableHead className="min-w-[240px]">Store</TableHead>
              <TableHead className="w-[80px] text-center">Score</TableHead>
              <TableHead className="min-w-[160px]">Apps</TableHead>
              <TableHead className="min-w-[140px]">Opportunities</TableHead>
              <TableHead className="min-w-[180px]">Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stores.map((store) => (
              <TableRow
                key={store.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedStore(store)}
              >
                {/* Checkbox */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.has(store.id)}
                    onCheckedChange={() => onToggleSelect(store.id)}
                  />
                </TableCell>

                {/* Store — name, URL, category + country merged */}
                <TableCell>
                  <div className="min-w-0 space-y-0.5">
                    <div className="font-medium text-sm truncate">
                      {store.name || "Unknown"}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={store.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground truncate max-w-[200px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {store.url
                          .replace(/^https?:\/\//, "")
                          .replace(/\/$/, "")}
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {store.category && (
                        <span className="text-[11px] text-muted-foreground capitalize">
                          {store.category.replace(/-/g, " ")}
                        </span>
                      )}
                      {store.category && store.country && (
                        <span className="text-muted-foreground/40">·</span>
                      )}
                      {store.country && (
                        <span className="text-[11px] text-muted-foreground">
                          {store.country}
                        </span>
                      )}
                      {store.productCount != null && store.productCount > 0 && (
                        <>
                          <span className="text-muted-foreground/40">·</span>
                          <span className="text-[11px] text-muted-foreground">
                            {store.productCount} products
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Lead Score */}
                <TableCell className="text-center">
                  {store.leadScore != null ? (
                    <LeadScoreBadge score={store.leadScore} />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>

                {/* Apps — confirmed + detected, simplified */}
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {store.confirmedOurApps &&
                      store.confirmedOurApps.map((app) => (
                        <Badge
                          key={`confirmed-${app}`}
                          className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200 inline-flex items-center gap-0.5"
                          title={`${app} — confirmed install`}
                        >
                          <ShieldCheck className="h-2.5 w-2.5" />
                          {app}
                        </Badge>
                      ))}
                    {store.installedApps.length > 0 ? (
                      <>
                        {store.installedApps
                          .slice(
                            0,
                            3 - (store.confirmedOurApps?.length || 0)
                          )
                          .map((app) => (
                            <Badge
                              key={app}
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 truncate max-w-[90px]"
                            >
                              {app}
                            </Badge>
                          ))}
                        {store.installedApps.length >
                          3 - (store.confirmedOurApps?.length || 0) && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0"
                          >
                            +
                            {store.installedApps.length -
                              (3 - (store.confirmedOurApps?.length || 0))}
                          </Badge>
                        )}
                      </>
                    ) : (
                      !store.confirmedOurApps?.length && (
                        <span className="text-xs text-muted-foreground">
                          None
                        </span>
                      )
                    )}
                  </div>
                </TableCell>

                {/* Opportunities — our app gaps only, simplified */}
                <TableCell>
                  {store.missingCategories &&
                  store.missingCategories.filter((c) =>
                    OUR_APP_CATEGORIES.has(c)
                  ).length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {store.missingCategories
                        .filter((c) => OUR_APP_CATEGORIES.has(c))
                        .slice(0, 3)
                        .map((cat) => (
                          <Badge
                            key={cat}
                            variant="destructive"
                            className="text-[10px] px-1.5 py-0 cursor-default"
                            title={`No ${APP_CATEGORY_LABELS[cat] || cat} app detected`}
                          >
                            {APP_CATEGORY_LABELS[cat] || cat}
                          </Badge>
                        ))}
                    </div>
                  ) : store.missingCategories &&
                    store.missingCategories.length > 0 ? (
                    <span
                      className="text-[11px] text-muted-foreground cursor-default"
                      title={`${store.missingCategories.length} missing app categories (non-priority)`}
                    >
                      {store.missingCategories.length} gaps
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>

                {/* Email — with copy on hover */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {store.contactEmail ? (
                    <EmailCell email={store.contactEmail} />
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

// ─── Email cell with copy-on-hover ──────────────────────────────────────────

function EmailCell({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback: do nothing
    }
  }

  return (
    <div className="group/email flex items-center gap-1 min-w-0">
      <span className="text-xs truncate">{email}</span>
      <button
        className="opacity-0 group-hover/email:opacity-100 shrink-0 p-0.5 rounded hover:bg-muted transition-all"
        onClick={handleCopy}
        title="Copy email"
      >
        {copied ? (
          <CheckCheck className="h-3 w-3 text-green-600" />
        ) : (
          <Copy className="h-3 w-3 text-muted-foreground" />
        )}
      </button>
    </div>
  );
}

// ─── Lead score badge ───────────────────────────────────────────────────────

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
