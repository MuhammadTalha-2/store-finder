"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import type { EmailTemplate } from "@/lib/db/schema";
import { Suspense } from "react";

function NewCampaignContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const storeIdsParam = searchParams.get("storeIds");
  const storeIds = storeIdsParam ? storeIdsParam.split(",").map(Number) : [];

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then(setTemplates);
  }, []);

  async function handleCreate() {
    if (!name || !templateId || storeIds.length === 0) {
      toast.error("Please fill in all fields and select stores");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          templateId: Number(templateId),
          storeIds,
        }),
      });

      if (!res.ok) throw new Error("Failed to create campaign");

      const campaign = await res.json();
      toast.success("Campaign created");
      router.push(`/campaigns/${campaign.id}`);
    } catch {
      toast.error("Failed to create campaign");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Campaign</h1>
        <p className="text-sm text-muted-foreground">
          Create a new email outreach campaign
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
          <CardDescription>
            {storeIds.length > 0
              ? `${storeIds.length} stores selected from the store browser`
              : "No stores selected — go back to Stores and select some first"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Campaign Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., InvoiceForge Outreach - Fashion Stores"
            />
          </div>

          <div className="space-y-2">
            <Label>Email Template</Label>
            <Select value={templateId} onValueChange={(v) => setTemplateId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {templates.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No templates found. Create one in the Templates section first.
              </p>
            )}
          </div>

          <Button
            onClick={handleCreate}
            disabled={loading || !name || !templateId || storeIds.length === 0}
            className="w-full"
          >
            {loading ? "Creating..." : "Create Campaign"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewCampaignPage() {
  return (
    <Suspense>
      <NewCampaignContent />
    </Suspense>
  );
}
