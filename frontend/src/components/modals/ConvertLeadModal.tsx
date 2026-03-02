"use client"

import { useState } from "react"
import { X, ArrowRightCircle, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useConvertLead } from "@/hooks/useProducts"

interface ConvertLeadModalProps {
  leadId: number
  leadName: string
  isOpen: boolean
  onClose: () => void
  onConverted: (dealId: number) => void
}

export function ConvertLeadModal({
  leadId,
  leadName,
  isOpen,
  onClose,
  onConverted,
}: ConvertLeadModalProps) {
  const [dealValue, setDealValue] = useState<number>(0)
  const [expectedClosureDate, setExpectedClosureDate] = useState("")
  const [notes, setNotes] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const convertLead = useConvertLead()

  if (!isOpen) return null

  async function handleConvert() {
    setErrorMessage(null)

    try {
      const result = await convertLead.mutateAsync({
        leadId,
        payload: {
          deal_value: dealValue || undefined,
          expected_closure_date: expectedClosureDate || undefined,
          notes: notes.trim() || undefined,
        },
      })
      onConverted(result.deal_id)
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to convert lead. Please try again."
      )
    }
  }

  function handleClose() {
    if (convertLead.isPending) return
    setDealValue(0)
    setExpectedClosureDate("")
    setNotes("")
    setErrorMessage(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <ArrowRightCircle className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900">Convert to Deal</h3>
          </div>
          <button
            onClick={handleClose}
            disabled={convertLead.isPending}
            className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-600">
            Convert lead{" "}
            <span className="font-medium text-gray-900">&quot;{leadName}&quot;</span>{" "}
            into a deal. This will mark the lead as converted and create a new deal record.
          </p>

          {/* Deal Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deal Value
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                $
              </span>
              <input
                type="number"
                min="0"
                step="1"
                value={dealValue}
                onChange={(e) => setDealValue(parseFloat(e.target.value) || 0)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="0"
              />
            </div>
          </div>

          {/* Expected Closure Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expected Closure Date
            </label>
            <input
              type="date"
              value={expectedClosureDate}
              onChange={(e) => setExpectedClosureDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="Any notes about this conversion..."
            />
          </div>

          {/* Error */}
          {errorMessage && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={convertLead.isPending}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConvert}
            disabled={convertLead.isPending}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md transition-colors",
              convertLead.isPending
                ? "bg-primary/60 cursor-not-allowed"
                : "bg-primary hover:bg-primary/90"
            )}
          >
            {convertLead.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Converting...
              </>
            ) : (
              <>
                <ArrowRightCircle className="h-4 w-4" />
                Convert to Deal
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
