"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { EmailTemplate } from "@/lib/db/schema";

const TEMPLATE_VARIABLES = [
  "{{store_name}}",
  "{{store_url}}",
  "{{contact_name}}",
  "{{our_app_name}}",
  "{{our_app_url}}",
  "{{product_count}}",
  "{{category}}",
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(
    null
  );
  const [form, setForm] = useState({
    name: "",
    subject: "",
    bodyHtml: "",
  });

  async function fetchTemplates() {
    const res = await fetch("/api/templates");
    setTemplates(await res.json());
  }

  useEffect(() => {
    fetchTemplates();
  }, []);

  function openCreate() {
    setEditingTemplate(null);
    setForm({ name: "", subject: "", bodyHtml: "" });
    setDialogOpen(true);
  }

  function openEdit(template: EmailTemplate) {
    setEditingTemplate(template);
    setForm({
      name: template.name,
      subject: template.subject,
      bodyHtml: template.bodyHtml,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name || !form.subject || !form.bodyHtml) {
      toast.error("All fields are required");
      return;
    }

    if (editingTemplate) {
      await fetch(`/api/templates/${editingTemplate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      toast.success("Template updated");
    } else {
      await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      toast.success("Template created");
    }

    setDialogOpen(false);
    fetchTemplates();
  }

  async function handleDelete(id: number) {
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    toast.success("Template deleted");
    fetchTemplates();
  }

  function insertVariable(variable: string) {
    setForm((prev) => ({
      ...prev,
      bodyHtml: prev.bodyHtml + variable,
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Email Templates</h1>
          <p className="text-sm text-muted-foreground">
            Create reusable email templates with dynamic variables
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Edit Template" : "New Template"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="e.g., Invoice App Introduction"
                />
              </div>
              <div className="space-y-2">
                <Label>Subject Line</Label>
                <Input
                  value={form.subject}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, subject: e.target.value }))
                  }
                  placeholder="e.g., Save time with {{our_app_name}} for {{store_name}}"
                />
              </div>
              <div className="space-y-2">
                <Label>Variables</Label>
                <div className="flex flex-wrap gap-1.5">
                  {TEMPLATE_VARIABLES.map((v) => (
                    <Badge
                      key={v}
                      variant="outline"
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => insertVariable(v)}
                    >
                      {v}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Body (HTML)</Label>
                <Textarea
                  value={form.bodyHtml}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, bodyHtml: e.target.value }))
                  }
                  placeholder="Write your email body here. Use variables like {{store_name}} for personalization."
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>
              <Button onClick={handleSave} className="w-full">
                {editingTemplate ? "Update Template" : "Create Template"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-lg font-medium">No templates yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first email template to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle className="text-base">{template.name}</CardTitle>
                <CardDescription className="truncate">
                  Subject: {template.subject}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4 line-clamp-3 text-xs text-muted-foreground">
                  {template.bodyHtml.replace(/<[^>]*>/g, "").slice(0, 200)}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(template)}
                  >
                    <Pencil className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
