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
  Paperclip,
  X,
  Image as ImageIcon,
  Mic as MicIcon,
  FileText,
  Film,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useWhatsAppConversations,
  useConversationMessages,
  useSendWhatsAppMessage,
  useUploadWhatsAppMedia,
  useWhatsAppSettings,
} from "@/hooks/useIntegrations"
import type { WhatsAppMessage, WhatsAppConversation, WhatsAppSettings } from "@/types/integration"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useQueryClient } from "@tanstack/react-query"
import {
  ChatMediaRenderer,
  ChatEmojiPicker,
  StickerPanel,
  VoiceRecorder,
} from "@/components/chat"
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

/* -- Date helpers -------------------------------------------------------- */

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffDays > 6)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  if (diffDays > 0) return date.toLocaleDateString("en-US", { weekday: "short" })
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
}

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.floor(
    (today.getTime() - msgDay.getTime()) / 86400000
  )

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7)
    return date.toLocaleDateString("en-US", { weekday: "long" })
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: now.getFullYear() !== date.getFullYear() ? "numeric" : undefined,
  })
}

function isSameDay(a: string, b: string): boolean {
  const da = new Date(a)
  const db = new Date(b)
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  )
}

/* -- Status icon --------------------------------------------------------- */

function StatusIcon({ status }: { status: WhatsAppMessage["status"] }) {
  switch (status) {
    case "Pending":
      return <Clock className="size-3 text-muted-foreground/70" />
    case "Sent":
      return <Check className="size-3 text-muted-foreground/70" />
    case "Delivered":
      return <CheckCheck className="size-3 text-muted-foreground/70" />
    case "Read":
      return <CheckCheck className="size-3 text-blue-500" />
    case "Failed":
      return <AlertCircle className="size-3 text-destructive" />
    default:
      return null
  }
}

/* -- Helpers ------------------------------------------------------------- */

function mimeToContentType(mime: string): string {
  if (mime.startsWith("image/")) return "image"
  if (mime.startsWith("video/")) return "video"
  if (mime.startsWith("audio/")) return "audio"
  return "document"
}

function contentTypeIcon(ct: string) {
  switch (ct) {
    case "image":
      return <ImageIcon className="size-3.5 text-muted-foreground" />
    case "audio":
      return <MicIcon className="size-3.5 text-muted-foreground" />
    case "video":
      return <Film className="size-3.5 text-muted-foreground" />
    case "document":
      return <FileText className="size-3.5 text-muted-foreground" />
    case "sticker":
      return null
    default:
      return null
  }
}

function lastMessagePreview(msg: WhatsAppMessage): string {
  if (msg.content_type === "sticker")
    return msg.content && !msg.content.startsWith("[") ? `${msg.content} Sticker` : "Sticker"
  if (msg.content && msg.content_type === "text") return msg.content
  if (msg.content) return msg.content
  switch (msg.content_type) {
    case "image":
      return "Photo"
    case "audio":
      return "Voice message"
    case "video":
      return "Video"
    case "document":
      return "Document"
    default:
      return msg.content_type
  }
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

/* -- Account selector ---------------------------------------------------- */

function AccountSelector({
  accounts,
  selectedId,
  onSelect,
}: {
  accounts: WhatsAppSettings[]
  selectedId: number | undefined
  onSelect: (id: number | undefined) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selected = accounts.find((a) => a.id === selectedId)
  const label = selected
    ? selected.display_name || selected.phone_number_id
    : "All Accounts"

  if (accounts.length <= 1) return null

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-accent/50"
      >
        <span className="truncate max-w-[140px]">{label}</span>
        <ChevronDown className="size-3 shrink-0" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-popover border rounded-lg shadow-lg py-1 min-w-[180px]">
          <button
            onClick={() => {
              onSelect(undefined)
              setOpen(false)
            }}
            className={cn(
              "w-full text-left px-3 py-1.5 text-sm hover:bg-accent/50 transition-colors",
              !selectedId && "bg-accent text-accent-foreground"
            )}
          >
            All Accounts
          </button>
          {accounts.map((a) => (
            <button
              key={a.id}
              onClick={() => {
                onSelect(a.id)
                setOpen(false)
              }}
              className={cn(
                "w-full text-left px-3 py-1.5 text-sm hover:bg-accent/50 transition-colors flex items-center gap-2",
                selectedId === a.id && "bg-accent text-accent-foreground"
              )}
            >
              <div
                className={cn(
                  "size-1.5 rounded-full shrink-0",
                  a.enabled ? "bg-green-500" : "bg-muted-foreground/30"
                )}
              />
              <span className="truncate">
                {a.display_name || a.phone_number_id}
              </span>
              {a.is_default && (
                <Badge variant="secondary" className="text-[9px] px-1 py-0 ml-auto">
                  Default
                </Badge>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* -- Conversation list --------------------------------------------------- */

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
      (c.entity_name &&
        c.entity_name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 bg-muted/50 border-0 focus-visible:ring-1 text-sm"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="px-3 space-y-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg p-2.5">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-44" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Inbox className="size-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              No conversations
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Messages will appear here
            </p>
          </div>
        ) : (
          <div className="px-2">
            {filtered.map((conv) => {
              const isActive = selected === conv.phone_number
              return (
                <button
                  key={conv.phone_number}
                  onClick={() => onSelect(conv.phone_number)}
                  data-active={isActive}
                  className={cn(
                    "group w-full flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors",
                    "hover:bg-accent/50",
                    "data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
                  )}
                >
                  <Avatar className="size-10 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                      {conv.entity_name
                        ? getInitials(conv.entity_name)
                        : conv.phone_number.slice(-2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate">
                        {conv.entity_name || conv.phone_number}
                      </span>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {formatTime(conv.last_message_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {conv.last_message.message_type === "Outgoing" && (
                        <StatusIcon status={conv.last_message.status} />
                      )}
                      {contentTypeIcon(conv.last_message.content_type)}
                      <p className="text-xs text-muted-foreground truncate leading-relaxed">
                        {lastMessagePreview(conv.last_message)}
                      </p>
                    </div>
                    {conv.whatsapp_account_name && (
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5 truncate">
                        via {conv.whatsapp_account_name}
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* -- Chat panel ---------------------------------------------------------- */

function ChatPanel({
  phoneNumber,
  entityName,
  accountId,
  onBack,
}: {
  phoneNumber: string
  entityName?: string
  accountId?: number
  onBack: () => void
}) {
  const { data, isLoading, isError } = useConversationMessages(phoneNumber, accountId)
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
        account_id: accountId,
      })
      queryClient.invalidateQueries({
        queryKey: ["whatsapp-conversation-messages", phoneNumber, accountId],
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
    const preview = file.type.startsWith("image/")
      ? URL.createObjectURL(file)
      : undefined
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
        })
        queryClient.invalidateQueries({
          queryKey: ["whatsapp-conversation-messages", phoneNumber, accountId],
        })
        queryClient.invalidateQueries({ queryKey: ["whatsapp-conversations"] })
      } catch {
        // Error surfaced via mutation state
      }
    },
    [phoneNumber, accountId, sendMessage, queryClient]
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
      })
      queryClient.invalidateQueries({
        queryKey: ["whatsapp-conversation-messages", phoneNumber, accountId],
      })
      queryClient.invalidateQueries({ queryKey: ["whatsapp-conversations"] })
    },
    [phoneNumber, accountId, sendMessage, uploadMedia, queryClient]
  )

  const hasContent = input.trim() || attachment

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden size-8 rounded-full"
          onClick={onBack}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <Avatar className="size-9">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
            {entityName
              ? getInitials(entityName)
              : phoneNumber.slice(-2)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate leading-none">
            {entityName || phoneNumber}
          </p>
          {entityName && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {phoneNumber}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 bg-muted/30">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Loading messages...
              </span>
            </div>
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-2">
              <AlertCircle className="size-5 text-destructive" />
              <span className="text-xs text-destructive">
                Failed to load messages
              </span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageCircle className="size-8 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              No messages yet
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Send a message to start the conversation
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((msg, idx) => {
              const isOutgoing = msg.message_type === "Outgoing"
              const isSticker = msg.content_type === "sticker"
              const showDateSep =
                idx === 0 ||
                !isSameDay(messages[idx - 1].created_at, msg.created_at)

              return (
                <div key={msg.id}>
                  {showDateSep && (
                    <div className="flex items-center justify-center py-3">
                      <span className="text-[11px] font-medium text-muted-foreground bg-background/80 backdrop-blur px-3 py-1 rounded-full shadow-sm border">
                        {formatDateSeparator(msg.created_at)}
                      </span>
                    </div>
                  )}
                  <div
                    className={cn(
                      "flex mb-0.5",
                      isOutgoing ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] group relative",
                        isSticker
                          ? "px-1 py-1"
                          : cn(
                              "rounded-2xl px-3 py-1.5",
                              isOutgoing
                                ? "bg-emerald-600 dark:bg-emerald-700 text-white rounded-br-sm"
                                : "bg-background text-foreground border shadow-xs rounded-bl-sm"
                            )
                      )}
                    >
                      {isSticker ? (
                        <div className="flex flex-col items-center">
                          {msg.media_proxy_url ? (
                            <ChatMediaRenderer
                              msg={msg}
                              resolveUrl={resolveProxyUrl}
                            />
                          ) : (
                            <span className="text-5xl">
                              {msg.content &&
                              !msg.content.startsWith("[")
                                ? msg.content
                                : "\uD83C\uDFF7\uFE0F"}
                            </span>
                          )}
                        </div>
                      ) : (
                        <>
                          <ChatMediaRenderer
                            msg={msg}
                            resolveUrl={resolveProxyUrl}
                          />
                          {msg.content ? (
                            <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">
                              {msg.content}
                            </p>
                          ) : msg.content_type !== "text" &&
                            !msg.media_proxy_url ? (
                            <p
                              className={cn(
                                "text-[13px] italic",
                                isOutgoing
                                  ? "text-white/70"
                                  : "text-muted-foreground"
                              )}
                            >
                              {msg.content_type === "image"
                                ? "Photo"
                                : msg.content_type === "audio"
                                  ? "Voice message"
                                  : msg.content_type === "video"
                                    ? "Video"
                                    : msg.content_type === "document"
                                      ? "Document"
                                      : msg.content_type}
                            </p>
                          ) : null}
                        </>
                      )}
                      <div
                        className={cn(
                          "flex items-center gap-1 mt-0.5",
                          isOutgoing ? "justify-end" : "justify-start"
                        )}
                      >
                        <span
                          className={cn(
                            "text-[10px]",
                            isOutgoing
                              ? "text-white/60"
                              : "text-muted-foreground"
                          )}
                        >
                          {formatTime(msg.created_at)}
                        </span>
                        {isOutgoing && <StatusIcon status={msg.status} />}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t bg-background px-3 py-2 space-y-2">
        {sendMessage.isError && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 text-destructive rounded-lg text-xs">
            <AlertCircle className="size-3.5 shrink-0" />
            <span className="truncate">
              {sendMessage.error instanceof Error
                ? sendMessage.error.message
                : "Failed to send message"}
            </span>
          </div>
        )}
        {attachment && (
          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-xl text-xs">
            {attachment.preview ? (
              <img
                src={attachment.preview}
                alt=""
                className="size-10 rounded-lg object-cover"
              />
            ) : (
              <div className="size-10 rounded-lg bg-background flex items-center justify-center">
                <Paperclip className="size-4 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {attachment.file.name}
              </p>
              <p className="text-muted-foreground text-[11px]">
                {(attachment.file.size / 1024).toFixed(0)} KB
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 rounded-full shrink-0"
              onClick={() => setAttachment(null)}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        )}
        <div className="flex items-end gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.webp"
            onChange={handleFileSelect}
          />
          <div className="flex items-center">
            <ChatEmojiPicker
              onEmojiSelect={handleEmojiSelect}
              disabled={isBusy}
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-9 rounded-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
              title="Attach file"
            >
              <Paperclip className="size-4" />
            </Button>
            <StickerPanel
              messages={messages}
              onStickerSelect={handleStickerSelect}
              resolveUrl={resolveProxyUrl}
              disabled={isBusy}
            />
          </div>
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none max-h-24 min-h-[38px] rounded-2xl border-0 bg-muted/60 px-4 py-2 text-sm focus-visible:ring-1"
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
              className="size-9 shrink-0 rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {isBusy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          ) : (
            <VoiceRecorder onSend={handleVoiceSend} disabled={isBusy} />
          )}
        </div>
      </div>
    </div>
  )
}

/* -- Main page ----------------------------------------------------------- */

export default function WhatsAppPage() {
  const { data: accounts, isLoading: settingsLoading } = useWhatsAppSettings()
  const [selectedAccountId, setSelectedAccountId] = useState<number | undefined>(undefined)
  const { data: conversationsData, isLoading: convsLoading } =
    useWhatsAppConversations(selectedAccountId)
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const enabledAccounts = (accounts ?? []).filter((a) => a.enabled)
  const conversations = conversationsData?.results ?? []
  const selectedConv = conversations.find(
    (c) => c.phone_number === selectedPhone
  )

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100svh-4rem)]">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (enabledAccounts.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100svh-4rem)]">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <div className="size-16 rounded-full bg-muted flex items-center justify-center">
            <MessageCircle className="size-8 text-muted-foreground/40" />
          </div>
          <div>
            <h2 className="text-base font-semibold">
              WhatsApp not configured
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Enable WhatsApp integration in Settings to start messaging your
              contacts.
            </p>
          </div>
          <Button asChild>
            <a href="/settings/integrations/whatsapp">Go to Settings</a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100svh-4rem)] flex">
      {/* Sidebar: conversation list */}
      <div
        className={cn(
          "w-full md:w-[340px] lg:w-[380px] shrink-0 border-r flex flex-col bg-background",
          selectedPhone ? "hidden md:flex" : "flex"
        )}
      >
        {/* Sidebar header */}
        <div className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
          <MessageCircle className="size-5 text-primary" />
          <h1 className="text-base font-semibold">Messages</h1>
          <div className="ml-auto flex items-center gap-2">
            <AccountSelector
              accounts={enabledAccounts}
              selectedId={selectedAccountId}
              onSelect={(id) => {
                setSelectedAccountId(id)
                setSelectedPhone(null)
              }}
            />
            <Badge
              variant="secondary"
              className="text-xs tabular-nums"
            >
              {conversations.length}
            </Badge>
          </div>
        </div>

        <ConversationList
          conversations={conversations}
          isLoading={convsLoading}
          selected={selectedPhone}
          onSelect={setSelectedPhone}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Main: chat area */}
      <div
        className={cn(
          "flex-1 flex flex-col bg-background",
          !selectedPhone ? "hidden md:flex" : "flex"
        )}
      >
        {selectedPhone ? (
          <ChatPanel
            phoneNumber={selectedPhone}
            entityName={selectedConv?.entity_name || undefined}
            accountId={selectedAccountId ?? selectedConv?.whatsapp_account_id ?? undefined}
            onBack={() => setSelectedPhone(null)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="size-20 rounded-full bg-muted flex items-center justify-center mb-5">
              <MessageCircle className="size-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              Welcome to WhatsApp
            </h3>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-xs">
              Select a conversation from the sidebar to start messaging
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
