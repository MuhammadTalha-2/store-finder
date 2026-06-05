"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  FolderOpen,
  Zap,
  Users,
  MoreVertical,
  Pencil,
  Trash2,
  Filter,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const LIST_COLORS = [
  { label: "Indigo", value: "#6366f1" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Green", value: "#22c55e" },
  { label: "Orange", value: "#f97316" },
  { label: "Red", value: "#ef4444" },
  { label: "Purple", value: "#a855f7" },
  { label: "Pink", value: "#ec4899" },
  { label: "Teal", value: "#14b8a6" },
];

interface StoreList {
  id: number;
  name: string;
  description: string | null;
  color: string;
  type: string;
  filtersJson: Record<string, string> | null;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
}

export function ListsClient() {
  const router = useRouter();
  const [lists, setLists] = useState<StoreList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editList, setEditList] = useState<StoreList | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<StoreList | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formColor, setFormColor] = useState("#6366f1");

  const fetchLists = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lists");
      const data = await res.json();
      setLists(data.lists || []);
    } catch {
      console.error("Failed to fetch lists");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  async function handleCreate() {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          description: formDesc,
          color: formColor,
          type: "manual",
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("List created");
      setShowCreate(false);
      setFormName("");
      setFormDesc("");
      setFormColor("#6366f1");
      fetchLists();
    } catch {
      toast.error("Failed to create list");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate() {
    if (!editList || !formName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/lists/${editList.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          description: formDesc,
          color: formColor,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("List updated");
      setEditList(null);
      setFormName("");
      setFormDesc("");
      setFormColor("#6366f1");
      fetchLists();
    } catch {
      toast.error("Failed to update list");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(list: StoreList) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/lists/${list.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("List deleted");
      setDeleteConfirm(null);
      fetchLists();
    } catch {
      toast.error("Failed to delete list");
    } finally {
      setDeleting(false);
    }
  }

  function openEdit(list: StoreList) {
    setFormName(list.name);
    setFormDesc(list.description || "");
    setFormColor(list.color);
    setEditList(list);
  }

  const manualLists = lists.filter((l) => l.type === "manual");
  const smartSegments = lists.filter((l) => l.type === "smart");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lists & Segments</h1>
          <p className="text-sm text-muted-foreground">
            Organize stores into manual lists or smart filter-based segments
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New List
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-lg border bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : lists.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">No lists yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-md text-center">
            Create a manual list to hand-pick stores, or save your current filters
            on the Stores page as a smart segment.
          </p>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create your first list
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Smart Segments */}
          {smartSegments.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Smart Segments
                </h2>
                <Badge variant="secondary" className="text-xs">
                  {smartSegments.length}
                </Badge>
              </div>
              <div className="grid gap-3">
                {smartSegments.map((list) => (
                  <ListCard
                    key={list.id}
                    list={list}
                    onClick={() => router.push(`/lists/${list.id}`)}
                    onEdit={() => openEdit(list)}
                    onDelete={() => setDeleteConfirm(list)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Manual Lists */}
          {manualLists.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Manual Lists
                </h2>
                <Badge variant="secondary" className="text-xs">
                  {manualLists.length}
                </Badge>
              </div>
              <div className="grid gap-3">
                {manualLists.map((list) => (
                  <ListCard
                    key={list.id}
                    list={list}
                    onClick={() => router.push(`/lists/${list.id}`)}
                    onEdit={() => openEdit(list)}
                    onDelete={() => setDeleteConfirm(list)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New List</DialogTitle>
            <DialogDescription>
              Create a manual list to organize stores. You can add stores from the
              Stores page.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="e.g. High-value prospects"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input
                placeholder="What is this list for?"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {LIST_COLORS.map((c) => (
                  <button
                    key={c.value}
                    className={`h-7 w-7 rounded-full border-2 transition-all ${
                      formColor === c.value
                        ? "border-foreground scale-110"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: c.value }}
                    onClick={() => setFormColor(c.value)}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!formName.trim() || saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create List"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editList} onOpenChange={() => setEditList(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit List</DialogTitle>
            <DialogDescription>Update the list name, description, or color.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUpdate();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {LIST_COLORS.map((c) => (
                  <button
                    key={c.value}
                    className={`h-7 w-7 rounded-full border-2 transition-all ${
                      formColor === c.value
                        ? "border-foreground scale-110"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: c.value }}
                    onClick={() => setFormColor(c.value)}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditList(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={!formName.trim() || saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete List</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deleteConfirm?.name}&rdquo;? This
              will remove the list but won&apos;t delete the stores themselves.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
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

// ─── List Card ───────────────────────────────────────────────────────────────

function ListCard({
  list,
  onClick,
  onEdit,
  onDelete,
}: {
  list: StoreList;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const filterKeys =
    list.type === "smart" && list.filtersJson
      ? Object.keys(list.filtersJson).filter(
          (k) => !["page", "limit", "sort", "order"].includes(k) && list.filtersJson![k]
        )
      : [];

  return (
    <div
      className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/30 transition-colors cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="h-3 w-3 rounded-full shrink-0"
          style={{ backgroundColor: list.color }}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{list.name}</span>
            {list.type === "smart" && (
              <Badge variant="secondary" className="text-xs gap-1 shrink-0">
                <Zap className="h-3 w-3" />
                Smart
              </Badge>
            )}
          </div>
          {list.description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {list.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-muted-foreground">
              {list.memberCount} {list.memberCount === 1 ? "store" : "stores"}
            </span>
            {filterKeys.length > 0 && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Filter className="h-3 w-3" />
                {filterKeys.length} {filterKeys.length === 1 ? "filter" : "filters"}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              Updated{" "}
              {formatDistanceToNow(new Date(list.updatedAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          className="opacity-0 group-hover:opacity-100 shrink-0 inline-flex items-center justify-center rounded-md text-sm font-medium h-8 w-8 hover:bg-muted transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
