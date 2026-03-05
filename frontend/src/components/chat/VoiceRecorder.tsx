"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Mic, Trash2, Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface VoiceRecorderProps {
  onSend: (file: File) => Promise<void>
  disabled?: boolean
}

/* Animated bars that react to audio levels */
function WaveformBars({ analyser }: { analyser: AnalyserNode | null }) {
  const barsRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!analyser || !barsRef.current) return
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    const bars = barsRef.current.children

    function draw() {
      analyser!.getByteFrequencyData(dataArray)
      const count = bars.length
      for (let i = 0; i < count; i++) {
        // Sample evenly across the frequency range
        const idx = Math.floor((i / count) * dataArray.length)
        const val = dataArray[idx] / 255
        const h = Math.max(4, val * 28)
        ;(bars[i] as HTMLElement).style.height = `${h}px`
      }
      rafRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [analyser])

  return (
    <div ref={barsRef} className="flex items-center gap-[3px] h-7">
      {Array.from({ length: 24 }).map((_, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-destructive/80 transition-[height] duration-75"
          style={{ height: "4px" }}
        />
      ))}
    </div>
  )
}

export default function VoiceRecorder({ onSend, disabled }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false)
  const [sending, setSending] = useState(false)
  const [duration, setDuration] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
    }
    mediaRecorderRef.current = null
    chunksRef.current = []
    setDuration(0)
    setRecording(false)
    setAnalyser(null)
  }, [])

  useEffect(() => {
    return cleanup
  }, [cleanup])

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Set up audio analyser for waveform
      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const node = ctx.createAnalyser()
      node.fftSize = 64
      source.connect(node)
      setAnalyser(node)

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

      recorder.start(250)
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
        const mt = recorder.mimeType || "audio/ogg"
        resolve(new Blob(chunksRef.current, { type: mt }))
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
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
    }
    setAnalyser(null)

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

  function fmt(secs: number): string {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  /* Sending state */
  if (sending) {
    return (
      <div className="flex items-center gap-2 flex-1 animate-in fade-in duration-200">
        <div className="flex items-center gap-2 flex-1 h-9 rounded-2xl bg-muted/60 px-3">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Sending voice note...</span>
        </div>
      </div>
    )
  }

  /* Recording state */
  if (recording) {
    return (
      <div className="flex items-center gap-2 flex-1 animate-in slide-in-from-right-2 fade-in duration-200">
        <Button
          variant="ghost"
          size="icon"
          className="size-9 shrink-0 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={cancelRecording}
        >
          <Trash2 className="size-4" />
        </Button>

        <div className="flex items-center gap-2.5 flex-1 h-9 rounded-2xl bg-muted/60 px-3">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-destructive" />
          </span>
          <span className="text-xs font-mono text-muted-foreground tabular-nums w-8">
            {fmt(duration)}
          </span>
          <WaveformBars analyser={analyser} />
        </div>

        <Button
          size="icon"
          className="size-9 shrink-0 rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
          onClick={stopAndSend}
        >
          <Send className="size-4" />
        </Button>
      </div>
    )
  }

  /* Default: mic button */
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-9 shrink-0 rounded-full"
      onClick={startRecording}
      disabled={disabled}
      title="Record voice note"
    >
      <Mic className="size-4" />
    </Button>
  )
}
