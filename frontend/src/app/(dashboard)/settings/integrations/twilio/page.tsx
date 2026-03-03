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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTwilioSettings, useSaveTwilioSettings } from "@/hooks/useIntegrations"
import type { TwilioSettings } from "@/types/integration"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function TwilioSettingsPage() {
  const { data: settings, isLoading, isError } = useTwilioSettings()
  const saveMutation = useSaveTwilioSettings()

  const [form, setForm] = useState<Partial<TwilioSettings>>({
    enabled: false,
    account_sid: "",
    auth_token: "",
    api_key: "",
    api_secret: "",
    twiml_sid: "",
    record_calls: false,
  })

  const [showAuthToken, setShowAuthToken] = useState(false)
  const [showApiSecret, setShowApiSecret] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (settings) {
      setForm({
        enabled: settings.enabled,
        account_sid: settings.account_sid,
        auth_token: settings.auth_token,
        api_key: settings.api_key,
        api_secret: settings.api_secret,
        twiml_sid: settings.twiml_sid,
        record_calls: settings.record_calls,
      })
    }
  }, [settings])

  async function handleSave() {
    setSuccessMessage(null)
    try {
      await saveMutation.mutateAsync(form)
      setSuccessMessage("Twilio settings saved successfully.")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch {
      // Error surfaced via mutation state
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading Twilio settings...
        </span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="py-16 text-center">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
        <p className="text-sm text-destructive">
          Failed to load Twilio settings. Please try again.
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
            <h1 className="text-2xl font-bold">Twilio Settings</h1>
            <p className="text-sm text-muted-foreground">
              Configure Twilio for VoIP calling and call recording
            </p>
          </div>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardContent className="p-6 space-y-5">
          {/* Enabled Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Twilio</Label>
              <p className="text-xs text-muted-foreground">
                Activate Twilio integration for your CRM
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
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                  form.enabled ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>

          {/* Account SID */}
          <div className="space-y-2">
            <Label>Account SID</Label>
            <Input
              type="text"
              value={form.account_sid || ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, account_sid: e.target.value }))
              }
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
          </div>

          {/* Auth Token */}
          <div className="space-y-2">
            <Label>Auth Token</Label>
            <div className="relative">
              <Input
                type={showAuthToken ? "text" : "password"}
                value={form.auth_token || ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, auth_token: e.target.value }))
                }
                placeholder="Your Twilio auth token"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowAuthToken(!showAuthToken)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              >
                {showAuthToken ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <Label>API Key</Label>
            <Input
              type="text"
              value={form.api_key || ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, api_key: e.target.value }))
              }
              placeholder="SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
          </div>

          {/* API Secret */}
          <div className="space-y-2">
            <Label>API Secret</Label>
            <div className="relative">
              <Input
                type={showApiSecret ? "text" : "password"}
                value={form.api_secret || ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, api_secret: e.target.value }))
                }
                placeholder="Your Twilio API secret"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiSecret(!showApiSecret)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              >
                {showApiSecret ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* TwiML SID */}
          <div className="space-y-2">
            <Label>TwiML App SID</Label>
            <Input
              type="text"
              value={form.twiml_sid || ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, twiml_sid: e.target.value }))
              }
              placeholder="APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
          </div>

          {/* Record Calls Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Record Calls</Label>
              <p className="text-xs text-muted-foreground">
                Automatically record all calls made via Twilio
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
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                  form.record_calls ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
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
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
          >
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
