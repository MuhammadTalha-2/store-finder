"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Mail,
  Globe,
  ShoppingBag,
  FolderOpen,
  BookOpen,
  Clock,
  Copy,
  Check,
} from "lucide-react";
import type { Store } from "@/lib/db/schema";
import { useState } from "react";

interface StoreWithApps extends Store {
  installedApps: string[];
}

interface StoreDetailModalProps {
  store: StoreWithApps | null;
  open: boolean;
  onClose: () => void;
}

export function StoreDetailModal({
  store,
  open,
  onClose,
}: StoreDetailModalProps) {
  const [copiedEmail, setCopiedEmail] = useState(false);

  if (!store) return null;

  function copyEmail() {
    if (store?.contactEmail) {
      navigator.clipboard.writeText(store.contactEmail);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  }

  const domain = store.url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base leading-snug line-clamp-2 pr-6">
            {store.name || "Unknown Store"}
          </DialogTitle>
          <a
            href={store.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit"
          >
            {domain}
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          </a>
        </DialogHeader>

        {/* Meta description */}
        {store.metaDescription && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
            {store.metaDescription}
          </p>
        )}

        {/* Key stats grid */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard
            icon={<ShoppingBag className="h-3.5 w-3.5" />}
            label="Products"
            value={store.productCount?.toLocaleString() ?? "—"}
          />
          <StatCard
            icon={<FolderOpen className="h-3.5 w-3.5" />}
            label="Collections"
            value={store.collectionCount?.toLocaleString() ?? "—"}
          />
          <StatCard
            icon={<Globe className="h-3.5 w-3.5" />}
            label="Country"
            value={store.country || "—"}
          />
          <StatCard
            icon={<Globe className="h-3.5 w-3.5" />}
            label="Language"
            value={store.language || "—"}
          />
          {store.currency && (
            <StatCard
              icon={<ShoppingBag className="h-3.5 w-3.5" />}
              label="Currency"
              value={store.currency}
            />
          )}
          <StatCard
            icon={<BookOpen className="h-3.5 w-3.5" />}
            label="Blog"
            value={store.hasBlog === null ? "—" : store.hasBlog ? "Yes" : "No"}
          />
        </div>

        {/* Category */}
        {store.category && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Category
            </p>
            <Badge variant="outline" className="capitalize text-xs">
              {store.category.replace(/-/g, " ")}
            </Badge>
          </div>
        )}

        {/* Contact email */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Contact Email
          </p>
          {store.contactEmail ? (
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-sm truncate">{store.contactEmail}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={copyEmail}
                className="shrink-0"
              >
                {copiedEmail ? (
                  <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
              {store.emailSource && (
                <span className="text-xs text-muted-foreground shrink-0">
                  ({store.emailSource})
                </span>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No email found</p>
          )}
        </div>

        {/* Installed apps */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Installed Apps ({store.installedApps.length})
          </p>
          {store.installedApps.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {store.installedApps.map((app) => (
                <Badge key={app} variant="secondary" className="text-xs">
                  {app}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No apps detected</p>
          )}
        </div>

        {/* Myshopify domain + timestamps */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          {store.myshopifyDomain && <span>{store.myshopifyDomain}</span>}
          {store.lastScrapedAt && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(store.lastScrapedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )}
        </div>

        {/* Visit store button */}
        <div className="flex justify-end">
          <a href={store.url} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline">
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Visit Store
            </Button>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border px-2.5 py-2 text-center">
      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
        {icon}
        <span className="text-[11px]">{label}</span>
      </div>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
