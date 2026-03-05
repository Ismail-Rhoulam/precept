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
  Search,
  ArrowLeft,
  User,
  Paperclip,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useWhatsAppConversations,
  useConversationMessages,
  useSendWhatsAppMessage,
  useUploadWhatsAppMedia,
  useWhatsAppSettings,
} from "@/hooks/useIntegrations"
import type { WhatsAppMessage, WhatsAppConversation } from "@/types/integration"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useQueryClient } from "@tanstack/react-query"
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

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffDays > 6) return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  if (diffDays > 0) return date.toLocaleDateString("en-US", { weekday: "short" })
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
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

function ConversationList({
  conversations,
  isLoading,
  selected,
  onSelect,
  searchQuery,
  onSearchChange,
}: {
  conversations: WhatsAppConversation[]
  isLoading: boolean
  selected: string | null
  onSelect: (phone: string) => void
  searchQuery: string
  onSearchChange: (q: string) => void
}) {
  const filtered = conversations.filter(
    (c) =>
      c.phone_number.includes(searchQuery) ||
      (c.entity_name && c.entity_name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-3 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <Inbox className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No conversations yet</p>
          </div>
        ) : (
          filtered.map((conv) => (
            <button
              key={conv.phone_number}
              onClick={() => onSelect(conv.phone_number)}
              className={cn(
                "w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left border-b",
                selected === conv.phone_number && "bg-muted"
              )}
            >
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarFallback className="bg-green-100">
                  <User className="h-5 w-5 text-green-600" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">
                    {conv.entity_name || conv.phone_number}
                  </span>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">
                    {formatTime(conv.last_message_at)}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  {conv.last_message.message_type === "Outgoing" && (
                    <StatusIcon status={conv.last_message.status} />
                  )}
                  <p className="text-xs text-muted-foreground truncate">
                    {conv.last_message.content_type === "sticker"
                      ? `${conv.last_message.content && !conv.last_message.content.startsWith("[") ? conv.last_message.content : "\uD83C\uDFF7\uFE0F"} Sticker`
                      : conv.last_message.content_type === "image"
                        ? `\uD83D\uDCF7 ${conv.last_message.content || "Photo"}`
                        : conv.last_message.content_type === "audio"
                          ? "\uD83C\uDFB5 Audio message"
                          : conv.last_message.content_type === "video"
                            ? `\uD83C\uDFA5 ${conv.last_message.content || "Video"}`
                            : conv.last_message.content_type === "document"
                              ? `\uD83D\uDCC4 ${conv.last_message.content || "Document"}`
                              : conv.last_message.content || conv.last_message.content_type}
                  </p>
                </div>
                {conv.entity_name && (
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                    {conv.phone_number}
                  </p>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

function ChatPanel({
  phoneNumber,
  onBack,
}: {
  phoneNumber: string
  onBack: () => void
}) {
  const { data, isLoading, isError } = useConversationMessages(phoneNumber)
  const sendMessage = useSendWhatsAppMessage()
  const uploadMedia = useUploadWhatsAppMedia()
  const queryClient = useQueryClient()
  const [input, setInput] = useState("")
  const [attachment, setAttachment] = useState<{
    file: File
    preview?: string
  } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const messages = data?.results ?? []
  const isBusy = sendMessage.isPending || uploadMedia.isPending

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleSend() {
    if (!input.trim() && !attachment) return
    const content = input.trim()
    setInput("")

    try {
      let mediaUrl = ""
      let mimeType = ""
      let contentType = "text"

      if (attachment) {
        const uploaded = await uploadMedia.mutateAsync(attachment.file)
        mediaUrl = uploaded.media_url
        mimeType = uploaded.mime_type
        contentType = mimeToContentType(mimeType)
        setAttachment(null)
      }

      await sendMessage.mutateAsync({
        to_number: phoneNumber,
        content,
        content_type: contentType,
        media_url: mediaUrl,
        mime_type: mimeType,
      })
      queryClient.invalidateQueries({
        queryKey: ["whatsapp-conversation-messages", phoneNumber],
      })
      queryClient.invalidateQueries({ queryKey: ["whatsapp-conversations"] })
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
        })
        queryClient.invalidateQueries({
          queryKey: ["whatsapp-conversation-messages", phoneNumber],
        })
        queryClient.invalidateQueries({ queryKey: ["whatsapp-conversations"] })
      } catch {
        // Error surfaced via mutation state
      }
    },
    [phoneNumber, sendMessage, queryClient]
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
      })
      queryClient.invalidateQueries({
        queryKey: ["whatsapp-conversation-messages", phoneNumber],
      })
      queryClient.invalidateQueries({ queryKey: ["whatsapp-conversations"] })
    },
    [phoneNumber, sendMessage, uploadMedia, queryClient]
  )

  const hasContent = input.trim() || attachment

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/50">
        <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-green-100">
            <User className="h-4 w-4 text-green-600" />
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">{phoneNumber}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
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
        ) : messages.length === 0 ? (
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
                          <span className="text-5xl">
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
      </div>

      {/* Input */}
      <div className="p-3 border-t space-y-2">
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
            messages={messages}
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
      </div>
    </div>
  )
}

export default function WhatsAppPage() {
  const { data: settings, isLoading: settingsLoading } = useWhatsAppSettings()
  const { data: conversationsData, isLoading: convsLoading } = useWhatsAppConversations()
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const conversations = conversationsData?.results ?? []

  if (settingsLoading) {
    return (
      <div className="h-[calc(100vh-8rem)]">
        <Card className="h-full">
          <CardContent className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!settings?.enabled) {
    return (
      <div className="h-[calc(100vh-8rem)]">
        <Card className="h-full">
          <CardContent className="flex flex-col items-center justify-center h-full gap-4">
            <MessageCircle className="h-12 w-12 text-muted-foreground/30" />
            <div className="text-center">
              <h2 className="text-lg font-semibold">WhatsApp not configured</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Enable WhatsApp integration in Settings to start messaging.
              </p>
            </div>
            <Button asChild variant="outline">
              <a href="/settings/integrations/whatsapp">Go to Settings</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <Card className="h-full overflow-hidden">
        <div className="flex h-full">
          {/* Conversation list */}
          <div
            className={cn(
              "w-full md:w-80 md:border-r flex-shrink-0",
              selectedPhone ? "hidden md:flex md:flex-col" : "flex flex-col"
            )}
          >
            <CardHeader className="flex flex-row items-center gap-2 space-y-0 px-4 py-3 border-b">
              <MessageCircle className="h-5 w-5 text-green-600" />
              <h2 className="text-base font-semibold">WhatsApp</h2>
              <Badge variant="secondary" className="ml-auto">
                {conversations.length}
              </Badge>
            </CardHeader>
            <ConversationList
              conversations={conversations}
              isLoading={convsLoading}
              selected={selectedPhone}
              onSelect={setSelectedPhone}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>

          {/* Chat panel */}
          <div className={cn("flex-1 flex flex-col", !selectedPhone ? "hidden md:flex" : "flex")}>
            {selectedPhone ? (
              <ChatPanel phoneNumber={selectedPhone} onBack={() => setSelectedPhone(null)} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <MessageCircle className="h-16 w-16 text-muted-foreground/20 mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">Select a conversation</h3>
                <p className="text-sm text-muted-foreground/60 mt-1">
                  Choose a conversation from the list to start messaging
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
