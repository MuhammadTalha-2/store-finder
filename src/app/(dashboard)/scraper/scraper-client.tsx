"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Play,
  Square,
  Upload,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  ScanLine,
} from "lucide-react";

// ---------- Types ----------

interface AppInfo {
  slug: string;
  name: string;
  isCompetitor: boolean;
}

interface AppCategories {
  [category: string]: AppInfo[];
}

interface JobMetadata {
  type: string;
  cursor: number;
  urls?: string[];
  queue?: number[];
  mode?: string;
  filters?: Record<string, unknown>;
  [key: string]: unknown;
}

interface Job {
  id: number;
  source: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  storesDiscovered: number;
  storesUpdated: number;
  storesFailed: number;
  errorMessage: string | null;
  metadata: JobMetadata | null;
}

interface BatchResult {
  status: string;
  processed: number;
  total: number;
  updated?: number;
  failed?: number;
  discovered?: number;
  current?: {
    url: string;
    success: boolean;
    result: {
      name: string | null;
      apps: number;
      email: string | null;
      country: string | null;
      products: number;
    } | null;
  };
  batchResults?: { url: string; valid: boolean; signals?: string[] }[];
  error?: string;
}

// ---------- Category labels ----------

const CATEGORY_LABELS: Record<string, string> = {
  "email-marketing": "Email Marketing",
  reviews: "Reviews",
  loyalty: "Loyalty & Rewards",
  analytics: "Analytics & Tracking",
  upsell: "Upsell & Cross-sell",
  subscriptions: "Subscriptions",
  chat: "Chat & Support",
  "page-builders": "Page Builders",
  shipping: "Shipping & Order Tracking",
  popups: "Pop-ups & Lead Capture",
  "social-proof": "Social Proof & Urgency",
  seo: "SEO",
  search: "Search & Navigation",
  referral: "Referral & Affiliate",
  wishlist: "Wishlist & Saved Items",
  "size-guide": "Size Guide & Product Tools",
  invoicing: "Invoicing",
  "currency-language": "Currency & Language",
  "back-in-stock": "Back in Stock & Notifications",
  "countdown-urgency": "Countdown & Urgency",
  returns: "Returns",
  "age-verification": "Age Verification",
  inshalytics: "Inshalytics Apps",
  misc: "Misc Popular",
};

// ---------- Multi Select Component ----------

function MultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Select...",
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <Label className="mb-1.5 block text-sm font-medium">{label}</Label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex min-h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background hover:bg-accent/50"
      >
        <span className="flex flex-wrap gap-1 truncate text-muted-foreground">
          {value.length === 0
            ? placeholder
            : value.length <= 2
              ? value.map((v) => (
                  <Badge key={v} variant="secondary" className="text-xs">
                    {options.find((o) => o.value === v)?.label || v}
                  </Badge>
                ))
              : `${value.length} selected`}
        </span>
        {open ? (
          <ChevronUp className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        ) : (
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        )}
      </button>
      {open && (
        <div className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                if (value.includes(opt.value)) {
                  onChange(value.filter((v) => v !== opt.value));
                } else {
                  onChange([...value, opt.value]);
                }
              }}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            >
              <div
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                  value.includes(opt.value)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30"
                }`}
              >
                {value.includes(opt.value) && (
                  <CheckCircle2 className="h-3 w-3" />
                )}
              </div>
              <span className="truncate">{opt.label}</span>
            </button>
          ))}
          {value.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mt-1 w-full rounded-sm border-t px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Main Component ----------

export function ScraperClient({ initialJobs }: { initialJobs: Job[] }) {
  const [tab, setTab] = useState<"scan" | "import">("scan");
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [apps, setApps] = useState<AppCategories>({});
  const [allApps, setAllApps] = useState<AppInfo[]>([]);

  // Scan filters
  const [target, setTarget] = useState("unscraped");
  const [staleDays, setStaleDays] = useState(7);
  const [mode, setMode] = useState("quick");
  const [appCategory, setAppCategory] = useState<string[]>([]);
  const [hasApp, setHasApp] = useState<string[]>([]);
  const [missingApp, setMissingApp] = useState<string[]>([]);
  const [country, setCountry] = useState<string[]>([]);
  const [hasEmail, setHasEmail] = useState<string>("any");
  const [limit, setLimit] = useState(100);
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Import
  const [importUrls, setImportUrls] = useState("");

  // Active job
  const [activeJob, setActiveJob] = useState<{
    id: number;
    total: number;
    processed: number;
    status: string;
    log: string[];
    updated: number;
    failed: number;
  } | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Load apps on mount
  useEffect(() => {
    fetch("/api/scraper/apps")
      .then((r) => r.json())
      .then((data) => {
        setApps(data.categories);
        setAllApps(data.apps);
      })
      .catch(console.error);
  }, []);

  // Count matching stores when scan filters change
  useEffect(() => {
    if (tab !== "scan") return;
    const timer = setTimeout(() => {
      fetch("/api/scraper/count", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target,
          staleDays,
          appCategory: appCategory.length > 0 ? appCategory : undefined,
          hasApp: hasApp.length > 0 ? hasApp : undefined,
          missingApp: missingApp.length > 0 ? missingApp : undefined,
          country: country.length > 0 ? country : undefined,
          hasEmail:
            hasEmail === "yes" ? true : hasEmail === "no" ? false : undefined,
        }),
      })
        .then((r) => r.json())
        .then((data) => setMatchCount(data.count))
        .catch(() => setMatchCount(null));
    }, 300);
    return () => clearTimeout(timer);
  }, [tab, target, staleDays, appCategory, hasApp, missingApp, country, hasEmail]);

  // Polling function
  const pollBatch = useCallback(
    async (jobId: number, total: number) => {
      try {
        const res = await fetch(`/api/scraper/jobs/${jobId}/batch`, {
          method: "POST",
        });
        const data: BatchResult = await res.json();

        const logEntry =
          data.current
            ? `${data.current.success ? "✓" : "✗"} ${data.current.url}${
                data.current.result
                  ? ` → ${data.current.result.name || "unnamed"}, ${data.current.result.apps} apps, ${data.current.result.email || "no email"}`
                  : ""
              }`
            : data.batchResults
              ? data.batchResults
                  .map(
                    (r) =>
                      `${r.valid ? "✓" : "✗"} ${r.url} (${r.signals?.join(", ") || ""})`
                  )
                  .join("\n")
              : data.error
                ? `⚠ Error: ${data.error}`
                : "";

        setActiveJob((prev) =>
          prev
            ? {
                ...prev,
                processed: data.processed,
                status: data.status,
                updated: data.updated ?? data.discovered ?? prev.updated,
                failed: data.failed ?? prev.failed,
                log: logEntry
                  ? [...prev.log.slice(-49), logEntry]
                  : prev.log,
              }
            : null
        );

        if (data.status === "completed" || data.status === "completing") {
          // Job finished — refresh job list
          if (pollingRef.current) clearTimeout(pollingRef.current);
          setActiveJob((prev) =>
            prev ? { ...prev, status: "completed" } : null
          );
          refreshJobs();
        } else if (data.status === "running") {
          pollingRef.current = setTimeout(() => pollBatch(jobId, total), 500);
        }
      } catch (err) {
        console.error("Polling error:", err);
        pollingRef.current = setTimeout(() => pollBatch(jobId, total), 2000);
      }
    },
    []
  );

  const refreshJobs = async () => {
    try {
      const res = await fetch("/api/scraper/jobs");
      const data = await res.json();
      setJobs(data.jobs);
    } catch {
      // Ignore
    }
  };

  // Start scan job
  const startScan = async () => {
    setIsStarting(true);
    try {
      const res = await fetch("/api/scraper/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "scan",
          mode,
          target,
          staleDays,
          limit,
          appCategory: appCategory.length > 0 ? appCategory : undefined,
          hasApp: hasApp.length > 0 ? hasApp : undefined,
          missingApp: missingApp.length > 0 ? missingApp : undefined,
          country: country.length > 0 ? country : undefined,
          hasEmail:
            hasEmail === "yes" ? true : hasEmail === "no" ? false : undefined,
        }),
      });
      const data = await res.json();

      if (data.totalTarget === 0) {
        setIsStarting(false);
        alert("No stores match the current filters.");
        return;
      }

      setActiveJob({
        id: data.job.id,
        total: data.totalTarget,
        processed: 0,
        status: "running",
        log: [`Starting scan of ${data.totalTarget} stores (mode: ${mode})...`],
        updated: 0,
        failed: 0,
      });

      pollingRef.current = setTimeout(
        () => pollBatch(data.job.id, data.totalTarget),
        200
      );
    } catch (err) {
      alert("Failed to start job: " + err);
    } finally {
      setIsStarting(false);
    }
  };

  // Start import job
  const startImport = async () => {
    const urls = importUrls
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter(Boolean);

    if (urls.length === 0) {
      alert("Please enter at least one URL.");
      return;
    }

    setIsStarting(true);
    try {
      const res = await fetch("/api/scraper/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "import", urls, mode }),
      });
      const data = await res.json();

      setActiveJob({
        id: data.job.id,
        total: data.totalTarget,
        processed: 0,
        status: "running",
        log: [`Importing ${data.totalTarget} URLs...`],
        updated: 0,
        failed: 0,
      });

      pollingRef.current = setTimeout(
        () => pollBatch(data.job.id, data.totalTarget),
        200
      );
    } catch (err) {
      alert("Failed to start import: " + err);
    } finally {
      setIsStarting(false);
    }
  };

  // Stop job
  const stopJob = async () => {
    if (!activeJob) return;
    if (pollingRef.current) clearTimeout(pollingRef.current);
    try {
      await fetch(`/api/scraper/jobs/${activeJob.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop" }),
      });
      setActiveJob((prev) => (prev ? { ...prev, status: "stopped" } : null));
      refreshJobs();
    } catch {
      // Ignore
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearTimeout(pollingRef.current);
    };
  }, []);

  // Flat app list for multi-select
  const appOptions = allApps.map((a) => ({ value: a.slug, label: a.name }));
  const categoryOptions = Object.keys(apps).map((c) => ({
    value: c,
    label: CATEGORY_LABELS[c] || c,
  }));

  const COUNTRIES = [
    "US", "GB", "CA", "AU", "DE", "FR", "IN", "BR", "JP", "NZ",
    "NL", "IT", "ES", "SE", "NO", "DK", "CH", "PL", "MX", "ZA",
    "SG", "HK", "KR", "AE", "SA", "IL", "TW", "TH", "MY", "PH",
  ];

  const progress =
    activeJob && activeJob.total > 0
      ? Math.round((activeJob.processed / activeJob.total) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Tab selector */}
      <div className="flex gap-2">
        <Button
          variant={tab === "scan" ? "default" : "outline"}
          onClick={() => setTab("scan")}
          className="gap-2"
        >
          <ScanLine className="h-4 w-4" />
          Scan Stores
        </Button>
        <Button
          variant={tab === "import" ? "default" : "outline"}
          onClick={() => setTab("import")}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Import URLs
        </Button>
      </div>

      {/* ── Scan Tab ── */}
      {tab === "scan" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Scan Stores
            </CardTitle>
            <CardDescription>
              Re-scan existing stores to extract data and detect installed apps.
              Apply filters to target specific stores.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Row 1: Target + Mode + Limit */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label className="mb-1.5 block text-sm font-medium">
                  Target
                </Label>
                <Select value={target} onValueChange={(v) => v && setTarget(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unscraped">Unscraped only</SelectItem>
                    <SelectItem value="stale">
                      Stale ({staleDays}+ days)
                    </SelectItem>
                    <SelectItem value="all">All stores</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-1.5 block text-sm font-medium">
                  Scan Mode
                </Label>
                <Select value={mode} onValueChange={(v) => v && setMode(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quick">
                      Quick (homepage only)
                    </SelectItem>
                    <SelectItem value="full">
                      Full (+ contact page, products)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-1.5 block text-sm font-medium">
                  Limit
                </Label>
                <Input
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value) || 100)}
                  min={1}
                  max={500}
                />
              </div>
            </div>

            {target === "stale" && (
              <div className="max-w-xs">
                <Label className="mb-1.5 block text-sm font-medium">
                  Stale after (days)
                </Label>
                <Input
                  type="number"
                  value={staleDays}
                  onChange={(e) => setStaleDays(parseInt(e.target.value) || 7)}
                  min={1}
                  max={90}
                />
              </div>
            )}

            {/* Advanced filters toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              Advanced Filters
              {(appCategory.length > 0 ||
                hasApp.length > 0 ||
                missingApp.length > 0 ||
                country.length > 0 ||
                hasEmail !== "any") && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  Active
                </Badge>
              )}
            </button>

            {showAdvanced && (
              <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <MultiSelect
                    label="App Category"
                    options={categoryOptions}
                    value={appCategory}
                    onChange={setAppCategory}
                    placeholder="Any category"
                  />

                  <MultiSelect
                    label="Country"
                    options={COUNTRIES.map((c) => ({ value: c, label: c }))}
                    value={country}
                    onChange={setCountry}
                    placeholder="Any country"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <MultiSelect
                    label="Has App (installed)"
                    options={appOptions}
                    value={hasApp}
                    onChange={setHasApp}
                    placeholder="Any apps"
                  />

                  <MultiSelect
                    label="Missing App (not installed)"
                    options={appOptions}
                    value={missingApp}
                    onChange={setMissingApp}
                    placeholder="Any apps"
                  />
                </div>

                <div className="max-w-xs">
                  <Label className="mb-1.5 block text-sm font-medium">
                    Has Email
                  </Label>
                  <Select value={hasEmail} onValueChange={(v) => v && setHasEmail(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No (missing)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Match count + Start */}
            <div className="flex items-center justify-between border-t pt-4">
              <div className="text-sm text-muted-foreground">
                {matchCount !== null ? (
                  <>
                    <span className="font-semibold text-foreground">
                      {matchCount}
                    </span>{" "}
                    stores match
                    {matchCount > limit && (
                      <span className="ml-1">
                        (will scan first {limit})
                      </span>
                    )}
                  </>
                ) : (
                  "Counting..."
                )}
              </div>
              <Button
                onClick={startScan}
                disabled={
                  isStarting ||
                  (activeJob !== null && activeJob.status === "running") ||
                  matchCount === 0
                }
                className="gap-2"
              >
                {isStarting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Start Scan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Import Tab ── */}
      {tab === "import" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Store URLs
            </CardTitle>
            <CardDescription>
              Paste store URLs (one per line or comma-separated). Each URL will be
              validated as a Shopify store before being added to the database.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={importUrls}
              onChange={(e) => setImportUrls(e.target.value)}
              placeholder={`https://gymshark.com\nhttps://allbirds.com\nhttps://fashionnova.com`}
              rows={8}
              className="font-mono text-sm"
            />
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {importUrls.trim()
                  ? `${importUrls.split(/[\n,]+/).filter((u) => u.trim()).length} URLs`
                  : "Enter URLs above"}
              </div>
              <Button
                onClick={startImport}
                disabled={
                  isStarting ||
                  (activeJob !== null && activeJob.status === "running") ||
                  !importUrls.trim()
                }
                className="gap-2"
              >
                {isStarting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Import & Validate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Active Job ── */}
      {activeJob && (
        <Card
          className={
            activeJob.status === "completed"
              ? "border-green-500/50"
              : activeJob.status === "stopped"
                ? "border-orange-500/50"
                : "border-blue-500/50"
          }
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                {activeJob.status === "running" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                ) : activeJob.status === "completed" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                )}
                {activeJob.status === "running"
                  ? "Scanning..."
                  : activeJob.status === "completed"
                    ? "Scan Complete"
                    : "Scan Stopped"}
              </CardTitle>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {activeJob.processed}/{activeJob.total}
                </span>
                {activeJob.status === "running" && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={stopJob}
                    className="gap-1"
                  >
                    <Square className="h-3 w-3" />
                    Stop
                  </Button>
                )}
                {activeJob.status !== "running" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveJob(null)}
                  >
                    Dismiss
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Progress bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  activeJob.status === "completed"
                    ? "bg-green-500"
                    : activeJob.status === "stopped"
                      ? "bg-orange-500"
                      : "bg-blue-500"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Stats */}
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Progress: </span>
                <span className="font-medium">{progress}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">Updated: </span>
                <span className="font-medium text-green-600">
                  {activeJob.updated}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Failed: </span>
                <span className="font-medium text-red-600">
                  {activeJob.failed}
                </span>
              </div>
            </div>

            {/* Log */}
            <div className="max-h-40 overflow-y-auto rounded-md bg-muted/50 p-3 font-mono text-xs">
              {activeJob.log.map((line, i) => (
                <div
                  key={i}
                  className={
                    line.startsWith("✓")
                      ? "text-green-600"
                      : line.startsWith("✗")
                        ? "text-red-600"
                        : line.startsWith("⚠")
                          ? "text-orange-600"
                          : "text-muted-foreground"
                  }
                >
                  {line}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
