"use client";

import { useEffect, useState, useCallback, use } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatsCard } from "@/components/layout/StatsCard";
import { Send, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Campaign } from "@/lib/db/schema";

interface Recipient {
  id: number;
  email: string;
  status: string;
  sentAt: string | null;
  errorMessage: string | null;
  storeName: string | null;
  storeUrl: string | null;
}

interface CampaignDetail extends Campaign {
  recipients: Recipient[];
}

export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [sending, setSending] = useState(false);

  const fetchCampaign = useCallback(async () => {
    const res = await fetch(`/api/campaigns/${id}`);
    if (res.ok) setCampaign(await res.json());
  }, [id]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  async function startSending() {
    setSending(true);
    toast.info("Sending emails...");

    let hasMore = true;
    while (hasMore) {
      try {
        const res = await fetch(`/api/campaigns/${id}/send`, {
          method: "POST",
        });
        const data = await res.json();

        if (data.status === "completed" || data.remaining === 0) {
          hasMore = false;
          toast.success("All emails sent!");
        }

        await fetchCampaign();
        await new Promise((r) => setTimeout(r, 2000));
      } catch {
        hasMore = false;
        toast.error("Sending failed");
      }
    }

    setSending(false);
  }

  if (!campaign) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pending = campaign.recipients.filter(
    (r) => r.status === "pending"
  ).length;
  const sent = campaign.recipients.filter((r) => r.status === "sent").length;
  const failed = campaign.recipients.filter(
    (r) => r.status === "failed"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{campaign.name}</h1>
          <Badge
            variant={
              campaign.status === "completed"
                ? "default"
                : campaign.status === "sending"
                  ? "secondary"
                  : "outline"
            }
          >
            {campaign.status}
          </Badge>
        </div>
        {pending > 0 && (
          <Button onClick={startSending} disabled={sending}>
            <Send className="mr-2 h-4 w-4" />
            {sending ? "Sending..." : `Send ${pending} Emails`}
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard title="Sent" value={sent} icon={CheckCircle} />
        <StatsCard title="Pending" value={pending} icon={Clock} />
        <StatsCard title="Failed" value={failed} icon={XCircle} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recipients</CardTitle>
          <CardDescription>
            {campaign.totalRecipients} total recipients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaign.recipients.map((recipient) => (
                <TableRow key={recipient.id}>
                  <TableCell>
                    <div className="text-sm font-medium">
                      {recipient.storeName || "Unknown"}
                    </div>
                    {recipient.storeUrl && (
                      <div className="text-xs text-muted-foreground">
                        {recipient.storeUrl
                          .replace(/^https?:\/\//, "")
                          .replace(/\/$/, "")}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{recipient.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        recipient.status === "sent"
                          ? "default"
                          : recipient.status === "failed"
                            ? "destructive"
                            : "outline"
                      }
                    >
                      {recipient.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {recipient.sentAt
                      ? format(new Date(recipient.sentAt), "MMM d, h:mma")
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
