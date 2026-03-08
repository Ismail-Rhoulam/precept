"use client"

import { useState } from "react"
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  FileText,
  X,
  Eye,
} from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface EmailTemplate {
  id: number
  name: string
  subject: string
  body_html: string
  body_text: string
  created_at: string
  updated_at: string
}

function useTemplates() {
  return useQuery({
    queryKey: ["email-templates"],
    queryFn: () => api.get<EmailTemplate[]>("/integrations/email/templates"),
  })
}

function useCreateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<EmailTemplate>) =>
      api.post<EmailTemplate>("/integrations/email/templates", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-templates"] }),
  })
}

function useUpdateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<EmailTemplate> }) =>
      api.patch<EmailTemplate>(`/integrations/email/templates/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-templates"] }),
  })
}

function useDeleteTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/integrations/email/templates/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-templates"] }),
  })
}

function TemplateForm({
  template,
  onClose,
}: {
  template?: EmailTemplate
  onClose: () => void
}) {
  const createTemplate = useCreateTemplate()
  const updateTemplate = useUpdateTemplate()
  const [form, setForm] = useState({
    name: template?.name || "",
    subject: template?.subject || "",
    body_html: template?.body_html || "",
    body_text: template?.body_text || "",
  })
  const [preview, setPreview] = useState(false)

  const isPending = createTemplate.isPending || updateTemplate.isPending

  async function handleSave() {
    if (!form.name || !form.subject) return
    if (template) {
      await updateTemplate.mutateAsync({ id: template.id, data: form })
    } else {
      await createTemplate.mutateAsync(form)
    }
    onClose()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-base">
          {template ? "Edit Template" : "New Template"}
        </CardTitle>
        <Button variant="ghost" size="icon" className="size-7" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Welcome Email"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Subject</Label>
            <Input
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Hello {{first_name}}"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Body HTML</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreview(!preview)}
              className="h-6 text-xs gap-1"
            >
              <Eye className="size-3" />
              {preview ? "Edit" : "Preview"}
            </Button>
          </div>
          {preview ? (
            <div
              className="border rounded-md p-4 min-h-[200px] text-sm prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: form.body_html }}
            />
          ) : (
            <Textarea
              value={form.body_html}
              onChange={(e) => setForm({ ...form, body_html: e.target.value })}
              placeholder="<h1>Hello {{first_name}}</h1><p>Welcome to our platform...</p>"
              rows={10}
              className="font-mono text-xs"
            />
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Available variables: {"{{first_name}}"}, {"{{last_name}}"}, {"{{email}}"}, {"{{company_name}}"}
        </p>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending || !form.name || !form.subject}
          >
            {isPending && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
            {template ? "Update" : "Create"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function EmailTemplatesPage() {
  const { data: templates, isLoading } = useTemplates()
  const deleteTemplate = useDeleteTemplate()
  const [editingId, setEditingId] = useState<number | "new" | null>(null)

  const editingTemplate = editingId && editingId !== "new"
    ? templates?.find((t) => t.id === editingId)
    : undefined

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Email Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create reusable email templates for campaigns
          </p>
        </div>
        <Button onClick={() => setEditingId("new")} className="gap-1.5">
          <Plus className="size-4" />
          New Template
        </Button>
      </div>

      {editingId && (
        <TemplateForm
          template={editingTemplate}
          onClose={() => setEditingId(null)}
        />
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : !templates || templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="size-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              No templates yet
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Create your first email template
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {templates.map((tpl) => (
            <Card key={tpl.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="size-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <FileText className="size-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{tpl.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {tpl.subject}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => setEditingId(tpl.id)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm("Delete this template?")) {
                        deleteTemplate.mutate(tpl.id)
                      }
                    }}
                    disabled={deleteTemplate.isPending}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
