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
  Compass,
  Globe,
  Plus,
  X,
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
  batchResults?: { url: string; valid: boolean; signals?: string[]; isNew?: boolean }[];
  error?: string;
  // Discover-specific
  phase?: string;
  currentApp?: string;
  currentPage?: number;
  merchantNames?: string[];
  // Auto follow-up scan after discovery
  followUpJobId?: number;
  followUpTotal?: number;
  newUrlsFound?: number;
  totalCandidates?: number;
  scrapeComplete?: boolean;
  message?: string;
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

// ---------- Discoverable Apps (client-side copy for UI) ----------

const DISCOVERABLE_APPS = [
  { slug: "judgeme", name: "Judge.me", category: "Reviews" },
  { slug: "klaviyo-email-marketing", name: "Klaviyo", category: "Email Marketing" },
  { slug: "privy", name: "Privy", category: "Pop-ups" },
  { slug: "omnisend", name: "Omnisend", category: "Email Marketing" },
  { slug: "smile-io", name: "Smile.io", category: "Loyalty" },
  { slug: "loox", name: "Loox", category: "Reviews" },
  { slug: "aftership-order-tracking", name: "AfterShip", category: "Shipping" },
  { slug: "yotpo-social-reviews", name: "Yotpo", category: "Reviews" },
  { slug: "pagefly", name: "PageFly", category: "Page Builders" },
  { slug: "reconvert-upsell-cross-sell", name: "ReConvert", category: "Upsell" },
  { slug: "shopify-email", name: "Shopify Email", category: "Email Marketing" },
  { slug: "stamped-io", name: "Stamped", category: "Reviews" },
  { slug: "vitals", name: "Vitals", category: "All-in-One" },
  { slug: "seo-optimizer", name: "SEO Booster", category: "SEO" },
  { slug: "gorgias", name: "Gorgias", category: "Chat & Support" },
  { slug: "rebuy-personalization-engine", name: "Rebuy", category: "Upsell" },
  { slug: "okendo", name: "Okendo", category: "Reviews" },
  { slug: "attentive", name: "Attentive", category: "SMS Marketing" },
  { slug: "postscript-sms-marketing", name: "Postscript", category: "SMS Marketing" },
  { slug: "recharge", name: "Recharge", category: "Subscriptions" },
];

// Group by category for the UI
const DISCOVER_CATEGORIES = DISCOVERABLE_APPS.reduce<Record<string, typeof DISCOVERABLE_APPS>>((acc, app) => {
  if (!acc[app.category]) acc[app.category] = [];
  acc[app.category].push(app);
  return acc;
}, {});

export function ScraperClient({ initialJobs }: { initialJobs: Job[] }) {
  const [tab, setTab] = useState<"scan" | "import" | "discover">("scan");
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

  // Discover
  const [discoverApps, setDiscoverApps] = useState<string[]>(
    DISCOVERABLE_APPS.map((a) => a.slug)
  );
  const [customApps, setCustomApps] = useState<{ slug: string; name: string }[]>([]);
  const [customAppInput, setCustomAppInput] = useState("");
  const [customAppError, setCustomAppError] = useState<string | null>(null);
  const [pagesPerApp, setPagesPerApp] = useState(3);
  const [maxStores, setMaxStores] = useState(200);
  const [discoverPhase, setDiscoverPhase] = useState<"scrape" | "validate" | "scan">("scrape");

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

        // Build log entry based on job type
        let logEntry = "";
        if (data.phase === "scrape" && data.currentApp) {
          // Discover scrape phase — show merchant names found
          const namePreview = data.merchantNames && data.merchantNames.length > 0
            ? ` → found: ${data.merchantNames.slice(0, 4).join(", ")}${data.merchantNames.length > 4 ? ` +${data.merchantNames.length - 4} more` : ""}`
            : " → no merchants found";
          logEntry = `🔍 ${data.currentApp} p${data.currentPage}${namePreview} (${data.newUrlsFound} candidates, ${data.totalCandidates} total)`;
        } else if (data.scrapeComplete) {
          logEntry = `✅ Scrape complete! ${data.totalCandidates} candidate URLs found. Starting validation...`;
        } else if (data.current) {
          logEntry = `${data.current.success ? "✓" : "✗"} ${data.current.url}${
            data.current.result
              ? ` → ${data.current.result.name || "unnamed"}, ${data.current.result.apps} apps, ${data.current.result.email || "no email"}`
              : ""
          }`;
        } else if (data.batchResults) {
          logEntry = data.batchResults
            .map((r) => {
              const prefix = r.valid ? (r.isNew === false ? "⊘" : "✓") : "✗";
              return `${prefix} ${r.url} (${r.signals?.join(", ") || ""})`;
            })
            .join("\n");
        } else if (data.message) {
          logEntry = `ℹ ${data.message}`;
        } else if (data.error) {
          logEntry = `⚠ Error: ${data.error}`;
        }

        // Update discover phase tracking
        if (data.phase) {
          setDiscoverPhase(data.phase as "scrape" | "validate");
        }

        // Update total if transitioning phases
        const newTotal = data.scrapeComplete ? (data.totalCandidates || total) : (data.total || total);

        setActiveJob((prev) =>
          prev
            ? {
                ...prev,
                processed: data.processed,
                total: newTotal,
                status: data.status,
                updated: data.updated ?? data.discovered ?? prev.updated,
                failed: data.failed ?? prev.failed,
                log: logEntry
                  ? [...prev.log.slice(-49), ...logEntry.split("\n")]
                  : prev.log,
              }
            : null
        );

        if ((data.status === "completed" || data.status === "completing") && data.followUpJobId) {
          // Discovery finished — seamlessly transition to auto-scan
          const scanTotal = data.followUpTotal || 0;
          setDiscoverPhase("scan");
          setActiveJob((prev) =>
            prev
              ? {
                  ...prev,
                  id: data.followUpJobId!,
                  processed: 0,
                  total: scanTotal,
                  status: "running",
                  updated: 0,
                  failed: 0,
                  log: [
                    ...prev.log,
                    `\n📊 Phase 3: Auto-scanning ${scanTotal} discovered stores for apps, email, & details...`,
                  ],
                }
              : null
          );
          pollingRef.current = setTimeout(
            () => pollBatch(data.followUpJobId!, scanTotal),
            500
          );
          refreshJobs();
        } else if (data.status === "completed" || data.status === "completing") {
          // Job finished — refresh job list
          if (pollingRef.current) clearTimeout(pollingRef.current);
          setActiveJob((prev) =>
            prev ? { ...prev, status: "completed" } : null
          );
          refreshJobs();
        } else if (data.status === "running") {
          pollingRef.current = setTimeout(() => pollBatch(jobId, newTotal), 500);
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

  // Add a custom app by URL or slug
  const addCustomApp = () => {
    const raw = customAppInput.trim();
    if (!raw) return;

    setCustomAppError(null);

    // Parse slug from URL or raw slug
    let slug = raw;
    try {
      if (raw.includes("apps.shopify.com")) {
        const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
        // URL like https://apps.shopify.com/some-app or https://apps.shopify.com/some-app/reviews
        const pathParts = url.pathname.split("/").filter(Boolean);
        slug = pathParts[0] || "";
      } else if (raw.includes("/")) {
        // Could be a partial path like "apps.shopify.com/some-app"
        const parts = raw.split("/").filter(Boolean);
        slug = parts[parts.length - 1] || "";
      }
    } catch {
      // Treat as raw slug
    }

    // Clean the slug
    slug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "");

    if (!slug) {
      setCustomAppError("Could not parse app slug from input");
      return;
    }

    // Check if already exists in predefined list
    if (DISCOVERABLE_APPS.some((a) => a.slug === slug)) {
      setDiscoverApps((prev) => prev.includes(slug) ? prev : [...prev, slug]);
      setCustomAppInput("");
      setCustomAppError(`"${slug}" is already in the list — selected it for you`);
      setTimeout(() => setCustomAppError(null), 3000);
      return;
    }

    // Check if already in custom list
    const finalSlug = slug; // capture for closure
    setCustomApps((prev) => {
      if (prev.some((a) => a.slug === finalSlug)) {
        setCustomAppError(`"${finalSlug}" is already added`);
        return prev;
      }
      // Derive a display name from the slug
      const name = finalSlug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      return [...prev, { slug: finalSlug, name }];
    });

    setDiscoverApps((prev) => prev.includes(finalSlug) ? prev : [...prev, finalSlug]);
    setCustomAppInput("");
  };

  const removeCustomApp = (slug: string) => {
    setCustomApps((prev) => prev.filter((a) => a.slug !== slug));
    setDiscoverApps((prev) => prev.filter((s) => s !== slug));
  };

  // Start discover job
  const startDiscover = async () => {
    if (discoverApps.length === 0) {
      alert("Please select at least one app to discover stores from.");
      return;
    }

    setIsStarting(true);
    setDiscoverPhase("scrape");
    try {
      const res = await fetch("/api/scraper/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "discover",
          appSlugs: discoverApps,
          pagesPerApp,
          maxStores,
          mode,
        }),
      });
      const data = await res.json();

      setActiveJob({
        id: data.job.id,
        total: data.totalTarget,
        processed: 0,
        status: "running",
        log: [
          `🚀 Discovering stores from ${discoverApps.length} app review pages (${pagesPerApp} pages each)...`,
          `Phase 1: Scraping ${data.totalTarget} review pages for store URLs...`,
        ],
        updated: 0,
        failed: 0,
      });

      pollingRef.current = setTimeout(
        () => pollBatch(data.job.id, data.totalTarget),
        200
      );
    } catch (err) {
      alert("Failed to start discovery: " + err);
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
          variant={tab === "discover" ? "default" : "outline"}
          onClick={() => setTab("discover")}
          className="gap-2"
        >
          <Compass className="h-4 w-4" />
          Discover New
        </Button>
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

      {/* ── Discover Tab ── */}
      {tab === "discover" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Compass className="h-5 w-5" />
              Discover New Stores
            </CardTitle>
            <CardDescription>
              Find new Shopify stores by scraping app review pages on the Shopify
              App Store. Stores that left reviews are extracted, validated, and
              added to your database automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* App selection */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Apps to scrape reviews from
                </Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setDiscoverApps([
                        ...DISCOVERABLE_APPS.map((a) => a.slug),
                        ...customApps.map((a) => a.slug),
                      ])
                    }
                    className="text-xs text-primary hover:underline"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDiscoverApps(customApps.map((a) => a.slug))
                    }
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="space-y-3 rounded-lg border bg-muted/30 p-4 max-h-64 overflow-y-auto">
                {Object.entries(DISCOVER_CATEGORIES).map(([category, apps]) => (
                  <div key={category}>
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {category}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const slugs = apps.map((a) => a.slug);
                          const allSelected = slugs.every((s) =>
                            discoverApps.includes(s)
                          );
                          if (allSelected) {
                            setDiscoverApps(
                              discoverApps.filter((s) => !slugs.includes(s))
                            );
                          } else {
                            setDiscoverApps([
                              ...new Set([...discoverApps, ...slugs]),
                            ]);
                          }
                        }}
                        className="text-[10px] text-primary hover:underline"
                      >
                        {apps.every((a) => discoverApps.includes(a.slug))
                          ? "deselect"
                          : "select all"}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {apps.map((app) => {
                        const selected = discoverApps.includes(app.slug);
                        return (
                          <button
                            key={app.slug}
                            type="button"
                            onClick={() => {
                              if (selected) {
                                setDiscoverApps(
                                  discoverApps.filter((s) => s !== app.slug)
                                );
                              } else {
                                setDiscoverApps([...discoverApps, app.slug]);
                              }
                            }}
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs transition-colors ${
                              selected
                                ? "border-primary bg-primary/10 text-primary font-medium"
                                : "border-muted-foreground/20 text-muted-foreground hover:border-muted-foreground/40"
                            }`}
                          >
                            {app.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Custom apps section */}
                {customApps.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Custom
                    </span>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {customApps.map((app) => (
                        <span
                          key={app.slug}
                          className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                        >
                          {app.name}
                          <button
                            type="button"
                            onClick={() => removeCustomApp(app.slug)}
                            className="ml-0.5 rounded-full p-0.5 hover:bg-emerald-200 dark:hover:bg-emerald-800"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Add custom app input */}
              <div className="mt-2 flex items-start gap-2">
                <div className="flex-1">
                  <div className="flex gap-2">
                    <Input
                      value={customAppInput}
                      onChange={(e) => {
                        setCustomAppInput(e.target.value);
                        setCustomAppError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomApp();
                        }
                      }}
                      placeholder="https://apps.shopify.com/your-app  or  app-slug"
                      className="text-sm h-8"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addCustomApp}
                      disabled={!customAppInput.trim()}
                      className="gap-1 shrink-0 h-8"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </Button>
                  </div>
                  {customAppError && (
                    <p className="mt-1 text-xs text-orange-600">{customAppError}</p>
                  )}
                </div>
              </div>

              <p className="mt-1.5 text-xs text-muted-foreground">
                {discoverApps.length} apps selected
                {customApps.length > 0 && (
                  <span> ({customApps.length} custom)</span>
                )}
              </p>
            </div>

            {/* Settings row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label className="mb-1.5 block text-sm font-medium">
                  Pages per app
                </Label>
                <Input
                  type="number"
                  value={pagesPerApp}
                  onChange={(e) =>
                    setPagesPerApp(
                      Math.max(1, Math.min(10, parseInt(e.target.value) || 1))
                    )
                  }
                  min={1}
                  max={10}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Each page has ~10 reviews
                </p>
              </div>

              <div>
                <Label className="mb-1.5 block text-sm font-medium">
                  Max stores to validate
                </Label>
                <Input
                  type="number"
                  value={maxStores}
                  onChange={(e) =>
                    setMaxStores(
                      Math.max(10, Math.min(1000, parseInt(e.target.value) || 200))
                    )
                  }
                  min={10}
                  max={1000}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Caps how many candidate URLs to validate
                </p>
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
                      Quick (validate only)
                    </SelectItem>
                    <SelectItem value="full">
                      Full (validate + extract)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* How it works info */}
            <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-900 dark:bg-blue-950/20">
              <p className="text-xs text-blue-800 dark:text-blue-300">
                <strong>How it works:</strong> Phase 1 scrapes Shopify App Store
                review pages and extracts merchant names from reviews. These names
                are converted into candidate .myshopify.com URLs. Phase 2 validates
                each candidate by checking /products.json to confirm it&apos;s a real
                Shopify store, then adds it to your database. Total review pages:{" "}
                <strong>{discoverApps.length * pagesPerApp}</strong>
              </p>
            </div>

            {/* Start button */}
            <div className="flex items-center justify-between border-t pt-4">
              <div className="text-sm text-muted-foreground">
                Will scrape{" "}
                <span className="font-semibold text-foreground">
                  {discoverApps.length * pagesPerApp}
                </span>{" "}
                review pages, then validate up to{" "}
                <span className="font-semibold text-foreground">
                  {maxStores}
                </span>{" "}
                stores
              </div>
              <Button
                onClick={startDiscover}
                disabled={
                  isStarting ||
                  (activeJob !== null && activeJob.status === "running") ||
                  discoverApps.length === 0
                }
                className="gap-2"
              >
                {isStarting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Globe className="h-4 w-4" />
                )}
                Start Discovery
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
                  ? tab === "discover"
                    ? discoverPhase === "scrape"
                      ? "Discovering URLs..."
                      : discoverPhase === "validate"
                        ? "Validating Stores..."
                        : "Scanning Stores..."
                    : "Scanning..."
                  : activeJob.status === "completed"
                    ? tab === "discover"
                      ? "Discovery Complete"
                      : "Scan Complete"
                    : "Stopped"}
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
              {tab === "discover" && discoverPhase === "scrape" ? (
                <div>
                  <span className="text-muted-foreground">Phase: </span>
                  <span className="font-medium text-blue-600">
                    Scraping review pages
                  </span>
                </div>
              ) : tab === "discover" && discoverPhase === "scan" ? (
                <>
                  <div>
                    <span className="text-muted-foreground">Phase: </span>
                    <span className="font-medium text-purple-600">
                      Scanning stores
                    </span>
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
                </>
              ) : (
                <>
                  <div>
                    <span className="text-muted-foreground">
                      {tab === "discover" || tab === "import" ? "Discovered: " : "Updated: "}
                    </span>
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
                </>
              )}
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
                          : line.startsWith("⊘")
                            ? "text-muted-foreground/70"
                            : line.startsWith("🔍") || line.startsWith("🚀")
                              ? "text-blue-600"
                              : line.startsWith("✅")
                                ? "text-green-600 font-medium"
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
