"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { StoreFilters } from "@/components/stores/StoreFilters";
import { StoreTable } from "@/components/stores/StoreTable";
import { ExportButton } from "@/components/stores/ExportButton";
import { Pagination } from "@/components/shared/Pagination";
import { useFilters } from "@/hooks/useFilters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Link from "next/link";
import {
  Mail,
  Zap,
  ListPlus,
  Plus,
  Check,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  X,
  Store,
  AtSign,
  Flame,
  Hash,
} from "lucide-react";
import { toast } from "sonner";
import { CATEGORY_LABELS, type Category } from "@/lib/categories";
import { APP_CATEGORY_LABELS } from "@/lib/app-gaps";
import type { Store as StoreType } from "@/lib/db/schema";

interface StoresClientProps {
  knownApps: { slug: string; name: string; category: string }[];
  availableCountries: string[];
  appCategories?: string[];
}

interface StoreWithApps extends Omit<StoreType, "socialLinks" | "adPixels"> {
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

interface StoreListBasic {
  id: number;
  name: string;
  color: string;
  type: string;
  memberCount: number;
}

const LIST_COLORS = [
  { label: "Indigo", value: "#6366f1" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Green", value: "#22c55e" },
  { label: "Orange", value: "#f97316" },
  { label: "Red", value: "#ef4444" },
  { label: "Purple", value: "#a855f7" },
  { label: "Pink", value: "#ec4899" },
  { label: "Teal", value: "#14b8a6" },
];

// Human-readable labels for filter keys
const FILTER_LABELS: Record<string, string> = {
  category: "Category",
  country: "Country",
  hasEmail: "Has Email",
  minProducts: "Min Products",
  hasApp: "Has App",
  missingApp: "Missing App",
  missingAppCategory: "Missing Category",
  minLeadScore: "Lead Score",
  search: "Search",
};

function formatFilterValue(key: string, value: string, knownApps: { slug: string; name: string }[]): string {
  if (key === "category") {
    return CATEGORY_LABELS[value as Category] || value;
  }
  if (key === "hasEmail") return "Yes";
  if (key === "minProducts") return `${value}+`;
  if (key === "minLeadScore") return `${value}+`;
  if (key === "hasApp" || key === "missingApp") {
    const app = knownApps.find((a) => a.slug === value);
    return app?.name || value;
  }
  if (key === "missingAppCategory") {
    return APP_CATEGORY_LABELS[value] || value;
  }
  return value;
}

function StoresContent({
  knownApps,
  availableCountries,
  appCategories,
}: StoresClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setFilter, setPage } = useFilters();
  const [stores, setStores] = useState<StoreWithApps[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(true);

  // List/Segment dialogs
  const [showSaveSegment, setShowSaveSegment] = useState(false);
  const [showAddToList, setShowAddToList] = useState(false);
  const [segmentName, setSegmentName] = useState("");
  const [segmentDesc, setSegmentDesc] = useState("");
  const [segmentColor, setSegmentColor] = useState("#6366f1");
  const [existingLists, setExistingLists] = useState<StoreListBasic[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [newListName, setNewListName] = useState("");
  const [newListColor, setNewListColor] = useState("#3b82f6");
  const [addMode, setAddMode] = useState<"existing" | "new">("existing");

  const page = Number(searchParams.get("page") || "1");

  // Stats
  const [stats, setStats] = useState({ withEmail: 0, avgScore: 0 });

  const fetchStores = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/stores?${searchParams.toString()}`);
      const data = await response.json();
      setStores(data.stores);
      setTotal(data.total);
      setTotalPages(data.totalPages);

      // Compute quick stats from current page
      const withEmail = (data.stores as StoreWithApps[]).filter(
        (s) => s.contactEmail
      ).length;
      const scores = (data.stores as StoreWithApps[])
        .filter((s) => s.leadScore != null)
        .map((s) => s.leadScore!);
      const avg =
        scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;
      setStats({ withEmail, avgScore: avg });
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

  // Active filters (excluding pagination/sort meta)
  const activeFilters = Array.from(searchParams.entries()).filter(
    ([k, v]) => !["page", "limit", "sort", "order"].includes(k) && v
  );
  const hasActiveFilters = activeFilters.length > 0;

  // Fetch existing manual lists for "Add to List" dialog
  async function fetchExistingLists() {
    try {
      const res = await fetch("/api/lists");
      const data = await res.json();
      setExistingLists(
        (data.lists || []).filter((l: StoreListBasic) => l.type === "manual")
      );
    } catch {
      // ignore
    }
  }

  // Save current filters as a smart segment
  async function handleSaveSegment() {
    if (!segmentName.trim()) return;

    const filtersObj: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (!["page", "limit"].includes(key) && value) {
        filtersObj[key] = value;
      }
    });

    const res = await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: segmentName,
        description: segmentDesc,
        color: segmentColor,
        type: "smart",
        filtersJson: filtersObj,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setShowSaveSegment(false);
      setSegmentName("");
      setSegmentDesc("");
      setSegmentColor("#6366f1");
      toast.success("Segment saved!", {
        description: `"${data.list.name}" created with ${activeFilters.length} filters`,
        action: {
          label: "View",
          onClick: () => router.push(`/lists/${data.list.id}`),
        },
      });
    }
  }

  // Add selected stores to a list
  async function handleAddToList() {
    if (selectedIds.size === 0) return;

    let targetListId: number;

    if (addMode === "new") {
      if (!newListName.trim()) return;
      const createRes = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newListName,
          color: newListColor,
          type: "manual",
          storeIds: Array.from(selectedIds),
        }),
      });
      if (!createRes.ok) return;
      const createData = await createRes.json();
      targetListId = createData.list.id;
    } else {
      if (!selectedListId) return;
      targetListId = Number(selectedListId);
      const res = await fetch(`/api/lists/${targetListId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeIds: Array.from(selectedIds) }),
      });
      if (!res.ok) return;
    }

    setShowAddToList(false);
    setSelectedIds(new Set());
    setSelectedListId("");
    setNewListName("");
    setAddMode("existing");

    const listName =
      addMode === "new"
        ? newListName
        : existingLists.find((l) => l.id === targetListId)?.name || "list";

    toast.success(`Added ${selectedIds.size} stores to "${listName}"`, {
      action: {
        label: "View List",
        onClick: () => router.push(`/lists/${targetListId}`),
      },
    });
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* ── Header row ────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stores</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Discover and filter Shopify stores for outreach
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {selectedIds.size > 0 && (
            <>
              <Badge variant="secondary" className="gap-1">
                <Hash className="h-3 w-3" />
                {selectedIds.size} selected
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  fetchExistingLists();
                  setShowAddToList(true);
                }}
              >
                <ListPlus className="mr-1.5 h-3.5 w-3.5" />
                Add to List
              </Button>
              <Link
                href={`/campaigns/new?storeIds=${Array.from(selectedIds).join(",")}`}
              >
                <Button size="sm">
                  <Mail className="mr-1.5 h-3.5 w-3.5" />
                  Campaign
                </Button>
              </Link>
            </>
          )}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveSegment(true)}
            >
              <Zap className="mr-1.5 h-3.5 w-3.5" />
              Save Segment
            </Button>
          )}
          <ExportButton totalStores={total} />
        </div>
      </div>

      {/* ── Quick stats bar ───────────────────────────────────── */}
      <div className="flex items-center gap-4 rounded-lg border bg-muted/20 px-4 py-2 shrink-0">
        <div className="flex items-center gap-1.5 text-sm">
          <Store className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-semibold">{total.toLocaleString()}</span>
          <span className="text-muted-foreground">stores</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-1.5 text-sm">
          <AtSign className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-semibold">{stats.withEmail}</span>
          <span className="text-muted-foreground">with email</span>
          <span className="text-xs text-muted-foreground">(this page)</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-1.5 text-sm">
          <Flame className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-semibold">{stats.avgScore}</span>
          <span className="text-muted-foreground">avg score</span>
          <span className="text-xs text-muted-foreground">(this page)</span>
        </div>
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground">
          Page {page} of {totalPages}
        </span>
      </div>

      {/* ── Filter toggle + active chips ──────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap shrink-0">
        <Button
          variant={showFilters ? "secondary" : "outline"}
          size="sm"
          className="gap-1.5"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {hasActiveFilters && (
            <Badge
              variant="default"
              className="ml-0.5 h-4 w-4 p-0 text-[10px] rounded-full flex items-center justify-center"
            >
              {activeFilters.length}
            </Badge>
          )}
          {showFilters ? (
            <ChevronUp className="h-3 w-3 ml-0.5" />
          ) : (
            <ChevronDown className="h-3 w-3 ml-0.5" />
          )}
        </Button>

        {/* Active filter chips */}
        {activeFilters.map(([key, value]) => (
          <Badge
            key={key}
            variant="secondary"
            className="gap-1 pl-2 pr-1 py-0.5 text-xs cursor-default"
          >
            <span className="text-muted-foreground">
              {FILTER_LABELS[key] || key}:
            </span>
            <span className="font-medium">
              {formatFilterValue(key, value, knownApps)}
            </span>
            <button
              className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
              onClick={() => setFilter(key, null)}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </Badge>
        ))}
      </div>

      {/* ── Collapsible filter panel ──────────────────────────── */}
      {showFilters && (
        <div className="shrink-0">
          <StoreFilters
            knownApps={knownApps}
            availableCountries={availableCountries}
            appCategories={appCategories}
          />
        </div>
      )}

      {/* ── Store table (scrollable area with sticky header) ──── */}
      <div className="flex-1 min-h-0">
        <StoreTable
          stores={stores}
          loading={loading}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleAll={toggleAll}
        />
      </div>

      <div className="shrink-0">
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {/* ── Save as Segment Dialog ────────────────────────────── */}
      <Dialog open={showSaveSegment} onOpenChange={setShowSaveSegment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Save as Smart Segment
            </DialogTitle>
            <DialogDescription>
              Save your current filters as a reusable segment. The store list
              updates automatically as new stores match.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Active filters ({activeFilters.length}):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {activeFilters.map(([k, v]) => (
                  <Badge key={k} variant="secondary" className="text-xs">
                    {FILTER_LABELS[k] || k}:{" "}
                    {formatFilterValue(k, v, knownApps)}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Segment Name</Label>
              <Input
                placeholder="e.g. US stores without InvoiceForge"
                value={segmentName}
                onChange={(e) => setSegmentName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveSegment();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input
                placeholder="What is this segment for?"
                value={segmentDesc}
                onChange={(e) => setSegmentDesc(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {LIST_COLORS.map((c) => (
                  <button
                    key={c.value}
                    className={`h-7 w-7 rounded-full border-2 transition-all ${
                      segmentColor === c.value
                        ? "border-foreground scale-110"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: c.value }}
                    onClick={() => setSegmentColor(c.value)}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowSaveSegment(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveSegment}
                disabled={!segmentName.trim()}
              >
                <Zap className="mr-2 h-4 w-4" />
                Save Segment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Add to List Dialog ────────────────────────────────── */}
      <Dialog open={showAddToList} onOpenChange={setShowAddToList}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListPlus className="h-5 w-5 text-blue-500" />
              Add {selectedIds.size}{" "}
              {selectedIds.size === 1 ? "Store" : "Stores"} to List
            </DialogTitle>
            <DialogDescription>
              Choose an existing list or create a new one.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex gap-2">
              <Button
                variant={addMode === "existing" ? "default" : "outline"}
                size="sm"
                onClick={() => setAddMode("existing")}
              >
                Existing List
              </Button>
              <Button
                variant={addMode === "new" ? "default" : "outline"}
                size="sm"
                onClick={() => setAddMode("new")}
              >
                <Plus className="mr-1 h-3 w-3" />
                New List
              </Button>
            </div>

            {addMode === "existing" ? (
              <div className="space-y-2">
                {existingLists.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      No manual lists yet.
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setAddMode("new")}
                    >
                      Create one
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {existingLists.map((list) => (
                      <button
                        key={list.id}
                        className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                          selectedListId === String(list.id)
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => setSelectedListId(String(list.id))}
                      >
                        <div
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: list.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {list.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {list.memberCount} stores
                          </p>
                        </div>
                        {selectedListId === String(list.id) && (
                          <Check className="h-4 w-4 text-primary shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>List Name</Label>
                  <Input
                    placeholder="e.g. Priority outreach"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddToList();
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2">
                    {LIST_COLORS.map((c) => (
                      <button
                        key={c.value}
                        className={`h-6 w-6 rounded-full border-2 transition-all ${
                          newListColor === c.value
                            ? "border-foreground scale-110"
                            : "border-transparent hover:scale-105"
                        }`}
                        style={{ backgroundColor: c.value }}
                        onClick={() => setNewListColor(c.value)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowAddToList(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddToList}
                disabled={
                  addMode === "existing"
                    ? !selectedListId
                    : !newListName.trim()
                }
              >
                <ListPlus className="mr-2 h-4 w-4" />
                {addMode === "new" ? "Create & Add" : "Add to List"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
