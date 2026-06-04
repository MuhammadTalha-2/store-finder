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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            <X className="mr-1 h-3 w-3" />
            Clear all
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Search</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Store name or URL..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setFilter("search", searchInput);
            }}
            className="h-8 text-sm"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilter("search", searchInput)}
          >
            <Search className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Category</Label>
        <Select
          value={activeCategory}
          onValueChange={(v) => setFilter("category", v === "all" ? null : v)}
        >
          <SelectTrigger className="h-8 text-sm">
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

      <div className="space-y-2">
        <Label className="text-xs">Country</Label>
        <Select
          value={activeCountry}
          onValueChange={(v) => setFilter("country", v === "all" ? null : v)}
        >
          <SelectTrigger className="h-8 text-sm">
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

      <div className="space-y-2">
        <Label className="text-xs">Min Products</Label>
        <div className="flex flex-wrap gap-1.5">
          {PRODUCT_PRESETS.map((preset) => (
            <Badge
              key={preset.value}
              variant={minProducts === preset.value ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setFilter("minProducts", preset.value || null)}
            >
              {preset.label}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-xs">Has Email</Label>
        <Switch
          checked={hasEmail}
          onCheckedChange={(checked) =>
            setFilter("hasEmail", checked ? "true" : null)
          }
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs flex items-center gap-1">
          <Flame className="h-3 w-3 text-red-500" />
          Min Lead Score
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {LEAD_SCORE_PRESETS.map((preset) => (
            <Badge
              key={preset.value}
              variant={minLeadScore === preset.value ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() =>
                setFilter("minLeadScore", preset.value || null)
              }
            >
              {preset.label}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Has App (installed)</Label>
        <Select
          value={hasApp}
          onValueChange={(v) => setFilter("hasApp", v === "none" ? null : v)}
        >
          <SelectTrigger className="h-8 text-sm">
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

      <div className="space-y-2">
        <Label className="text-xs">Missing App (not installed)</Label>
        <Select
          value={missingApp}
          onValueChange={(v) =>
            setFilter("missingApp", v === "none" ? null : v)
          }
        >
          <SelectTrigger className="h-8 text-sm">
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

      {/* Tech Stack Gap Filter */}
      <div className="space-y-2">
        <Label className="text-xs flex items-center gap-1">
          <Target className="h-3 w-3 text-orange-500" />
          Missing App Category
        </Label>
        <Select
          value={missingAppCategory}
          onValueChange={(v) =>
            setFilter("missingAppCategory", v === "none" ? null : v)
          }
        >
          <SelectTrigger className="h-8 text-sm">
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
  );
}
