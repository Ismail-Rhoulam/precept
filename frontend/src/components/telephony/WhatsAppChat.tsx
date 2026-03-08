"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  MessageCircle,
  Send,
  Loader2,
  Check,
  CheckCheck,
  AlertCircle,
  Clock,
  Inbox,
  Paperclip,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useWhatsAppMessages,
  useSendWhatsAppMessage,
  useUploadWhatsAppMedia,
} from "@/hooks/useIntegrations"
import type { WhatsAppMessage } from "@/types/integration"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ChatMediaRenderer, ChatEmojiPicker, StickerPanel, VoiceRecorder } from "@/components/chat"
import type { SavedSticker } from "@/components/chat"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

function resolveProxyUrl(msg: WhatsAppMessage): string {
  if (msg.media_proxy_url) {
    return msg.media_proxy_url.startsWith("http")
      ? msg.media_proxy_url
      : `${API_BASE.replace(/\/api$/, "")}${msg.media_proxy_url}`
  }
  return ""
}

interface WhatsAppChatProps {
  entityType: "lead" | "deal"
  entityId: number
  phoneNumber: string
  accountId?: number
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffDays > 0) {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
}

function StatusIcon({ status }: { status: WhatsAppMessage["status"] }) {
  switch (status) {
    case "Pending":
      return <Clock className="h-3 w-3 text-muted-foreground" />
    case "Sent":
      return <Check className="h-3 w-3 text-muted-foreground" />
    case "Delivered":
      return <CheckCheck className="h-3 w-3 text-muted-foreground" />
    case "Read":
      return <CheckCheck className="h-3 w-3 text-blue-500" />
    case "Failed":
      return <AlertCircle className="h-3 w-3 text-destructive" />
    default:
      return null
  }
}

function mimeToContentType(mime: string): string {
  if (mime.startsWith("image/")) return "image"
  if (mime.startsWith("video/")) return "video"
  if (mime.startsWith("audio/")) return "audio"
  return "document"
}

export default function WhatsAppChat({
  entityType,
  entityId,
  phoneNumber,
  accountId,
}: WhatsAppChatProps) {
  const {
    data: messages,
    isLoading,
    isError,
  } = useWhatsAppMessages(entityType, entityId)
  const sendMessage = useSendWhatsAppMessage()
  const uploadMedia = useUploadWhatsAppMedia()

  const [input, setInput] = useState("")
  const [attachment, setAttachment] = useState<{
    file: File
    preview?: string
    media_url?: string
    mime_type?: string
  } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const isBusy = sendMessage.isPending || uploadMedia.isPending

  async function handleSend() {
    if (!input.trim() && !attachment) return
    const content = input.trim()
    setInput("")

    try {
      let mediaUrl = ""
      let mimeType = ""
      let contentType = "text"

      if (attachment) {
        if (attachment.media_url) {
          mediaUrl = attachment.media_url
          mimeType = attachment.mime_type || ""
        } else {
          const uploaded = await uploadMedia.mutateAsync(attachment.file)
          mediaUrl = uploaded.media_url
          mimeType = uploaded.mime_type
        }
        contentType = mimeToContentType(mimeType)
        setAttachment(null)
      }

      await sendMessage.mutateAsync({
        to_number: phoneNumber,
        content,
        content_type: contentType,
        media_url: mediaUrl,
        mime_type: mimeType,
        account_id: accountId,
        entity_type: entityType,
        entity_id: entityId,
      })
    } catch {
      setInput(content)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined
    setAttachment({ file, preview })
    e.target.value = ""
  }

  const handleEmojiSelect = useCallback((emoji: string) => {
    setInput((prev) => prev + emoji)
    textareaRef.current?.focus()
  }, [])

  const handleStickerSelect = useCallback(
    async (sticker: SavedSticker) => {
      try {
        await sendMessage.mutateAsync({
          to_number: phoneNumber,
          content: sticker.emoji,
          content_type: "sticker",
          media_url: sticker.mediaPath,
          mime_type: "image/webp",
          account_id: accountId,
          entity_type: entityType,
          entity_id: entityId,
        })
      } catch {
        // Error surfaced via mutation state
      }
    },
    [phoneNumber, entityType, entityId, accountId, sendMessage]
  )

  const handleVoiceSend = useCallback(
    async (file: File) => {
      const uploaded = await uploadMedia.mutateAsync(file)
      await sendMessage.mutateAsync({
        to_number: phoneNumber,
        content: "",
        content_type: "audio",
        media_url: uploaded.media_url,
        mime_type: uploaded.mime_type,
        account_id: accountId,
        entity_type: entityType,
        entity_id: entityId,
      })
    },
    [phoneNumber, entityType, entityId, accountId, sendMessage, uploadMedia]
  )

  const hasContent = input.trim() || attachment

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 px-4 py-3 bg-muted/50">
        <Avatar className="h-6 w-6">
          <AvatarFallback className="bg-green-100">
            <MessageCircle className="h-3 w-3 text-green-600" />
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium text-foreground">WhatsApp</span>
        <span className="text-xs text-muted-foreground">{phoneNumber}</span>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[400px] bg-muted/20">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading messages...</span>
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-8">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <span className="ml-2 text-sm text-destructive">Failed to load messages</span>
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Inbox className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground/60">Send a message to start the conversation</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isOutgoing = msg.message_type === "Outgoing"
              const isSticker = msg.content_type === "sticker"

              return (
                <div key={msg.id} className={cn("flex", isOutgoing ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[75%] rounded-lg shadow-sm",
                      isSticker
                        ? "bg-transparent shadow-none px-1 py-1"
                        : cn(
                            "px-3 py-2",
                            isOutgoing
                              ? "bg-green-100 text-foreground rounded-br-sm"
                              : "bg-background text-foreground border border-border rounded-bl-sm"
                          )
                    )}
                  >
                    {isSticker ? (
                      <div className="flex flex-col items-center">
                        {msg.media_proxy_url ? (
                          <ChatMediaRenderer msg={msg} resolveUrl={resolveProxyUrl} />
                        ) : (
                          <span className="text-4xl">
                            {msg.content && !msg.content.startsWith("[") ? msg.content : "\uD83C\uDFF7\uFE0F"}
                          </span>
                        )}
                      </div>
                    ) : (
                      <>
                        <ChatMediaRenderer msg={msg} resolveUrl={resolveProxyUrl} />
                        {msg.content ? (
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                        ) : msg.content_type !== "text" && !msg.media_proxy_url ? (
                          <p className="text-sm italic text-muted-foreground">
                            {msg.content_type === "image"
                              ? "Photo"
                              : msg.content_type === "audio"
                                ? "Audio message"
                                : msg.content_type === "video"
                                  ? "Video"
                                  : msg.content_type === "document"
                                    ? "Document"
                                    : msg.content_type}
                          </p>
                        ) : null}
                      </>
                    )}
                    <div className={cn("flex items-center gap-1 mt-1", isOutgoing ? "justify-end" : "justify-start")}>
                      <span className="text-[10px] text-muted-foreground">{formatTime(msg.created_at)}</span>
                      {isOutgoing && <StatusIcon status={msg.status} />}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </CardContent>

      {/* Input */}
      <CardFooter className="flex-col items-stretch p-3 gap-2">
        {sendMessage.isError && (
          <Alert variant="destructive" className="py-2">
            <AlertDescription className="text-xs">
              {sendMessage.error instanceof Error ? sendMessage.error.message : "Failed to send message"}
            </AlertDescription>
          </Alert>
        )}
        {attachment && (
          <div className="flex items-center gap-2 px-2 py-1 bg-muted rounded text-xs">
            {attachment.preview ? (
              <img src={attachment.preview} alt="" className="h-8 w-8 rounded object-cover" />
            ) : (
              <Paperclip className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="truncate flex-1">{attachment.file.name}</span>
            <button onClick={() => setAttachment(null)} className="text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-1">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.webp"
            onChange={handleFileSelect}
          />
          <ChatEmojiPicker onEmojiSelect={handleEmojiSelect} disabled={isBusy} />
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-[38px] w-[38px]"
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <StickerPanel
            messages={messages || []}
            onStickerSelect={handleStickerSelect}
            resolveUrl={resolveProxyUrl}
            disabled={isBusy}
          />
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none max-h-24 min-h-[38px]"
            style={{ height: "auto", minHeight: "38px" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = "auto"
              target.style.height = Math.min(target.scrollHeight, 96) + "px"
            }}
          />
          {hasContent ? (
            <Button
              onClick={handleSend}
              disabled={isBusy}
              size="icon"
              className={cn("flex-shrink-0", isBusy ? "" : "bg-green-600 text-white hover:bg-green-700")}
            >
              {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          ) : (
            <VoiceRecorder onSend={handleVoiceSend} disabled={isBusy} />
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
