"use client"

import { useState, useEffect } from "react"
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useWhatsAppSettings,
  useSaveWhatsAppSettings,
} from "@/hooks/useIntegrations"
import type { WhatsAppSettings } from "@/types/integration"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

const WEBHOOK_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

export default function WhatsAppSettingsPage() {
  const { data: settings, isLoading, isError } = useWhatsAppSettings()
  const saveMutation = useSaveWhatsAppSettings()

  const [form, setForm] = useState<Partial<WhatsAppSettings>>({
    enabled: false,
    phone_number_id: "",
    access_token: "",
    business_account_id: "",
    webhook_verify_token: "",
    app_secret: "",
  })

  const [showAccessToken, setShowAccessToken] = useState(false)
  const [showAppSecret, setShowAppSecret] = useState(false)
  const [copiedWebhook, setCopiedWebhook] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (settings) {
      setForm({
        enabled: settings.enabled,
        phone_number_id: settings.phone_number_id,
        access_token: settings.access_token,
        business_account_id: settings.business_account_id,
        webhook_verify_token: settings.webhook_verify_token,
        app_secret: settings.app_secret,
      })
    }
  }, [settings])

  async function handleSave() {
    setSuccessMessage(null)
    try {
      await saveMutation.mutateAsync(form)
      setSuccessMessage("WhatsApp settings saved successfully.")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch {
      // Error surfaced via mutation state
    }
  }

  function generateVerifyToken() {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let token = ""
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setForm((prev) => ({ ...prev, webhook_verify_token: token }))
  }

  function copyWebhookUrl() {
    const url = `${WEBHOOK_BASE_URL}/integrations/whatsapp/webhook`
    navigator.clipboard.writeText(url)
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

  const webhookUrl = `${WEBHOOK_BASE_URL}/integrations/whatsapp/webhook`

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
        <div className="flex items-center gap-3">
          <MessageCircle className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">
              WhatsApp Settings
            </h1>
            <p className="text-sm text-muted-foreground">
              Configure WhatsApp Business messaging integration
            </p>
          </div>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardContent className="p-6 space-y-5">
          {/* Enabled Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable WhatsApp</Label>
              <p className="text-xs text-muted-foreground">
                Activate WhatsApp messaging for your CRM
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
              value={form.phone_number_id || ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  phone_number_id: e.target.value,
                }))
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
                value={form.access_token || ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    access_token: e.target.value,
                  }))
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
              value={form.business_account_id || ""}
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
                value={form.webhook_verify_token || ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    webhook_verify_token: e.target.value,
                  }))
                }
                placeholder="Token for webhook verification"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={generateVerifyToken}
              >
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
                value={form.app_secret || ""}
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

          {/* Webhook URL (read-only) */}
          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <p className="text-xs text-muted-foreground">
              Configure this URL in your Facebook App webhook settings
            </p>
            <div className="flex gap-2">
              <Input
                type="text"
                value={webhookUrl}
                readOnly
                className="flex-1 bg-muted text-muted-foreground"
              />
              <Button
                type="button"
                variant="outline"
                onClick={copyWebhookUrl}
              >
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

          {/* Error */}
          {saveMutation.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {saveMutation.error instanceof Error
                  ? saveMutation.error.message
                  : "Failed to save settings."}
              </AlertDescription>
            </Alert>
          )}

          {/* Success */}
          {successMessage && (
            <Alert className="border-green-200 bg-green-50 text-green-700">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="border-t px-6 py-4 justify-end">
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
