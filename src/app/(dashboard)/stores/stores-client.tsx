"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { StoreFilters } from "@/components/stores/StoreFilters";
import { StoreTable } from "@/components/stores/StoreTable";
import { ExportButton } from "@/components/stores/ExportButton";
import { Pagination } from "@/components/shared/Pagination";
import { useFilters } from "@/hooks/useFilters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Mail } from "lucide-react";
import type { Store } from "@/lib/db/schema";

interface StoresClientProps {
  knownApps: { slug: string; name: string; category: string }[];
  availableCountries: string[];
  appCategories?: string[];
}

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

function StoresContent({ knownApps, availableCountries, appCategories }: StoresClientProps) {
  const searchParams = useSearchParams();
  const { setPage } = useFilters();
  const [stores, setStores] = useState<StoreWithApps[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const page = Number(searchParams.get("page") || "1");

  const fetchStores = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/stores?${searchParams.toString()}`);
      const data = await response.json();
      setStores(data.stores);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      console.error("Failed to fetch stores");
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stores</h1>
          <p className="text-sm text-muted-foreground">
            {total.toLocaleString()} stores found
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <>
              <Badge variant="secondary">{selectedIds.size} selected</Badge>
              <Link
                href={`/campaigns/new?storeIds=${Array.from(selectedIds).join(",")}`}
              >
                <Button size="sm">
                  <Mail className="mr-2 h-4 w-4" />
                  Create Campaign
                </Button>
              </Link>
            </>
          )}
          <ExportButton totalStores={total} />
        </div>
      </div>

      <div className="flex gap-6">
        <div className="w-60 shrink-0">
          <StoreFilters
            knownApps={knownApps}
            availableCountries={availableCountries}
            appCategories={appCategories}
          />
        </div>
        <div className="flex-1 space-y-4">
          <StoreTable
            stores={stores}
            loading={loading}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleAll={toggleAll}
          />
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}

export function StoresClient(props: StoresClientProps) {
  return (
    <Suspense>
      <StoresContent {...props} />
    </Suspense>
  );
}
