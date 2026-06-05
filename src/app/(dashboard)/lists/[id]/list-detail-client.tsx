"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StoreTable } from "@/components/stores/StoreTable";
import { Pagination } from "@/components/shared/Pagination";
import { useFilters } from "@/hooks/useFilters";
import {
  ArrowLeft,
  Zap,
  Trash2,
  ExternalLink,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Store } from "@/lib/db/schema";

interface StoreWithApps extends Omit<Store, "socialLinks" | "adPixels"> {
  installedApps: string[];
  confirmedOurApps?: string[];
  missingCategories?: string[];
  gapScore?: number;
  leadScore?: number;
  leadScoreBreakdown?: {
    total: number;
    email: number;
    appGaps: number;
    products: number;
    country: number;
    maturity: number;
    categoryFit: number;
    blog: number;
  };
  socialLinks?: Record<string, string | null> | null;
  adPixels?: Record<string, string | null> | null;
}

interface ListDetail {
  id: number;
  name: string;
  description: string | null;
  color: string;
  type: string;
  filtersJson: Record<string, string> | null;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

function ListDetailContent({ listId }: { listId: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setPage } = useFilters();

  const [list, setList] = useState<ListDetail | null>(null);
  const [stores, setStores] = useState<StoreWithApps[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const page = Number(searchParams.get("page") || "1");

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch(`/api/lists/${listId}`);
      if (res.ok) {
        const data = await res.json();
        setList(data.list);
      }
    } catch {
      console.error("Failed to fetch list");
    }
  }, [listId]);

  const fetchStores = useCallback(async () => {
    if (!list) return;
    setLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "50");

      if (list.type === "smart" && list.filtersJson) {
        // Smart segment: use saved filters
        for (const [key, value] of Object.entries(list.filtersJson)) {
          if (value && key !== "page" && key !== "limit") {
            params.set(key, String(value));
          }
        }
      } else {
        // Manual list: filter by listId
        params.set("listId", String(listId));
      }

      const res = await fetch(`/api/stores?${params.toString()}`);
      const data = await res.json();
      setStores(data.stores || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
    } catch {
      console.error("Failed to fetch stores");
    } finally {
      setLoading(false);
    }
  }, [list, listId, page]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (list) fetchStores();
  }, [list, fetchStores]);

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (stores.every((s) => selectedIds.has(s.id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(stores.map((s) => s.id)));
    }
  }

  async function handleRemoveSelected() {
    if (selectedIds.size === 0) return;

    const res = await fetch(`/api/lists/${listId}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeIds: Array.from(selectedIds) }),
    });

    if (res.ok) {
      setSelectedIds(new Set());
      setShowRemoveConfirm(false);
      fetchList();
      fetchStores();
    }
  }

  if (!list) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="h-96 rounded-lg border bg-muted/30 animate-pulse" />
      </div>
    );
  }

  // Compute filter summary for smart segments
  const filterSummary =
    list.type === "smart" && list.filtersJson
      ? Object.entries(list.filtersJson)
          .filter(
            ([k, v]) =>
              v && !["page", "limit", "sort", "order"].includes(k)
          )
          .map(([k, v]) => `${k}: ${v}`)
      : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/lists")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div
          className="h-3 w-3 rounded-full shrink-0"
          style={{ backgroundColor: list.color }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold truncate">{list.name}</h1>
            {list.type === "smart" && (
              <Badge variant="secondary" className="text-xs gap-1 shrink-0">
                <Zap className="h-3 w-3" />
                Smart Segment
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {list.description || `${total} stores`}
          </p>
        </div>
      </div>

      {/* Smart segment filter summary */}
      {filterSummary.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-amber-50/50 dark:bg-amber-950/20 p-3">
          <Zap className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="text-xs font-medium text-amber-700 dark:text-amber-400 mr-1">
            Active filters:
          </span>
          {filterSummary.map((f) => (
            <Badge key={f} variant="outline" className="text-xs">
              {f}
            </Badge>
          ))}
          <Button
            variant="link"
            size="sm"
            className="text-xs h-auto p-0 ml-auto"
            onClick={() => {
              // Navigate to stores page with these filters
              const params = new URLSearchParams(
                list.filtersJson as Record<string, string>
              );
              router.push(`/stores?${params.toString()}`);
            }}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View in Stores
          </Button>
        </div>
      )}

      {/* Actions bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total.toLocaleString()} {total === 1 ? "store" : "stores"}
        </p>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && list.type === "manual" && (
            <>
              <Badge variant="secondary">{selectedIds.size} selected</Badge>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowRemoveConfirm(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove from list
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Store table */}
      <StoreTable
        stores={stores}
        loading={loading}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onToggleAll={toggleAll}
      />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Remove confirmation */}
      <Dialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Stores</DialogTitle>
            <DialogDescription>
              Remove {selectedIds.size}{" "}
              {selectedIds.size === 1 ? "store" : "stores"} from &ldquo;
              {list.name}&rdquo;? The stores won&apos;t be deleted, just removed
              from this list.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowRemoveConfirm(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveSelected}>
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ListDetailClient({ listId }: { listId: number }) {
  return (
    <Suspense>
      <ListDetailContent listId={listId} />
    </Suspense>
  );
}
