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
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">
          Loading Twilio settings...
        </span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="py-16 text-center">
        <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
        <p className="text-sm text-red-600">
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
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Integrations
        </Link>
        <div className="flex items-center gap-3">
          <Phone className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Twilio Settings
            </h1>
            <p className="text-sm text-gray-500">
              Configure Twilio for VoIP calling and call recording
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
                Enable Twilio
              </label>
              <p className="text-xs text-gray-500">
                Activate Twilio integration for your CRM
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

          {/* Account SID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account SID
            </label>
            <input
              type="text"
              value={form.account_sid || ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, account_sid: e.target.value }))
              }
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Auth Token */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Auth Token
            </label>
            <div className="relative">
              <input
                type={showAuthToken ? "text" : "password"}
                value={form.auth_token || ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, auth_token: e.target.value }))
                }
                placeholder="Your Twilio auth token"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowAuthToken(!showAuthToken)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <input
              type="text"
              value={form.api_key || ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, api_key: e.target.value }))
              }
              placeholder="SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* API Secret */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Secret
            </label>
            <div className="relative">
              <input
                type={showApiSecret ? "text" : "password"}
                value={form.api_secret || ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, api_secret: e.target.value }))
                }
                placeholder="Your Twilio API secret"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowApiSecret(!showApiSecret)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              TwiML App SID
            </label>
            <input
              type="text"
              value={form.twiml_sid || ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, twiml_sid: e.target.value }))
              }
              placeholder="APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Record Calls Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Record Calls
              </label>
              <p className="text-xs text-gray-500">
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
                "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                form.record_calls ? "bg-primary" : "bg-gray-300"
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
