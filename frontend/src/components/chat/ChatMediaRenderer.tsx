"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Bookmark, BookmarkCheck, Play, Pause, FileDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { WhatsAppMessage } from "@/types/integration"
import ImageLightbox from "./ImageLightbox"
import { isStickerSaved, saveSticker, removeSavedSticker } from "./StickerPanel"

interface ChatMediaRendererProps {
  msg: WhatsAppMessage
  resolveUrl: (msg: WhatsAppMessage) => string
}

/* ── Inline audio player ──────────────────────────────────────── */

function AudioPlayer({ src, isOutgoing }: { src: string; isOutgoing: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    const onTime = () => {
      setCurrentTime(el.currentTime)
      setProgress(el.duration ? (el.currentTime / el.duration) * 100 : 0)
    }
    const onMeta = () => setDuration(el.duration || 0)
    const onEnd = () => { setPlaying(false); setProgress(0); setCurrentTime(0) }
    el.addEventListener("timeupdate", onTime)
    el.addEventListener("loadedmetadata", onMeta)
    el.addEventListener("ended", onEnd)
    return () => {
      el.removeEventListener("timeupdate", onTime)
      el.removeEventListener("loadedmetadata", onMeta)
      el.removeEventListener("ended", onEnd)
    }
  }, [])

  function toggle() {
    const el = audioRef.current
    if (!el) return
    if (playing) {
      el.pause()
      setPlaying(false)
    } else {
      el.play()
      setPlaying(true)
    }
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const el = audioRef.current
    if (!el || !el.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    el.currentTime = pct * el.duration
  }

  function fmt(s: number): string {
    if (!s || !isFinite(s)) return "0:00"
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex items-center gap-2.5 min-w-[200px] py-0.5">
      <audio ref={audioRef} src={src} preload="metadata" />

      <button
        onClick={toggle}
        className={cn(
          "size-8 shrink-0 rounded-full flex items-center justify-center transition-colors",
          isOutgoing
            ? "bg-white/20 hover:bg-white/30"
            : "bg-emerald-600/10 hover:bg-emerald-600/20"
        )}
      >
        {playing ? (
          <Pause className={cn("size-3.5", isOutgoing ? "text-white" : "text-emerald-600")} />
        ) : (
          <Play className={cn("size-3.5 ml-0.5", isOutgoing ? "text-white" : "text-emerald-600")} />
        )}
      </button>

      <div className="flex-1 min-w-0">
        {/* Waveform-style progress bar */}
        <div
          className="relative h-5 flex items-center cursor-pointer"
          onClick={seek}
        >
          <div className="absolute inset-0 flex items-center gap-[2px]">
            {Array.from({ length: 32 }).map((_, i) => {
              // Generate pseudo-random heights for waveform look
              const h = [12, 8, 16, 6, 14, 10, 18, 7, 13, 9, 15, 11, 17, 8, 14, 6, 12, 10, 16, 7, 13, 9, 15, 11, 17, 8, 14, 6, 12, 10, 18, 7][i]
              const filled = (i / 32) * 100 < progress
              return (
                <div
                  key={i}
                  className={cn(
                    "flex-1 rounded-full transition-colors duration-150",
                    filled
                      ? isOutgoing
                        ? "bg-white/80"
                        : "bg-emerald-600/70"
                      : isOutgoing
                        ? "bg-white/25"
                        : "bg-emerald-600/20"
                  )}
                  style={{ height: `${h}px` }}
                />
              )
            })}
          </div>
        </div>

        <span
          className={cn(
            "text-[10px] tabular-nums",
            isOutgoing ? "text-white/60" : "text-muted-foreground"
          )}
        >
          {playing ? fmt(currentTime) : fmt(duration)}
        </span>
      </div>
    </div>
  )
}

/* ── Main renderer ────────────────────────────────────────────── */

export default function ChatMediaRenderer({ msg, resolveUrl }: ChatMediaRendererProps) {
  const url = resolveUrl(msg)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [stickerBookmarked, setStickerBookmarked] = useState(() =>
    msg.content_type === "sticker" && url ? isStickerSaved(url) : false
  )
  const mime = msg.mime_type || ""
  const isOutgoing = msg.message_type === "Outgoing"

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
            className="rounded-xl max-h-60 mb-1 cursor-pointer hover:opacity-90 transition-opacity"
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
        <video
          controls
          preload="metadata"
          className="rounded-xl max-h-60 mb-1 max-w-full"
        >
          <source src={url} type={mime || "video/mp4"} />
        </video>
      )
    case "audio":
      return <AudioPlayer src={url} isOutgoing={isOutgoing} />
    case "sticker":
      return (
        <div className="relative group">
          <img
            src={url}
            alt={msg.content || "Sticker"}
            className="h-32 w-32 object-contain"
          />
          {msg.message_type === "Incoming" && (
            <button
              className="absolute top-0 right-0 p-1 bg-background/80 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={toggleBookmark}
              title={stickerBookmarked ? "Remove from saved" : "Save sticker"}
            >
              {stickerBookmarked ? (
                <BookmarkCheck className="size-3.5 text-green-600" />
              ) : (
                <Bookmark className="size-3.5 text-muted-foreground" />
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
          className={cn(
            "flex items-center gap-2 py-1.5 text-xs font-medium transition-colors",
            isOutgoing
              ? "text-white/90 hover:text-white"
              : "text-emerald-600 hover:text-emerald-700"
          )}
        >
          <FileDown className="size-4 shrink-0" />
          Download file
        </a>
      )
    default:
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex items-center gap-2 py-1.5 text-xs font-medium transition-colors",
            isOutgoing
              ? "text-white/90 hover:text-white"
              : "text-emerald-600 hover:text-emerald-700"
          )}
        >
          <FileDown className="size-4 shrink-0" />
          View attachment
        </a>
      )
  }
}
