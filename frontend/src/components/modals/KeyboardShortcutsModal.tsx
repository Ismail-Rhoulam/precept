"use client"

import { X } from "lucide-react"
import { useEffect } from "react"

interface ShortcutEntry {
  key: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  description: string
  category: string
}

const ALL_SHORTCUTS: ShortcutEntry[] = [
  // Navigation
  { key: "?", description: "Show keyboard shortcuts", category: "Navigation" },
  { key: "Escape", description: "Close modal / cancel", category: "Navigation" },
  // Actions
  { key: "K", ctrl: true, description: "Focus search", category: "Actions" },
  // Leads
  { key: "N", description: "New lead (on Leads page)", category: "Leads" },
  // Deals
  { key: "N", description: "New deal (on Deals page)", category: "Deals" },
  // Calendar
  { key: "N", description: "New event (on Calendar page)", category: "Calendar" },
]

function isMac(): boolean {
  if (typeof navigator === "undefined") return false
  return /mac/i.test(navigator.platform)
}

function formatKey(shortcut: ShortcutEntry): string {
  const parts: string[] = []
  if (shortcut.ctrl || shortcut.meta) {
    parts.push(isMac() ? "Cmd" : "Ctrl")
  }
  if (shortcut.shift) parts.push("Shift")
  parts.push(shortcut.key)
  return parts.join(" + ")
}

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce(
    (acc, item) => {
      const k = key(item)
      if (!acc[k]) acc[k] = []
      acc[k].push(item)
      return acc
    },
    {} as Record<string, T[]>
  )
}

interface KeyboardShortcutsModalProps {
  onClose: () => void
}

export function KeyboardShortcutsModal({ onClose }: KeyboardShortcutsModalProps) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  const groups = groupBy(ALL_SHORTCUTS, (s) => s.category)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {Object.entries(groups).map(([category, shortcuts]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts.map((shortcut, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-1.5"
                  >
                    <span className="text-sm text-gray-700">
                      {shortcut.description}
                    </span>
                    <kbd className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-200 rounded text-xs font-mono text-gray-600 font-semibold">
                      {formatKey(shortcut)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">Press ? to toggle this panel</p>
        </div>
      </div>
    </div>
  )
}
