"use client"

import { useState } from "react"
import { ArrowRightCircle, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useConvertLead } from "@/hooks/useProducts"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightCircle className="h-5 w-5 text-primary" />
            Convert to Deal
          </DialogTitle>
          <DialogDescription>
            Convert lead{" "}
            <span className="font-medium text-foreground">&quot;{leadName}&quot;</span>{" "}
            into a deal. This will mark the lead as converted and create a new deal record.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Deal Value */}
          <div className="space-y-2">
            <Label htmlFor="deal-value">Deal Value</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                $
              </span>
              <Input
                id="deal-value"
                type="number"
                min="0"
                step="1"
                value={dealValue}
                onChange={(e) => setDealValue(parseFloat(e.target.value) || 0)}
                className="pl-7"
                placeholder="0"
              />
            </div>
          </div>

          {/* Expected Closure Date */}
          <div className="space-y-2">
            <Label htmlFor="closure-date">Expected Closure Date</Label>
            <Input
              id="closure-date"
              type="date"
              value={expectedClosureDate}
              onChange={(e) => setExpectedClosureDate(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              Notes <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
              placeholder="Any notes about this conversion..."
            />
          </div>

          {/* Error */}
          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={convertLead.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConvert}
            disabled={convertLead.isPending}
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
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
