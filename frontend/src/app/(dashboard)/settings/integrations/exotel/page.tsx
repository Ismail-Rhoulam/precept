"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Phone,
  ArrowLeft,
  Loader2,
  Save,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useExotelSettings, useSaveExotelSettings } from "@/hooks/useIntegrations"
import type { ExotelSettings } from "@/types/integration"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ExotelSettingsPage() {
  const { data: settings, isLoading, isError } = useExotelSettings()
  const saveMutation = useSaveExotelSettings()

  const [form, setForm] = useState<Partial<ExotelSettings>>({
    enabled: false,
    account_sid: "",
    subdomain: "",
    api_key: "",
    api_token: "",
    webhook_verify_token: "",
    record_calls: false,
  })

  const [showApiToken, setShowApiToken] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (settings) {
      setForm({
        enabled: settings.enabled,
        account_sid: settings.account_sid,
        subdomain: settings.subdomain,
        api_key: settings.api_key,
        api_token: settings.api_token,
        webhook_verify_token: settings.webhook_verify_token,
        record_calls: settings.record_calls,
      })
    }
  }, [settings])

  async function handleSave() {
    setSuccessMessage(null)
    try {
      await saveMutation.mutateAsync(form)
      setSuccessMessage("Exotel settings saved successfully.")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch {
      // Error surfaced via mutation state
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading Exotel settings...
        </span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="py-16 text-center">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
        <p className="text-sm text-destructive">
          Failed to load Exotel settings. Please try again.
        </p>
      </div>
    )
  }

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
          <Phone className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Exotel Settings</h1>
            <p className="text-sm text-muted-foreground">
              Configure Exotel for cloud telephony and click-to-call
            </p>
          </div>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardContent className="p-6 space-y-5">
          {/* Enabled Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Exotel</Label>
              <p className="text-xs text-muted-foreground">
                Activate Exotel integration for your CRM
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

          <div className="space-y-2">
            <Label>Account SID</Label>
            <Input
              type="text"
              value={form.account_sid || ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, account_sid: e.target.value }))
              }
              placeholder="Your Exotel account SID"
            />
          </div>

          <div className="space-y-2">
            <Label>Subdomain</Label>
            <Input
              type="text"
              value={form.subdomain || ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, subdomain: e.target.value }))
              }
              placeholder="e.g. api.exotel.com"
            />
          </div>

          <div className="space-y-2">
            <Label>API Key</Label>
            <Input
              type="text"
              value={form.api_key || ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, api_key: e.target.value }))
              }
              placeholder="Your Exotel API key"
            />
          </div>

          <div className="space-y-2">
            <Label>API Token</Label>
            <div className="relative">
              <Input
                type={showApiToken ? "text" : "password"}
                value={form.api_token || ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, api_token: e.target.value }))
                }
                placeholder="Your Exotel API token"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiToken(!showApiToken)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              >
                {showApiToken ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

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
              {form.webhook_verify_token && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    copyToClipboard(form.webhook_verify_token || "")
                  }
                  title="Copy to clipboard"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Record Calls Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Record Calls</Label>
              <p className="text-xs text-muted-foreground">
                Automatically record all calls made via Exotel
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  record_calls: !prev.record_calls,
                }))
              }
              className={cn(
                "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                form.record_calls ? "bg-primary" : "bg-muted-foreground/30"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-card shadow ring-0 transition duration-200 ease-in-out",
                  form.record_calls ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>

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
