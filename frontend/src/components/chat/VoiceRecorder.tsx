"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Mic, Square, Trash2, Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface VoiceRecorderProps {
  onSend: (file: File) => Promise<void>
  disabled?: boolean
}

export default function VoiceRecorder({ onSend, disabled }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false)
  const [sending, setSending] = useState(false)
  const [duration, setDuration] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    mediaRecorderRef.current = null
    chunksRef.current = []
    setDuration(0)
    setRecording(false)
  }, [])

  useEffect(() => {
    return cleanup
  }, [cleanup])

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Prefer OGG/WebM for WhatsApp compatibility
      const mimeType = MediaRecorder.isTypeSupported("audio/ogg; codecs=opus")
        ? "audio/ogg; codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm; codecs=opus")
          ? "audio/webm; codecs=opus"
          : "audio/webm"

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.start(250) // collect chunks every 250ms
      setRecording(true)
      setDuration(0)
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000)
    } catch {
      // Permission denied or no mic
    }
  }

  function cancelRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }
    cleanup()
  }

  async function stopAndSend() {
    const recorder = mediaRecorderRef.current
    if (!recorder || recorder.state === "inactive") return

    setSending(true)
    const blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/ogg"
        resolve(new Blob(chunksRef.current, { type: mimeType }))
      }
      recorder.stop()
    })

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }

    const ext = blob.type.includes("ogg") ? "ogg" : "webm"
    const file = new File([blob], `voice-note.${ext}`, { type: blob.type })

    try {
      await onSend(file)
    } finally {
      chunksRef.current = []
      mediaRecorderRef.current = null
      setDuration(0)
      setRecording(false)
      setSending(false)
    }
  }

  function formatDuration(secs: number): string {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  if (sending) {
    return (
      <Button variant="ghost" size="icon" className="flex-shrink-0 h-[38px] w-[38px]" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    )
  }

  if (recording) {
    return (
      <div className="flex items-center gap-1 flex-1">
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 h-[38px] w-[38px] text-destructive hover:text-destructive"
          onClick={cancelRecording}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 flex-1 px-2">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm text-muted-foreground font-mono">{formatDuration(duration)}</span>
        </div>
        <Button
          size="icon"
          className={cn("flex-shrink-0 bg-green-600 text-white hover:bg-green-700")}
          onClick={stopAndSend}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="flex-shrink-0 h-[38px] w-[38px]"
      onClick={startRecording}
      disabled={disabled}
      title="Record voice note"
    >
      <Mic className="h-4 w-4" />
    </Button>
  )
}
