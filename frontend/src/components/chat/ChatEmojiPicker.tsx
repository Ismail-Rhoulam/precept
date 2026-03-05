"use client"

import { useState, useCallback, lazy, Suspense } from "react"
import { Smile } from "lucide-react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

// Lazy-load the heavy emoji picker bundle
const EmojiPicker = lazy(() => import("emoji-picker-react"))

interface ChatEmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
  disabled?: boolean
}

export default function ChatEmojiPicker({ onEmojiSelect, disabled }: ChatEmojiPickerProps) {
  const [open, setOpen] = useState(false)

  const handlePick = useCallback(
    (emojiData: { emoji: string }) => {
      onEmojiSelect(emojiData.emoji)
      // Don't close — let user pick multiple emojis quickly (WhatsApp-like)
    },
    [onEmojiSelect]
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 h-[38px] w-[38px]"
          disabled={disabled}
        >
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-[350px] p-0 border-none shadow-xl"
        sideOffset={8}
      >
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-[350px] text-muted-foreground text-sm">
              Loading...
            </div>
          }
        >
          <EmojiPicker
            onEmojiClick={handlePick}
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
