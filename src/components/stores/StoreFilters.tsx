"use client";

import { useFilters } from "@/hooks/useFilters";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Search, Target, Flame } from "lucide-react";
import { APP_CATEGORY_LABELS, OUR_APP_CATEGORIES } from "@/lib/app-gaps";
import { useState } from "react";

const LEAD_SCORE_PRESETS = [
  { label: "Any", value: "" },
  { label: "40+ Cool", value: "40" },
  { label: "60+ Warm", value: "60" },
  { label: "80+ Hot", value: "80" },
];

const PRODUCT_PRESETS = [
  { label: "Any", value: "" },
  { label: "50+", value: "50" },
  { label: "100+", value: "100" },
  { label: "500+", value: "500" },
];

interface StoreFiltersProps {
  knownApps: { slug: string; name: string; category: string }[];
  availableCountries: string[];
  appCategories?: string[];
}

export function StoreFilters({
  knownApps,
  availableCountries,
  appCategories = [],
}: StoreFiltersProps) {
  const { getFilter, setFilter, clearAll } = useFilters();
  const [searchInput, setSearchInput] = useState(getFilter("search") || "");

  const activeCategory = getFilter("category") || "";
  const activeCountry = getFilter("country") || "";
  const hasEmail = getFilter("hasEmail") === "true";
  const minProducts = getFilter("minProducts") || "";
  const hasApp = getFilter("hasApp") || "";
  const missingApp = getFilter("missingApp") || "";
  const missingAppCategory = getFilter("missingAppCategory") || "";
  const minLeadScore = getFilter("minLeadScore") || "";

  const hasActiveFilters =
    activeCategory ||
    activeCountry ||
    hasEmail ||
    minProducts ||
    hasApp ||
    missingApp ||
    missingAppCategory ||
    minLeadScore ||
    searchInput;

  return (
    <div className="rounded-lg border bg-muted/10 p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Filters
        </h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={clearAll}
          >
            <X className="mr-1 h-3 w-3" />
            Clear all
          </Button>
        )}
      </div>

      {/* Row 1: Search (2 cols), Category, Country */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search — spans 2 cols on lg */}
        <div className="lg:col-span-2 space-y-1">
          <Label className="text-[11px] text-muted-foreground">Search</Label>
          <div className="flex gap-1.5">
            <Input
              placeholder="Store name or URL..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setFilter("search", searchInput);
              }}
              className="h-8 text-xs"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 shrink-0"
              onClick={() => setFilter("search", searchInput)}
            >
              <Search className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Category */}
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Category</Label>
          <Select
            value={activeCategory}
            onValueChange={(v) =>
              setFilter("category", v === "all" ? null : v)
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {CATEGORY_LABELS[cat as Category]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Country */}
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Country</Label>
          <Select
            value={activeCountry}
            onValueChange={(v) =>
              setFilter("country", v === "all" ? null : v)
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="All countries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All countries</SelectItem>
              {availableCountries.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 2: Has Email, Min Products, Min Lead Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        {/* Has Email */}
        <div className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
          <Label className="text-[11px] text-muted-foreground">Has Email</Label>
          <Switch
            checked={hasEmail}
            onCheckedChange={(checked) =>
              setFilter("hasEmail", checked ? "true" : null)
            }
          />
        </div>

        {/* Min Products */}
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">
            Min Products
          </Label>
          <div className="flex flex-wrap gap-1">
            {PRODUCT_PRESETS.map((preset) => (
              <Badge
                key={preset.value}
                variant={minProducts === preset.value ? "default" : "outline"}
                className="cursor-pointer text-[11px] px-2 py-0"
                onClick={() =>
                  setFilter("minProducts", preset.value || null)
                }
              >
                {preset.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Min Lead Score */}
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Flame className="h-3 w-3 text-red-500" />
            Min Lead Score
          </Label>
          <div className="flex flex-wrap gap-1">
            {LEAD_SCORE_PRESETS.map((preset) => (
              <Badge
                key={preset.value}
                variant={minLeadScore === preset.value ? "default" : "outline"}
                className="cursor-pointer text-[11px] px-2 py-0"
                onClick={() =>
                  setFilter("minLeadScore", preset.value || null)
                }
              >
                {preset.label}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Has App, Missing App, Missing App Category */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Has App */}
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">
            Has App (installed)
          </Label>
          <Select
            value={hasApp}
            onValueChange={(v) =>
              setFilter("hasApp", v === "none" ? null : v)
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Any app" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Any app</SelectItem>
              {knownApps.map((app) => (
                <SelectItem key={app.slug} value={app.slug}>
                  {app.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Missing App */}
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">
            Missing App (not installed)
          </Label>
          <Select
            value={missingApp}
            onValueChange={(v) =>
              setFilter("missingApp", v === "none" ? null : v)
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Any</SelectItem>
              {knownApps.map((app) => (
                <SelectItem key={app.slug} value={app.slug}>
                  {app.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Missing App Category */}
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Target className="h-3 w-3 text-orange-500" />
            Missing App Category
          </Label>
          <Select
            value={missingAppCategory}
            onValueChange={(v) =>
              setFilter("missingAppCategory", v === "none" ? null : v)
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Any category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Any category</SelectItem>
              {appCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  <span className="flex items-center gap-1.5">
                    {OUR_APP_CATEGORIES.has(cat) && (
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />
                    )}
                    {APP_CATEGORY_LABELS[cat] || cat}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
