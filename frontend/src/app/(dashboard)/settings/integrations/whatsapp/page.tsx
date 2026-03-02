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
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">
          Loading WhatsApp settings...
        </span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="py-16 text-center">
        <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
        <p className="text-sm text-red-600">
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
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Integrations
        </Link>
        <div className="flex items-center gap-3">
          <MessageCircle className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              WhatsApp Settings
            </h1>
            <p className="text-sm text-gray-500">
              Configure WhatsApp Business messaging integration
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm max-w-2xl">
        <div className="p-6 space-y-5">
          {/* Enabled Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Enable WhatsApp
              </label>
              <p className="text-xs text-gray-500">
                Activate WhatsApp messaging for your CRM
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({ ...prev, enabled: !prev.enabled }))
              }
              className={cn(
                "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                form.enabled ? "bg-primary" : "bg-gray-300"
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

          {/* Phone Number ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number ID
            </label>
            <input
              type="text"
              value={form.phone_number_id || ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  phone_number_id: e.target.value,
                }))
              }
              placeholder="Your WhatsApp phone number ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Access Token */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Access Token
            </label>
            <div className="relative">
              <input
                type={showAccessToken ? "text" : "password"}
                value={form.access_token || ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    access_token: e.target.value,
                  }))
                }
                placeholder="Permanent access token"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowAccessToken(!showAccessToken)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Account ID
            </label>
            <input
              type="text"
              value={form.business_account_id || ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  business_account_id: e.target.value,
                }))
              }
              placeholder="Your WhatsApp Business account ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Webhook Verify Token */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Webhook Verify Token
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.webhook_verify_token || ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    webhook_verify_token: e.target.value,
                  }))
                }
                placeholder="Token for webhook verification"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <button
                type="button"
                onClick={generateVerifyToken}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                Generate
              </button>
            </div>
          </div>

          {/* App Secret */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              App Secret
            </label>
            <div className="relative">
              <input
                type={showAppSecret ? "text" : "password"}
                value={form.app_secret || ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, app_secret: e.target.value }))
                }
                placeholder="Your Facebook app secret"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowAppSecret(!showAppSecret)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Webhook URL
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Configure this URL in your Facebook App webhook settings
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={webhookUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 text-gray-600"
              />
              <button
                type="button"
                onClick={copyWebhookUrl}
                className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 transition-colors"
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
              </button>
            </div>
          </div>

          {/* Error */}
          {saveMutation.isError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">
                {saveMutation.error instanceof Error
                  ? saveMutation.error.message
                  : "Failed to save settings."}
              </p>
            </div>
          )}

          {/* Success */}
          {successMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md transition-colors",
              saveMutation.isPending
                ? "bg-primary/60 cursor-not-allowed"
                : "bg-primary hover:bg-primary/90"
            )}
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
          </button>
        </div>
      </div>
    </div>
  )
}
