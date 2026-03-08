"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Plus,
  X,
  Send,
  Eye,
} from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import { useEmailAccounts } from "@/hooks/useIntegrations"
import type { EmailAccount } from "@/types/integration"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface EmailTemplate {
  id: number
  name: string
  subject: string
  body_html: string
}

interface Recipient {
  email: string
  first_name: string
  last_name: string
}

function useTemplates() {
  return useQuery({
    queryKey: ["email-templates"],
    queryFn: () => api.get<EmailTemplate[]>("/integrations/email/templates"),
  })
}

export default function NewCampaignPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const { data: accounts } = useEmailAccounts()
  const { data: templates } = useTemplates()

  const [step, setStep] = useState(1)
  const [name, setName] = useState("")
  const [accountId, setAccountId] = useState<string>("")
  const [templateId, setTemplateId] = useState<string>("")
  const [subject, setSubject] = useState("")
  const [bodyHtml, setBodyHtml] = useState("")
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [newEmail, setNewEmail] = useState("")
  const [bulkEmails, setBulkEmails] = useState("")
  const [preview, setPreview] = useState(false)

  const createCampaign = useMutation<{ id: number }, Error, Record<string, unknown>>({
    mutationFn: (data) =>
      api.post<{ id: number }>("/integrations/email/campaigns", data),
    onSuccess: (campaign) => {
      qc.invalidateQueries({ queryKey: ["email-campaigns"] })
      router.push(`/email/campaigns/${campaign.id}`)
    },
  })

  const enabledAccounts = (accounts ?? []).filter((a) => a.enabled)

  function handleTemplateSelect(id: string) {
    setTemplateId(id)
    const tpl = templates?.find((t) => t.id === Number(id))
    if (tpl) {
      setSubject(tpl.subject)
      setBodyHtml(tpl.body_html)
    }
  }

  function addRecipient() {
    if (!newEmail.trim()) return
    if (recipients.find((r) => r.email === newEmail.trim())) return
    setRecipients([...recipients, { email: newEmail.trim(), first_name: "", last_name: "" }])
    setNewEmail("")
  }

  function addBulkRecipients() {
    const emails = bulkEmails
      .split(/[\n,;]+/)
      .map((e) => e.trim())
      .filter((e) => e && e.includes("@"))
    const existing = new Set(recipients.map((r) => r.email))
    const newOnes = emails
      .filter((e) => !existing.has(e))
      .map((e) => ({ email: e, first_name: "", last_name: "" }))
    setRecipients([...recipients, ...newOnes])
    setBulkEmails("")
  }

  function removeRecipient(email: string) {
    setRecipients(recipients.filter((r) => r.email !== email))
  }

  async function handleCreate() {
    await createCampaign.mutateAsync({
      name,
      email_account_id: accountId ? Number(accountId) : null,
      template_id: templateId ? Number(templateId) : null,
      subject,
      body_html: bodyHtml,
      recipients,
    })
  }

  return (
    <div className="space-y-6 p-6 max-w-3xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => router.push("/email/campaigns")}
        className="gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Campaigns
      </Button>

      <div>
        <h1 className="text-xl font-bold">New Campaign</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Step {step} of 3
        </p>
      </div>

      {/* Step 1: Basics */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Campaign Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Campaign Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="March Newsletter"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email Account</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {enabledAccounts.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.display_name || a.email_address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Template (optional)</Label>
              <Select value={templateId} onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template or write custom" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No template</SelectItem>
                  {(templates ?? []).map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setStep(2)}
                disabled={!name.trim()}
                className="gap-1.5"
              >
                Next
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Content */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Email Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Hello {{first_name}}"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Body HTML</Label>
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
                  dangerouslySetInnerHTML={{ __html: bodyHtml }}
                />
              ) : (
                <Textarea
                  value={bodyHtml}
                  onChange={(e) => setBodyHtml(e.target.value)}
                  placeholder="<h1>Hello {{first_name}}</h1>"
                  rows={12}
                  className="font-mono text-xs"
                />
              )}
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="size-4 mr-1.5" />
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!subject.trim()}
                className="gap-1.5"
              >
                Next
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Recipients */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Recipients ({recipients.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add single */}
            <div className="flex gap-2">
              <Input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="email@example.com"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addRecipient()
                  }
                }}
                className="flex-1"
              />
              <Button variant="outline" onClick={addRecipient} className="gap-1">
                <Plus className="size-3.5" />
                Add
              </Button>
            </div>

            {/* Bulk add */}
            <div className="space-y-1.5">
              <Label className="text-xs">Bulk add (paste emails, one per line)</Label>
              <Textarea
                value={bulkEmails}
                onChange={(e) => setBulkEmails(e.target.value)}
                placeholder={"john@example.com\njane@example.com"}
                rows={3}
                className="text-sm"
              />
              {bulkEmails.trim() && (
                <Button variant="outline" size="sm" onClick={addBulkRecipients}>
                  Add All
                </Button>
              )}
            </div>

            {/* List */}
            {recipients.length > 0 && (
              <div className="space-y-1 max-h-[250px] overflow-y-auto border rounded-md p-2">
                {recipients.map((r) => (
                  <div
                    key={r.email}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 text-sm"
                  >
                    <span className="flex-1 truncate">{r.email}</span>
                    <button
                      onClick={() => removeRecipient(r.email)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="size-4 mr-1.5" />
                Back
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createCampaign.isPending || recipients.length === 0}
                className="gap-1.5"
              >
                {createCampaign.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Create Campaign
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
