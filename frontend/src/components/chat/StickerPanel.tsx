"use client"

import { useState, useCallback, useEffect } from "react"
import { Sticker, Bookmark, BookmarkCheck, Trash2 } from "lucide-react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import type { WhatsAppMessage } from "@/types/integration"

const STORAGE_KEY = "wa-saved-stickers"

export interface SavedSticker {
  /** The proxy URL for display */
  url: string
  /** The backend media_url path (e.g. /media/whatsapp/...) for sending */
  mediaPath: string
  /** Emoji label from the original sticker */
  emoji: string
  /** When the sticker was saved */
  savedAt: number
}

function loadSavedStickers(): SavedSticker[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
  } catch {
    return []
  }
}

function persistStickers(stickers: SavedSticker[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stickers))
}

/** Check if a sticker URL is already saved */
export function isStickerSaved(url: string): boolean {
  return loadSavedStickers().some((s) => s.url === url)
}

/** Save a sticker from a received message */
export function saveSticker(url: string, mediaPath: string, emoji: string) {
  const stickers = loadSavedStickers()
  if (stickers.some((s) => s.url === url)) return // already saved
  stickers.unshift({ url, mediaPath, emoji, savedAt: Date.now() })
  // Cap at 50 saved stickers
  if (stickers.length > 50) stickers.length = 50
  persistStickers(stickers)
}

/** Remove a saved sticker */
export function removeSavedSticker(url: string) {
  const stickers = loadSavedStickers().filter((s) => s.url !== url)
  persistStickers(stickers)
}

interface StickerPanelProps {
  /** All messages in current conversation – used to show "recent stickers" */
  messages: WhatsAppMessage[]
  /** Called when user picks a sticker to send */
  onStickerSelect: (sticker: SavedSticker) => void
  /** Resolve a message into its full proxy URL */
  resolveUrl: (msg: WhatsAppMessage) => string
  disabled?: boolean
}

export default function StickerPanel({
  messages,
  onStickerSelect,
  resolveUrl,
  disabled,
}: StickerPanelProps) {
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState<SavedSticker[]>([])
  const [tab, setTab] = useState("saved")

  // Refresh saved list when panel opens
  useEffect(() => {
    if (open) setSaved(loadSavedStickers())
  }, [open])

  // Collect received stickers from messages
  const recentStickers: SavedSticker[] = messages
    .filter(
      (m) =>
        m.content_type === "sticker" && m.media_proxy_url
    )
    .map((m) => ({
      url: resolveUrl(m),
      mediaPath: m.media_url,
      emoji: m.content || "",
      savedAt: new Date(m.created_at).getTime(),
    }))
    // dedupe by url
    .filter((s, i, arr) => arr.findIndex((x) => x.url === s.url) === i)
    .slice(0, 30)

  const handleSelect = useCallback(
    (sticker: SavedSticker) => {
      onStickerSelect(sticker)
      setOpen(false)
    },
    [onStickerSelect]
  )

  const handleSave = useCallback((sticker: SavedSticker) => {
    saveSticker(sticker.url, sticker.mediaPath, sticker.emoji)
    setSaved(loadSavedStickers())
  }, [])

  const handleRemove = useCallback((url: string) => {
    removeSavedSticker(url)
    setSaved(loadSavedStickers())
  }, [])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 h-[38px] w-[38px]"
          disabled={disabled}
        >
          <Sticker className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-[320px] p-0 shadow-xl"
        sideOffset={8}
      >
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="w-full rounded-none border-b">
            <TabsTrigger value="saved" className="flex-1 text-xs gap-1">
              <BookmarkCheck className="h-3 w-3" /> Saved
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex-1 text-xs gap-1">
              <Sticker className="h-3 w-3" /> Recent
            </TabsTrigger>
          </TabsList>

          <TabsContent value="saved" className="p-2 m-0">
            {saved.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bookmark className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">No saved stickers</p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                  Tap the bookmark icon on received stickers to save them
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-1 max-h-[250px] overflow-y-auto">
                {saved.map((s) => (
                  <div key={s.url} className="relative group">
                    <button
                      className="w-full aspect-square rounded hover:bg-muted flex items-center justify-center p-1"
                      onClick={() => handleSelect(s)}
                    >
                      <img src={s.url} alt={s.emoji || "Sticker"} className="w-full h-full object-contain" />
                    </button>
                    <button
                      className="absolute top-0 right-0 p-0.5 bg-background/80 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemove(s.url)}
                      title="Remove"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recent" className="p-2 m-0">
            {recentStickers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Sticker className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">No stickers received yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-1 max-h-[250px] overflow-y-auto">
                {recentStickers.map((s) => {
                  const alreadySaved = saved.some((sv) => sv.url === s.url)
                  return (
                    <div key={s.url} className="relative group">
                      <button
                        className="w-full aspect-square rounded hover:bg-muted flex items-center justify-center p-1"
                        onClick={() => handleSelect(s)}
                      >
                        <img src={s.url} alt={s.emoji || "Sticker"} className="w-full h-full object-contain" />
                      </button>
                      {!alreadySaved && (
                        <button
                          className="absolute top-0 right-0 p-0.5 bg-background/80 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleSave(s)}
                          title="Save sticker"
                        >
                          <Bookmark className="h-3 w-3 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}
