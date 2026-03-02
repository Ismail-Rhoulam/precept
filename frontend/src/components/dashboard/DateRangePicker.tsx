"use client"

import { useState, useRef, useEffect } from "react"
import { Calendar, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
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
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setShowCustom(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-white border rounded-md transition-colors shadow-sm",
          isOpen
            ? "border-blue-300 ring-2 ring-blue-100"
            : "border-gray-300 hover:bg-gray-50"
        )}
      >
        <Calendar className="w-4 h-4 text-gray-400" />
        <span className="text-gray-700">
          {formatRangeLabel(value.from, value.to)}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-gray-400 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {!showCustom ? (
            <div className="py-1">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePresetClick(preset)}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  onClick={() => {
                    setCustomFrom(value.from)
                    setCustomTo(value.to)
                    setShowCustom(true)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-blue-600 font-medium hover:bg-blue-50 transition-colors"
                >
                  Custom Range...
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              <div>
                <label
                  htmlFor="date-range-from"
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  From
                </label>
                <input
                  id="date-range-from"
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="date-range-to"
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  To
                </label>
                <input
                  id="date-range-to"
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {customFrom && customTo && customFrom > customTo && (
                <p className="text-xs text-red-600">
                  Start date must be before or equal to end date
                </p>
              )}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => setShowCustom(false)}
                  className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleCustomApply}
                  disabled={
                    !customFrom || !customTo || customFrom > customTo
                  }
                  className={cn(
                    "flex-1 px-3 py-2 text-sm font-medium text-white rounded-md transition-colors",
                    !customFrom || !customTo || customFrom > customTo
                      ? "bg-blue-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  )}
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
