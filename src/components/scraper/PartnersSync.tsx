"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShieldCheck,
  RefreshCw,
  Upload,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface SyncStatus {
  byApp: Record<
    string,
    { total: number; bySource: Record<string, number> }
  >;
  partnersConfigured: boolean;
  appsConfigured: string[];
  apps: { slug: string; name: string; category: string }[];
}

export function PartnersSync() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [csvText, setCsvText] = useState("");
  const [csvApp, setCsvApp] = useState<string>("all");

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      const res = await fetch("/api/confirmed-installs");
      const data = await res.json();
      setStatus(data);
    } catch {
      console.error("Failed to fetch sync status");
    }
  }

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/confirmed-installs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      });
      const data = await res.json();
      setSyncResult(data);
      fetchStatus(); // refresh counts
    } catch (err) {
      setSyncResult({
        success: false,
        errors: ["Network error — check console"],
      });
    } finally {
      setSyncing(false);
    }
  }

  async function handleCsvImport() {
    if (!csvText.trim()) return;
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch("/api/confirmed-installs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "csv",
          csv: csvText,
          app: csvApp === "all" ? undefined : csvApp,
        }),
      });
      const data = await res.json();
      setImportResult(data);
      if (data.success) {
        setCsvText("");
        fetchStatus();
      }
    } catch {
      setImportResult({ error: "Network error" });
    } finally {
      setImporting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-green-600" />
          <div>
            <CardTitle>Our App Installs</CardTitle>
            <CardDescription>
              Sync confirmed installs of our admin-only apps (InvoiceForge,
              SubsExport, Track Your Traffic) to avoid false gap analysis.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        {status && (
          <div className="grid grid-cols-3 gap-3">
            {status.apps.map((app) => {
              const info = status.byApp[app.slug];
              return (
                <div
                  key={app.slug}
                  className="rounded-md border px-3 py-2 text-center"
                >
                  <p className="text-xs font-medium text-muted-foreground">
                    {app.name}
                  </p>
                  <p className="text-lg font-bold">{info?.total || 0}</p>
                  <p className="text-[10px] text-muted-foreground">
                    confirmed installs
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Partners API Sync */}
        <div className="space-y-2 rounded-md border p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                Shopify Partners API Sync
              </p>
              <p className="text-xs text-muted-foreground">
                {status?.partnersConfigured ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Configured ({status.appsConfigured.length}/3 apps)
                  </span>
                ) : (
                  <span className="text-orange-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Not configured — set SHOPIFY_PARTNERS_TOKEN and
                    SHOPIFY_PARTNERS_ORG_ID in env
                  </span>
                )}
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleSync}
              disabled={syncing || !status?.partnersConfigured}
            >
              <RefreshCw
                className={`mr-1.5 h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`}
              />
              {syncing ? "Syncing..." : "Sync Now"}
            </Button>
          </div>

          {syncResult && (
            <div className="rounded bg-muted/50 p-2 text-xs space-y-1">
              {syncResult.success ? (
                <>
                  <p className="text-green-700 font-medium">
                    Sync complete!
                  </p>
                  {syncResult.apps?.map((app: any) => (
                    <p key={app.slug}>
                      {app.name}: {app.installations} installations
                      {app.error && (
                        <span className="text-destructive ml-1">
                          ({app.error})
                        </span>
                      )}
                    </p>
                  ))}
                  <p className="text-muted-foreground">
                    {syncResult.totalMatched} matched to existing stores
                  </p>
                </>
              ) : (
                <p className="text-destructive">
                  {syncResult.errors?.join(", ")}
                </p>
              )}
            </div>
          )}
        </div>

        {/* CSV Import */}
        <div className="space-y-2 rounded-md border p-3">
          <p className="text-sm font-medium">CSV Import</p>
          <p className="text-xs text-muted-foreground">
            Paste a list of store domains (one per line, or CSV with
            &ldquo;domain,app&rdquo; columns). Export from your Shopify Partners
            dashboard.
          </p>

          <div className="space-y-2">
            <Label className="text-xs">App</Label>
            <Select value={csvApp} onValueChange={(v) => setCsvApp(v || "all")}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All our apps</SelectItem>
                <SelectItem value="invoiceforge">InvoiceForge</SelectItem>
                <SelectItem value="subsexport">SubsExport</SelectItem>
                <SelectItem value="track-your-traffic">
                  Track Your Traffic
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <textarea
            className="w-full h-24 rounded-md border px-3 py-2 text-sm font-mono resize-y"
            placeholder={`store1.myshopify.com\nstore2.myshopify.com\nor: domain,app\nstore1.myshopify.com,invoiceforge`}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
          />

          <Button
            size="sm"
            variant="outline"
            onClick={handleCsvImport}
            disabled={importing || !csvText.trim()}
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            {importing ? "Importing..." : "Import CSV"}
          </Button>

          {importResult && (
            <div className="rounded bg-muted/50 p-2 text-xs">
              {importResult.success ? (
                <p className="text-green-700">
                  Imported {importResult.inserted} entries,{" "}
                  {importResult.matched} matched to stores
                </p>
              ) : (
                <p className="text-destructive">
                  {importResult.error ||
                    importResult.errors?.join(", ")}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
