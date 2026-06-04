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
  Target,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Info,
  Palette,
  Share2,
  Activity,
} from "lucide-react";
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
import { useState } from "react";

export interface SocialLinks {
  facebook?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  tiktok?: string | null;
  youtube?: string | null;
  pinterest?: string | null;
  linkedin?: string | null;
  snapchat?: string | null;
}

export interface AdPixels {
  facebookPixelId?: string | null;
  googleAnalyticsId?: string | null;
  googleTagManagerId?: string | null;
  tiktokPixelId?: string | null;
  pinterestTagId?: string | null;
  snapchatPixelId?: string | null;
  microsoftClarityId?: string | null;
  hotjarId?: string | null;
}

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

        {/* Lead Score */}
        {store.leadScore != null && store.leadScoreBreakdown && (
          <LeadScoreCard
            score={store.leadScore}
            breakdown={store.leadScoreBreakdown}
          />
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

        {/* Shopify Theme */}
        {store.shopifyTheme && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
              <Palette className="h-3.5 w-3.5 text-purple-500" />
              Shopify Theme
            </p>
            <Badge variant="outline" className="text-xs text-purple-700 border-purple-200 bg-purple-50">
              {store.shopifyTheme}
            </Badge>
          </div>
        )}

        {/* Social Media Links */}
        {store.socialLinks && Object.values(store.socialLinks).some(Boolean) && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
              <Share2 className="h-3.5 w-3.5 text-blue-500" />
              Social Media ({Object.values(store.socialLinks).filter(Boolean).length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {store.socialLinks.facebook && (
                <SocialBadge platform="Facebook" url={store.socialLinks.facebook} color="bg-blue-100 text-blue-700 border-blue-200" />
              )}
              {store.socialLinks.instagram && (
                <SocialBadge platform="Instagram" url={store.socialLinks.instagram} color="bg-pink-100 text-pink-700 border-pink-200" />
              )}
              {store.socialLinks.twitter && (
                <SocialBadge platform="X / Twitter" url={store.socialLinks.twitter} color="bg-slate-100 text-slate-700 border-slate-200" />
              )}
              {store.socialLinks.tiktok && (
                <SocialBadge platform="TikTok" url={store.socialLinks.tiktok} color="bg-gray-100 text-gray-700 border-gray-200" />
              )}
              {store.socialLinks.youtube && (
                <SocialBadge platform="YouTube" url={store.socialLinks.youtube} color="bg-red-100 text-red-700 border-red-200" />
              )}
              {store.socialLinks.pinterest && (
                <SocialBadge platform="Pinterest" url={store.socialLinks.pinterest} color="bg-red-50 text-red-600 border-red-200" />
              )}
              {store.socialLinks.linkedin && (
                <SocialBadge platform="LinkedIn" url={store.socialLinks.linkedin} color="bg-sky-100 text-sky-700 border-sky-200" />
              )}
              {store.socialLinks.snapchat && (
                <SocialBadge platform="Snapchat" url={store.socialLinks.snapchat} color="bg-yellow-100 text-yellow-700 border-yellow-200" />
              )}
            </div>
          </div>
        )}

        {/* Ad Pixels / Tracking */}
        {store.adPixels && Object.values(store.adPixels).some(Boolean) && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
              <Activity className="h-3.5 w-3.5 text-emerald-500" />
              Ad Pixels & Tracking ({Object.values(store.adPixels).filter(Boolean).length})
            </p>
            <div className="flex flex-wrap gap-1">
              {store.adPixels.facebookPixelId && (
                <Badge variant="outline" className="text-[10px] gap-1" title={`ID: ${store.adPixels.facebookPixelId}`}>
                  FB Pixel
                </Badge>
              )}
              {store.adPixels.googleAnalyticsId && (
                <Badge variant="outline" className="text-[10px] gap-1" title={`ID: ${store.adPixels.googleAnalyticsId}`}>
                  {store.adPixels.googleAnalyticsId.startsWith("G-") ? "GA4" : "UA"}
                </Badge>
              )}
              {store.adPixels.googleTagManagerId && (
                <Badge variant="outline" className="text-[10px] gap-1" title={`ID: ${store.adPixels.googleTagManagerId}`}>
                  GTM
                </Badge>
              )}
              {store.adPixels.tiktokPixelId && (
                <Badge variant="outline" className="text-[10px] gap-1" title={`ID: ${store.adPixels.tiktokPixelId}`}>
                  TikTok Pixel
                </Badge>
              )}
              {store.adPixels.pinterestTagId && (
                <Badge variant="outline" className="text-[10px] gap-1" title={`ID: ${store.adPixels.pinterestTagId}`}>
                  Pinterest Tag
                </Badge>
              )}
              {store.adPixels.snapchatPixelId && (
                <Badge variant="outline" className="text-[10px] gap-1" title={`ID: ${store.adPixels.snapchatPixelId}`}>
                  Snap Pixel
                </Badge>
              )}
              {store.adPixels.microsoftClarityId && (
                <Badge variant="outline" className="text-[10px] gap-1" title={`ID: ${store.adPixels.microsoftClarityId}`}>
                  MS Clarity
                </Badge>
              )}
              {store.adPixels.hotjarId && (
                <Badge variant="outline" className="text-[10px] gap-1" title={`ID: ${store.adPixels.hotjarId}`}>
                  Hotjar
                </Badge>
              )}
            </div>
          </div>
        )}

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

        {/* Confirmed our-app installs */}
        {store.confirmedOurApps && store.confirmedOurApps.length > 0 && (
          <div>
            <p className="text-xs font-medium text-green-700 mb-1 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              Our Apps (confirmed install)
            </p>
            <div className="flex flex-wrap gap-1">
              {store.confirmedOurApps.map((app) => (
                <Badge
                  key={app}
                  className="text-xs bg-green-100 text-green-700 border-green-200"
                >
                  {app}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Installed apps (detected via storefront scraping) */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Detected Apps ({store.installedApps.length})
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
            <p className="text-sm text-muted-foreground">No storefront apps detected</p>
          )}
          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-0.5">
            <Info className="h-2.5 w-2.5" />
            Only apps with storefront scripts can be detected. Admin-only apps require Partners API sync.
          </p>
        </div>

        {/* Tech Stack Gaps (Opportunities) */}
        {store.missingCategories && store.missingCategories.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Target className="h-3.5 w-3.5 text-orange-500" />
              <p className="text-xs font-medium text-muted-foreground">
                Tech Stack Gaps
              </p>
              {store.gapScore != null && (
                <Badge
                  variant={
                    store.gapScore >= 60
                      ? "destructive"
                      : store.gapScore >= 30
                        ? "default"
                        : "secondary"
                  }
                  className="text-[10px] px-1.5 py-0 ml-auto"
                >
                  Gap Score: {store.gapScore}
                </Badge>
              )}
            </div>
            <div className="space-y-1.5">
              {/* Our apps — highest priority */}
              {store.missingCategories.some((c) =>
                OUR_APP_CATEGORIES.has(c)
              ) && (
                <div>
                  <p className="text-[10px] font-semibold text-destructive uppercase tracking-wide mb-0.5 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    No Detected App — Pitch Ours
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {store.missingCategories
                      .filter((c) => OUR_APP_CATEGORIES.has(c))
                      .map((cat) => (
                        <Badge
                          key={cat}
                          variant="destructive"
                          className="text-xs"
                        >
                          {APP_CATEGORY_LABELS[cat] || cat}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
              {/* Core gaps */}
              {store.missingCategories.some(
                (c) =>
                  CORE_CATEGORIES.has(c) && !OUR_APP_CATEGORIES.has(c)
              ) && (
                <div>
                  <p className="text-[10px] font-medium text-orange-600 uppercase tracking-wide mb-0.5">
                    Missing Core Categories
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {store.missingCategories
                      .filter(
                        (c) =>
                          CORE_CATEGORIES.has(c) &&
                          !OUR_APP_CATEGORIES.has(c)
                      )
                      .map((cat) => (
                        <Badge
                          key={cat}
                          variant="outline"
                          className="text-xs text-orange-600 border-orange-200"
                        >
                          {APP_CATEGORY_LABELS[cat] || cat}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
              {/* Other gaps */}
              {store.missingCategories.some(
                (c) =>
                  !CORE_CATEGORIES.has(c) && !OUR_APP_CATEGORIES.has(c)
              ) && (
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                    Other Gaps
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {store.missingCategories
                      .filter(
                        (c) =>
                          !CORE_CATEGORIES.has(c) &&
                          !OUR_APP_CATEGORIES.has(c)
                      )
                      .map((cat) => (
                        <Badge
                          key={cat}
                          variant="outline"
                          className="text-xs"
                        >
                          {APP_CATEGORY_LABELS[cat] || cat}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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

function SocialBadge({
  platform,
  url,
  color,
}: {
  platform: string;
  url: string;
  color: string;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium hover:opacity-80 transition-opacity ${color}`}
    >
      {platform}
      <ExternalLink className="h-2.5 w-2.5" />
    </a>
  );
}

function LeadScoreCard({
  score,
  breakdown,
}: {
  score: number;
  breakdown: LeadScoreBreakdown;
}) {
  const label = getLeadScoreLabel(score);
  const colors = getLeadScoreColor(score);

  const components = [
    { label: "Email", value: breakdown.email, max: 20 },
    { label: "App Gaps", value: breakdown.appGaps, max: 25 },
    { label: "Products", value: breakdown.products, max: 15 },
    { label: "Country", value: breakdown.country, max: 15 },
    { label: "Maturity", value: breakdown.maturity, max: 10 },
    { label: "Category", value: breakdown.categoryFit, max: 10 },
    { label: "Blog", value: breakdown.blog, max: 5 },
  ];

  return (
    <div className={`rounded-lg border ${colors.border} ${colors.bg} p-3`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Flame className={`h-4 w-4 ${colors.text}`} />
          <span className={`text-sm font-semibold ${colors.text}`}>
            Lead Score
          </span>
        </div>
        <span className={`text-lg font-bold ${colors.text}`}>
          {score}
          <span className="text-xs font-normal ml-0.5">/100</span>
          <span className="text-xs font-medium ml-1.5 opacity-75">
            {label}
          </span>
        </span>
      </div>
      {/* Score breakdown bars */}
      <div className="space-y-1">
        {components.map((comp) => (
          <div key={comp.label} className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-14 text-right shrink-0">
              {comp.label}
            </span>
            <div className="flex-1 h-1.5 bg-white/50 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  comp.value / comp.max >= 0.7
                    ? "bg-green-500"
                    : comp.value / comp.max >= 0.4
                      ? "bg-yellow-500"
                      : "bg-gray-300"
                }`}
                style={{ width: `${(comp.value / comp.max) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground w-8 shrink-0">
              {comp.value}/{comp.max}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
