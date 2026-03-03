"use client"

import { useState, useRef, useEffect } from "react"
import { Phone, ChevronDown, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useIntegrationStatus,
  useMakeExotelCall,
} from "@/hooks/useIntegrations"
import { integrationsApi } from "@/lib/api/integrations"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CallButtonProps {
  phoneNumber: string
  entityType: string
  entityId: number
}

export default function CallButton({
  phoneNumber,
  entityType,
  entityId,
}: CallButtonProps) {
  const { data: status, isLoading: statusLoading } = useIntegrationStatus()
  const makeExotelCall = useMakeExotelCall()

  const [showDropdown, setShowDropdown] = useState(false)
  const [calling, setCalling] = useState(false)
  const [callError, setCallError] = useState<string | null>(null)
  const [twilioLoading, setTwilioLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const hasTwilio = status?.twilio_enabled ?? false
  const hasExotel = status?.exotel_enabled ?? false
  const hasAny = hasTwilio || hasExotel

  async function handleCallViaTwilio() {
    setCallError(null)
    setTwilioLoading(true)
    setShowDropdown(false)
    try {
      const { token } = await integrationsApi.getVoIPToken()
      // Dispatch a custom event that a Twilio softphone component can listen to
      window.dispatchEvent(
        new CustomEvent("precept:twilio-call", {
          detail: {
            phoneNumber,
            token,
            entityType,
            entityId,
          },
        })
      )
    } catch (err) {
      setCallError(
        err instanceof Error ? err.message : "Failed to initiate Twilio call"
      )
    } finally {
      setTwilioLoading(false)
    }
  }

  async function handleCallViaExotel() {
    setCallError(null)
    setCalling(true)
    setShowDropdown(false)
    try {
      await makeExotelCall.mutateAsync({ to: phoneNumber })
    } catch (err) {
      setCallError(
        err instanceof Error ? err.message : "Failed to initiate Exotel call"
      )
    } finally {
      setCalling(false)
    }
  }

  async function handleDefaultCall() {
    if (!hasAny) return

    // If only one option, use it directly
    if (hasTwilio && !hasExotel) {
      handleCallViaTwilio()
      return
    }
    if (hasExotel && !hasTwilio) {
      handleCallViaExotel()
      return
    }

    // Both available, show dropdown
    setShowDropdown(!showDropdown)
  }

  const isLoading = calling || twilioLoading || statusLoading
  const isDisabled = isLoading || !hasAny

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <div className="flex items-center">
        <Button
          onClick={handleDefaultCall}
          disabled={isDisabled}
          className={cn(
            "rounded-r-none",
            isDisabled
              ? ""
              : "bg-green-600 text-white hover:bg-green-700"
          )}
          size="sm"
          title={
            !hasAny
              ? "No telephony integration enabled"
              : `Call ${phoneNumber}`
          }
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Phone className="h-4 w-4" />
          )}
          Call
        </Button>

        {hasTwilio && hasExotel && (
          <Button
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={isLoading}
            className={cn(
              "rounded-l-none border-l px-1.5",
              isLoading
                ? ""
                : "bg-green-600 text-white hover:bg-green-700 border-green-700"
            )}
            size="sm"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        )}

        {!(hasTwilio && hasExotel) && (
          <span className="sr-only">Single call option</span>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-1 w-48 bg-background border border-border rounded-md shadow-lg z-50">
          <div className="py-1">
            {hasTwilio && (
              <button
                onClick={handleCallViaTwilio}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Phone className="h-4 w-4 text-blue-600" />
                Call via Twilio
              </button>
            )}
            {hasExotel && (
              <button
                onClick={handleCallViaExotel}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Phone className="h-4 w-4 text-purple-600" />
                Call via Exotel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error tooltip */}
      {callError && (
        <div className="absolute right-0 mt-1 w-64 z-50">
          <Alert variant="destructive" className="shadow-lg">
            <AlertCircle className="h-3.5 w-3.5" />
            <AlertDescription>
              <p className="text-xs">{callError}</p>
              <button
                onClick={() => setCallError(null)}
                className="mt-1 text-xs text-destructive hover:text-destructive/80 underline"
              >
                Dismiss
              </button>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  )
}
