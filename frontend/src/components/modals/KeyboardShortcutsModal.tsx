"use client"

import { useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

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
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          {Object.entries(groups).map(([category, shortcuts], groupIndex) => (
            <div key={category}>
              {groupIndex > 0 && <Separator className="mb-4" />}
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts.map((shortcut, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-1.5"
                  >
                    <span className="text-sm text-foreground/80">
                      {shortcut.description}
                    </span>
                    <Badge variant="outline" className="font-mono text-xs font-semibold">
                      {formatKey(shortcut)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="justify-center sm:justify-center">
          <p className="text-xs text-muted-foreground">Press ? to toggle this panel</p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
