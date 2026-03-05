"use client"

import { useState, useCallback } from "react"
import { Bookmark, BookmarkCheck } from "lucide-react"
import type { WhatsAppMessage } from "@/types/integration"
import ImageLightbox from "./ImageLightbox"
import { isStickerSaved, saveSticker, removeSavedSticker } from "./StickerPanel"

interface ChatMediaRendererProps {
  msg: WhatsAppMessage
  resolveUrl: (msg: WhatsAppMessage) => string
}

export default function ChatMediaRenderer({ msg, resolveUrl }: ChatMediaRendererProps) {
  const url = resolveUrl(msg)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [stickerBookmarked, setStickerBookmarked] = useState(() =>
    msg.content_type === "sticker" && url ? isStickerSaved(url) : false
  )
  const mime = msg.mime_type || ""

  if (!url) return null

  const toggleBookmark = useCallback(() => {
    if (stickerBookmarked) {
      removeSavedSticker(url)
      setStickerBookmarked(false)
    } else {
      saveSticker(url, msg.media_url, msg.content || "")
      setStickerBookmarked(true)
    }
  }, [stickerBookmarked, url, msg.media_url, msg.content])

  switch (msg.content_type) {
    case "image":
      return (
        <>
          <img
            src={url}
            alt={msg.content || "Image"}
            className="rounded max-h-60 mb-1 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setLightboxOpen(true)}
          />
          <ImageLightbox
            src={url}
            alt={msg.content || "Image"}
            open={lightboxOpen}
            onOpenChange={setLightboxOpen}
          />
        </>
      )
    case "video":
      return (
        <video controls preload="metadata" className="rounded max-h-60 mb-1 max-w-full">
          <source src={url} type={mime || "video/mp4"} />
          Your browser does not support video playback.
        </video>
      )
    case "audio":
      return (
        <audio controls preload="metadata" className="mb-1 max-w-full">
          <source src={url} type={mime || "audio/ogg"} />
          Your browser does not support audio playback.
        </audio>
      )
    case "sticker":
      return (
        <div className="relative group">
          <img src={url} alt={msg.content || "Sticker"} className="h-32 w-32 object-contain" />
          {/* Bookmark button appears on hover for received stickers */}
          {msg.message_type === "Incoming" && (
            <button
              className="absolute top-0 right-0 p-1 bg-background/80 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={toggleBookmark}
              title={stickerBookmarked ? "Remove from saved" : "Save sticker"}
            >
              {stickerBookmarked ? (
                <BookmarkCheck className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
          )}
        </div>
      )
    case "document":
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline mt-1 block"
        >
          Download file
        </a>
      )
    default:
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline mt-1 block"
        >
          View attachment
        </a>
      )
  }
}
