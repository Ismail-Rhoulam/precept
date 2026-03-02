"use client"

import { useState, useRef, useEffect } from "react"
import { Phone, ChevronDown, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useIntegrationStatus,
  useMakeExotelCall,
} from "@/hooks/useIntegrations"
import { integrationsApi } from "@/lib/api/integrations"

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
        <button
          onClick={handleDefaultCall}
          disabled={isDisabled}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-l-md transition-colors",
            isDisabled
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-700"
          )}
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
        </button>

        {hasTwilio && hasExotel && (
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={isLoading}
            className={cn(
              "inline-flex items-center px-1.5 py-1.5 text-sm font-medium rounded-r-md border-l transition-colors",
              isLoading
                ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                : "bg-green-600 text-white hover:bg-green-700 border-green-700"
            )}
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        )}

        {!(hasTwilio && hasExotel) && (
          <span className="sr-only">Single call option</span>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="py-1">
            {hasTwilio && (
              <button
                onClick={handleCallViaTwilio}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Phone className="h-4 w-4 text-blue-600" />
                Call via Twilio
              </button>
            )}
            {hasExotel && (
              <button
                onClick={handleCallViaExotel}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
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
        <div className="absolute right-0 mt-1 w-64 p-2 bg-red-50 border border-red-200 rounded-md shadow-lg z-50">
          <div className="flex items-start gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700">{callError}</p>
          </div>
          <button
            onClick={() => setCallError(null)}
            className="mt-1 text-xs text-red-500 hover:text-red-700 underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}
