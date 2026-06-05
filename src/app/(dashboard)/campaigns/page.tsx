"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Campaign } from "@/lib/db/schema";

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  sending: "secondary",
  completed: "default",
  paused: "outline",
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchCampaigns() {
    try {
      const res = await fetch("/api/campaigns");
      setCampaigns(await res.json());
    } catch {
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/campaigns/${deleteTarget.id}`, { method: "DELETE" });
      toast.success("Campaign deleted");
      setDeleteTarget(null);
      fetchCampaigns();
    } catch {
      toast.error("Failed to delete campaign");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-sm text-muted-foreground">
            Manage email outreach campaigns
          </p>
        </div>
        <Link href="/campaigns/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-lg font-medium">No campaigns yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first campaign to start outreach
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Recipients</TableHead>
                <TableHead className="text-right">Sent</TableHead>
                <TableHead className="text-right">Failed</TableHead>
                <TableHead>Created</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <Link
                      href={`/campaigns/${campaign.id}`}
                      className="font-medium hover:underline"
                    >
                      {campaign.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColors[campaign.status] || "outline"}>
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {campaign.totalRecipients}
                  </TableCell>
                  <TableCell className="text-right">
                    {campaign.sentCount}
                  </TableCell>
                  <TableCell className="text-right">
                    {campaign.failedCount}
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(campaign.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(campaign)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Campaign</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.name}&rdquo;?
              This will also remove all recipient data for this campaign.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
