"use client"

import { useState } from "react"
import Link from "next/link"
import {
  MessageCircle,
  ArrowLeft,
  Loader2,
  Save,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Check,
  Plus,
  Trash2,
  Star,
  Pencil,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useWhatsAppSettings,
  useCreateWhatsAppAccount,
  useUpdateWhatsAppAccount,
  useDeleteWhatsAppAccount,
} from "@/hooks/useIntegrations"
import type { WhatsAppSettings } from "@/types/integration"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

const WEBHOOK_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

type FormData = {
  enabled: boolean
  display_name: string
  is_default: boolean
  phone_number_id: string
  access_token: string
  business_account_id: string
  webhook_verify_token: string
  app_secret: string
}

const emptyForm: FormData = {
  enabled: false,
  display_name: "",
  is_default: false,
  phone_number_id: "",
  access_token: "",
  business_account_id: "",
  webhook_verify_token: "",
  app_secret: "",
}

function AccountForm({
  form,
  setForm,
  onSave,
  onCancel,
  saving,
  error,
  isNew,
}: {
  form: FormData
  setForm: (fn: (prev: FormData) => FormData) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
  error: string | null
  isNew: boolean
}) {
  const [showAccessToken, setShowAccessToken] = useState(false)
  const [showAppSecret, setShowAppSecret] = useState(false)

  function generateVerifyToken() {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let token = ""
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setForm((prev) => ({ ...prev, webhook_verify_token: token }))
  }

  return (
    <Card className="max-w-2xl">
      <CardContent className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {isNew ? "Add WhatsApp Account" : "Edit WhatsApp Account"}
          </h3>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="size-4" />
          </Button>
        </div>

        {/* Display Name */}
        <div className="space-y-2">
          <Label>Display Name</Label>
          <Input
            type="text"
            value={form.display_name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, display_name: e.target.value }))
            }
            placeholder='e.g. "Sales", "Support"'
          />
        </div>

        {/* Enabled Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label>Enable WhatsApp</Label>
            <p className="text-xs text-muted-foreground">
              Activate this WhatsApp account
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setForm((prev) => ({ ...prev, enabled: !prev.enabled }))
            }
            className={cn(
              "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              form.enabled ? "bg-primary" : "bg-muted-foreground/30"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-card shadow ring-0 transition duration-200 ease-in-out",
                form.enabled ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>

        {/* Phone Number ID */}
        <div className="space-y-2">
          <Label>Phone Number ID</Label>
          <Input
            type="text"
            value={form.phone_number_id}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, phone_number_id: e.target.value }))
            }
            placeholder="Your WhatsApp phone number ID"
          />
        </div>

        {/* Access Token */}
        <div className="space-y-2">
          <Label>Access Token</Label>
          <div className="relative">
            <Input
              type={showAccessToken ? "text" : "password"}
              value={form.access_token}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, access_token: e.target.value }))
              }
              placeholder="Permanent access token"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowAccessToken(!showAccessToken)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
            >
              {showAccessToken ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Business Account ID */}
        <div className="space-y-2">
          <Label>Business Account ID</Label>
          <Input
            type="text"
            value={form.business_account_id}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                business_account_id: e.target.value,
              }))
            }
            placeholder="Your WhatsApp Business account ID"
          />
        </div>

        {/* Webhook Verify Token */}
        <div className="space-y-2">
          <Label>Webhook Verify Token</Label>
          <div className="flex gap-2">
            <Input
              type="text"
              value={form.webhook_verify_token}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  webhook_verify_token: e.target.value,
                }))
              }
              placeholder="Token for webhook verification"
              className="flex-1"
            />
            <Button type="button" variant="outline" onClick={generateVerifyToken}>
              Generate
            </Button>
          </div>
        </div>

        {/* App Secret */}
        <div className="space-y-2">
          <Label>App Secret</Label>
          <div className="relative">
            <Input
              type={showAppSecret ? "text" : "password"}
              value={form.app_secret}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, app_secret: e.target.value }))
              }
              placeholder="Your Facebook app secret"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowAppSecret(!showAppSecret)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
            >
              {showAppSecret ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter className="border-t px-6 py-4 justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={onSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {isNew ? "Add Account" : "Save Changes"}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

export default function WhatsAppSettingsPage() {
  const { data: accounts, isLoading, isError } = useWhatsAppSettings()
  const createMutation = useCreateWhatsAppAccount()
  const updateMutation = useUpdateWhatsAppAccount()
  const deleteMutation = useDeleteWhatsAppAccount()

  const [editingId, setEditingId] = useState<number | "new" | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [copiedWebhook, setCopiedWebhook] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const webhookUrl = `${WEBHOOK_BASE_URL}/integrations/whatsapp/webhook`

  function startEdit(account: WhatsAppSettings) {
    setEditingId(account.id)
    setForm({
      enabled: account.enabled,
      display_name: account.display_name,
      is_default: account.is_default,
      phone_number_id: account.phone_number_id,
      access_token: account.access_token,
      business_account_id: account.business_account_id,
      webhook_verify_token: account.webhook_verify_token,
      app_secret: account.app_secret,
    })
  }

  function startNew() {
    setEditingId("new")
    setForm(emptyForm)
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleSave() {
    setSuccessMessage(null)
    try {
      if (editingId === "new") {
        await createMutation.mutateAsync(form)
        setSuccessMessage("WhatsApp account created successfully.")
      } else if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: form })
        setSuccessMessage("WhatsApp account updated successfully.")
      }
      setEditingId(null)
      setForm(emptyForm)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch {
      // Error surfaced via mutation state
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this WhatsApp account?")) return
    try {
      await deleteMutation.mutateAsync(id)
      setSuccessMessage("WhatsApp account deleted.")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch {
      // Error surfaced via mutation state
    }
  }

  async function handleSetDefault(id: number) {
    try {
      await updateMutation.mutateAsync({ id, data: { is_default: true } })
    } catch {
      // Error surfaced via mutation state
    }
  }

  function copyWebhookUrl() {
    navigator.clipboard.writeText(webhookUrl)
    setCopiedWebhook(true)
    setTimeout(() => setCopiedWebhook(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading WhatsApp settings...
        </span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="py-16 text-center">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
        <p className="text-sm text-destructive">
          Failed to load WhatsApp settings. Please try again.
        </p>
      </div>
    )
  }

  const saving = createMutation.isPending || updateMutation.isPending
  const mutationError =
    createMutation.error || updateMutation.error
      ? (createMutation.error || updateMutation.error) instanceof Error
        ? ((createMutation.error || updateMutation.error) as Error).message
        : "Failed to save."
      : null

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/settings/integrations"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Integrations
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">WhatsApp Settings</h1>
              <p className="text-sm text-muted-foreground">
                Manage your WhatsApp Business accounts
              </p>
            </div>
          </div>
          {!editingId && (
            <Button onClick={startNew}>
              <Plus className="h-4 w-4" />
              Add Account
            </Button>
          )}
        </div>
      </div>

      {/* Success message */}
      {successMessage && (
        <Alert className="border-green-200 bg-green-50 text-green-700 mb-4 max-w-2xl">
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Webhook URL */}
      <Card className="max-w-2xl mb-4">
        <CardContent className="p-4">
          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <p className="text-xs text-muted-foreground">
              Configure this URL in your Facebook App webhook settings (shared
              by all accounts)
            </p>
            <div className="flex gap-2">
              <Input
                type="text"
                value={webhookUrl}
                readOnly
                className="flex-1 bg-muted text-muted-foreground"
              />
              <Button type="button" variant="outline" onClick={copyWebhookUrl}>
                {copiedWebhook ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit/New form */}
      {editingId && (
        <div className="mb-4">
          <AccountForm
            form={form}
            setForm={setForm}
            onSave={handleSave}
            onCancel={cancelEdit}
            saving={saving}
            error={mutationError}
            isNew={editingId === "new"}
          />
        </div>
      )}

      {/* Accounts list */}
      {accounts && accounts.length > 0 ? (
        <div className="space-y-3 max-w-2xl">
          {accounts.map((account) => (
            <Card
              key={account.id}
              className={cn(
                "transition-colors",
                !account.enabled && "opacity-60"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "size-2.5 rounded-full shrink-0",
                        account.enabled ? "bg-green-500" : "bg-muted-foreground/30"
                      )}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {account.display_name || account.phone_number_id}
                        </span>
                        {account.is_default && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Phone ID: {account.phone_number_id || "—"}
                        {account.business_account_id &&
                          ` · BA: ${account.business_account_id}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!account.is_default && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => handleSetDefault(account.id)}
                        title="Set as default"
                      >
                        <Star className="size-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => startEdit(account)}
                      title="Edit"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(account.id)}
                      title="Delete"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        !editingId && (
          <Card className="max-w-2xl">
            <CardContent className="py-12 text-center">
              <MessageCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                No WhatsApp accounts configured
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Add an account to start messaging
              </p>
              <Button className="mt-4" onClick={startNew}>
                <Plus className="h-4 w-4" />
                Add Account
              </Button>
            </CardContent>
          </Card>
        )
      )}
    </div>
  )
}
