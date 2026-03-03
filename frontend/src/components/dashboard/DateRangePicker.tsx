"use client"

import { useState, useRef, useEffect } from "react"
import { Calendar, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
} from "date-fns"

interface DateRange {
  from: string
  to: string
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

interface PresetOption {
  label: string
  getRange: () => DateRange
}

function toDateString(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

function formatDisplayDate(dateStr: string): string {
  try {
    return format(new Date(dateStr + "T00:00:00"), "MMM d, yyyy")
  } catch {
    return dateStr
  }
}

function formatRangeLabel(from: string, to: string): string {
  const fromFormatted = formatDisplayDate(from)
  const toFormatted = formatDisplayDate(to)
  const fromYear = from.slice(0, 4)
  const toYear = to.slice(0, 4)

  if (fromYear === toYear) {
    const fromShort = format(new Date(from + "T00:00:00"), "MMM d")
    return `${fromShort} - ${toFormatted}`
  }
  return `${fromFormatted} - ${toFormatted}`
}

export default function DateRangePicker({
  value,
  onChange,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [customFrom, setCustomFrom] = useState(value.from)
  const [customTo, setCustomTo] = useState(value.to)

  const today = new Date()

  const presets: PresetOption[] = [
    {
      label: "Last 7 Days",
      getRange: () => ({
        from: toDateString(subDays(today, 7)),
        to: toDateString(today),
      }),
    },
    {
      label: "Last 30 Days",
      getRange: () => ({
        from: toDateString(subDays(today, 30)),
        to: toDateString(today),
      }),
    },
    {
      label: "Last 60 Days",
      getRange: () => ({
        from: toDateString(subDays(today, 60)),
        to: toDateString(today),
      }),
    },
    {
      label: "Last 90 Days",
      getRange: () => ({
        from: toDateString(subDays(today, 90)),
        to: toDateString(today),
      }),
    },
    {
      label: "This Month",
      getRange: () => ({
        from: toDateString(startOfMonth(today)),
        to: toDateString(endOfMonth(today)),
      }),
    },
    {
      label: "Last Month",
      getRange: () => {
        const lastMonth = subMonths(today, 1)
        return {
          from: toDateString(startOfMonth(lastMonth)),
          to: toDateString(endOfMonth(lastMonth)),
        }
      },
    },
    {
      label: "This Quarter",
      getRange: () => ({
        from: toDateString(startOfQuarter(today)),
        to: toDateString(endOfQuarter(today)),
      }),
    },
    {
      label: "This Year",
      getRange: () => ({
        from: toDateString(startOfYear(today)),
        to: toDateString(endOfYear(today)),
      }),
    },
  ]

  function handlePresetClick(preset: PresetOption) {
    const range = preset.getRange()
    onChange(range)
    setIsOpen(false)
    setShowCustom(false)
  }

  function handleCustomApply() {
    if (customFrom && customTo && customFrom <= customTo) {
      onChange({ from: customFrom, to: customTo })
      setIsOpen(false)
      setShowCustom(false)
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setShowCustom(false) }}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span>{formatRangeLabel(value.from, value.to)}</span>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-72 p-0">
        {!showCustom ? (
          <div className="py-1">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePresetClick(preset)}
                className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent transition-colors"
              >
                {preset.label}
              </button>
            ))}
            <Separator className="my-1" />
            <button
              onClick={() => {
                setCustomFrom(value.from)
                setCustomTo(value.to)
                setShowCustom(true)
              }}
              className="w-full px-4 py-2 text-left text-sm text-primary font-medium hover:bg-accent transition-colors"
            >
              Custom Range...
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <div>
              <Label htmlFor="date-range-from" className="text-xs mb-1 block">
                From
              </Label>
              <Input
                id="date-range-from"
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="date-range-to" className="text-xs mb-1 block">
                To
              </Label>
              <Input
                id="date-range-to"
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </div>
            {customFrom && customTo && customFrom > customTo && (
              <p className="text-xs text-destructive">
                Start date must be before or equal to end date
              </p>
            )}
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setShowCustom(false)}
              >
                Back
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={handleCustomApply}
                disabled={
                  !customFrom || !customTo || customFrom > customTo
                }
              >
                Apply
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
