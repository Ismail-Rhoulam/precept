"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Settings,
  ArrowLeft,
  Loader2,
  Save,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCRMSettings, useUpdateCRMSettings } from "@/hooks/useIntegrations"
import type { CRMSettingsData } from "@/types/integration"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

const CURRENCIES = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "INR", label: "INR - Indian Rupee" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "SGD", label: "SGD - Singapore Dollar" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "CNY", label: "CNY - Chinese Yuan" },
  { value: "BRL", label: "BRL - Brazilian Real" },
  { value: "AED", label: "AED - UAE Dirham" },
  { value: "SAR", label: "SAR - Saudi Riyal" },
]

export default function GeneralSettingsPage() {
  const { data: settings, isLoading, isError } = useCRMSettings()
  const updateMutation = useUpdateCRMSettings()

  const [form, setForm] = useState<Partial<CRMSettingsData>>({
    brand_name: "",
    currency: "USD",
    enable_forecasting: false,
  })

  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (settings) {
      setForm({
        brand_name: settings.brand_name,
        currency: settings.currency,
        enable_forecasting: settings.enable_forecasting,
      })
    }
  }, [settings])

  async function handleSave() {
    setSuccessMessage(null)
    try {
      await updateMutation.mutateAsync(form)
      setSuccessMessage("Settings saved successfully.")
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
          Loading settings...
        </span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="py-16 text-center">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
        <p className="text-sm text-destructive">
          Failed to load settings. Please try again.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>
        <div className="flex items-center gap-3">
          <Settings className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">
              General Settings
            </h1>
            <p className="text-sm text-muted-foreground">
              Configure general CRM preferences
            </p>
          </div>
        </div>
      </div>

      <Card className="max-w-5xl">
        <CardContent className="p-6 space-y-5">
          {/* Brand Name */}
          <div className="space-y-2">
            <Label htmlFor="brand-name">Brand Name</Label>
            <Input
              id="brand-name"
              type="text"
              value={form.brand_name || ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, brand_name: e.target.value }))
              }
              placeholder="Your company or brand name"
            />
            <p className="text-xs text-muted-foreground">
              This name will be displayed across the CRM interface
            </p>
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select
              value={form.currency || "USD"}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, currency: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.value} value={currency.value}>
                    {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Default currency for deals, products, and reports
            </p>
          </div>

          {/* Enable Forecasting */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Forecasting</Label>
              <p className="text-xs text-muted-foreground">
                Show revenue forecasting features in the dashboard
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  enable_forecasting: !prev.enable_forecasting,
                }))
              }
              className={cn(
                "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                form.enable_forecasting ? "bg-primary" : "bg-muted-foreground/30"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-card shadow ring-0 transition duration-200 ease-in-out",
                  form.enable_forecasting ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>

          {/* Error */}
          {updateMutation.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {updateMutation.error instanceof Error
                  ? updateMutation.error.message
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

        {/* Footer */}
        <CardFooter className="border-t px-6 py-4 justify-end">
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
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
