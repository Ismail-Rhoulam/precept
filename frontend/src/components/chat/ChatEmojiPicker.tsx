"use client"

import { useState, useRef, useCallback, lazy, Suspense } from "react"
import { Smile } from "lucide-react"
import { useTheme } from "next-themes"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Theme } from "emoji-picker-react"

// Lazy-load the heavy emoji picker bundle
const EmojiPicker = lazy(() => import("emoji-picker-react"))

interface ChatEmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
  disabled?: boolean
}

export default function ChatEmojiPicker({ onEmojiSelect, disabled }: ChatEmojiPickerProps) {
  const [open, setOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()

  const handlePick = useCallback(
    (emojiData: { emoji: string }) => {
      onEmojiSelect(emojiData.emoji)
    },
    [onEmojiSelect]
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 size-9 rounded-full hover:bg-muted/60"
          disabled={disabled}
        >
          <Smile className="size-5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        ref={contentRef}
        side="top"
        align="start"
        className="w-[350px] p-0 border-none shadow-xl rounded-2xl overflow-hidden"
        sideOffset={8}
        onInteractOutside={(e) => {
          // Allow genuine outside clicks to close, but prevent
          // the emoji picker's internal clicks from closing the popover
          if (contentRef.current?.contains(e.target as Node)) {
            e.preventDefault()
          }
        }}
      >
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-[350px] bg-background text-muted-foreground text-sm">
              Loading...
            </div>
          }
        >
          <EmojiPicker
            onEmojiClick={handlePick}
            theme={resolvedTheme === "dark" ? Theme.DARK : Theme.LIGHT}
            width="100%"
            height={350}
            searchPlaceHolder="Search emoji..."
            previewConfig={{ showPreview: false }}
            skinTonesDisabled
            lazyLoadEmojis
          />
        </Suspense>
      </PopoverContent>
    </Popover>
  )
}
