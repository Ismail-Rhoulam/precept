"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  Mail,
  Send,
  Loader2,
  Check,
  AlertCircle,
  Clock,
  Inbox,
  Search,
  ArrowLeft,
  Paperclip,
  X,
  ChevronDown,
  RefreshCw,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useEmailAccounts,
  useEmailThreads,
  useThreadMessages,
  useComposeEmail,
  useTriggerEmailSync,
} from "@/hooks/useIntegrations"
import type { EmailMessage, EmailThread, EmailAccount } from "@/types/integration"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useQueryClient } from "@tanstack/react-query"

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

function EmailStatusIcon({ status }: { status: EmailMessage["status"] }) {
  switch (status) {
    case "Queued":
      return <Clock className="size-3 text-muted-foreground/70" />
    case "Sending":
      return <Loader2 className="size-3 animate-spin text-muted-foreground/70" />
    case "Sent":
      return <Check className="size-3 text-blue-500" />
    case "Failed":
      return <AlertCircle className="size-3 text-destructive" />
    default:
      return null
  }
}

/* -- Helpers ------------------------------------------------------------- */

function getInitials(name: string): string {
  return name
    .split(/[\s@]+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function stripHtml(html: string): string {
  if (!html) return ""
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim()
}

/* -- Account selector ---------------------------------------------------- */

function AccountSelector({
  accounts,
  selectedId,
  onSelect,
}: {
  accounts: EmailAccount[]
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
    ? selected.display_name || selected.email_address
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
                  a.enabled ? "bg-blue-500" : "bg-muted-foreground/30"
                )}
              />
              <span className="truncate">
                {a.display_name || a.email_address}
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

/* -- Thread list --------------------------------------------------------- */

function ThreadList({
  threads,
  isLoading,
  selected,
  onSelect,
  searchQuery,
  onSearchChange,
}: {
  threads: EmailThread[]
  isLoading: boolean
  selected: string | null
  onSelect: (threadId: string) => void
  searchQuery: string
  onSearchChange: (q: string) => void
}) {
  const filtered = threads.filter(
    (t) =>
      (t.subject && t.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.participants.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.entity_name && t.entity_name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="flex flex-col h-full">
      <div className="p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 bg-muted/50 border-0 focus-visible:ring-1 text-sm"
          />
        </div>
      </div>

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
              No email threads
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Emails will appear here
            </p>
          </div>
        ) : (
          <div className="px-2">
            {filtered.map((thread) => {
              const isActive = selected === thread.thread_id
              const preview = thread.last_message
                ? stripHtml(thread.last_message.body_html || thread.last_message.body_text)
                : ""
              const isOutgoing = thread.last_message?.direction === "Outgoing"
              const displayName = thread.entity_name || thread.participants[0] || "Unknown"

              return (
                <button
                  key={thread.thread_id}
                  onClick={() => onSelect(thread.thread_id)}
                  data-active={isActive}
                  className={cn(
                    "group w-full flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors",
                    "hover:bg-accent/50",
                    "data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
                  )}
                >
                  <Avatar className="size-10 shrink-0">
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate">
                        {displayName}
                      </span>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {formatTime(thread.last_message_at)}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-foreground/80 truncate mt-0.5">
                      {thread.subject || "(no subject)"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {isOutgoing && (
                        <EmailStatusIcon status={thread.last_message.status} />
                      )}
                      <p className="text-xs text-muted-foreground truncate leading-relaxed">
                        {preview || "(empty)"}
                      </p>
                    </div>
                    {thread.email_account_name && (
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5 truncate">
                        via {thread.email_account_name}
                      </p>
                    )}
                  </div>
                  {thread.message_count > 1 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                      {thread.message_count}
                    </Badge>
                  )}
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

function EmailPanel({
  threadId,
  subject,
  participants,
  accountId,
  onBack,
}: {
  threadId: string
  subject?: string
  participants?: string[]
  accountId?: number
  onBack: () => void
}) {
  const { data, isLoading, isError } = useThreadMessages(threadId, accountId)
  const composeEmail = useComposeEmail()
  const queryClient = useQueryClient()

  const [showCompose, setShowCompose] = useState(false)
  const [to, setTo] = useState("")
  const [composeSubject, setComposeSubject] = useState("")
  const [body, setBody] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const messages = data?.results ?? []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (participants?.length) {
      setTo(participants[0])
    }
    if (subject) {
      setComposeSubject(subject.startsWith("Re:") ? subject : `Re: ${subject}`)
    }
  }, [participants, subject])

  async function handleSend() {
    if (!to.trim()) return
    try {
      await composeEmail.mutateAsync({
        to_emails: [to.trim()],
        subject: composeSubject,
        body_html: `<p>${body.replace(/\n/g, "<br>")}</p>`,
        body_text: body,
      })
      setBody("")
      setShowCompose(false)
      queryClient.invalidateQueries({
        queryKey: ["email-thread-messages", threadId, accountId],
      })
      queryClient.invalidateQueries({ queryKey: ["email-threads"] })
    } catch {
      // Error surfaced via mutation state
    }
  }

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
          <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
            {participants?.[0] ? getInitials(participants[0]) : "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate leading-none">
            {subject || "(no subject)"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {participants?.join(", ") || ""}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowCompose(!showCompose)}
          className="gap-1.5"
        >
          <Send className="size-3.5" />
          Reply
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 bg-muted/30">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Loading emails...</span>
            </div>
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-2">
              <AlertCircle className="size-5 text-destructive" />
              <span className="text-xs text-destructive">Failed to load emails</span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Mail className="size-8 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No messages</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, idx) => {
              const isOutgoing = msg.direction === "Outgoing"
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
                      "flex mb-1",
                      isOutgoing ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-3",
                        isOutgoing
                          ? "bg-blue-600 dark:bg-blue-700 text-white rounded-br-sm"
                          : "bg-background text-foreground border shadow-xs rounded-bl-sm"
                      )}
                    >
                      {/* From/To header */}
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={cn(
                            "text-[11px] font-medium",
                            isOutgoing ? "text-white/80" : "text-muted-foreground"
                          )}
                        >
                          {isOutgoing ? `To: ${msg.to_emails.join(", ")}` : `From: ${msg.from_email}`}
                        </span>
                      </div>
                      {/* Subject */}
                      {msg.subject && (
                        <p
                          className={cn(
                            "text-xs font-semibold mb-1",
                            isOutgoing ? "text-white/90" : "text-foreground/80"
                          )}
                        >
                          {msg.subject}
                        </p>
                      )}
                      {/* Body */}
                      <div
                        className={cn(
                          "text-[13px] leading-relaxed break-words",
                          isOutgoing ? "text-white" : "text-foreground"
                        )}
                        dangerouslySetInnerHTML={{
                          __html: msg.body_html || msg.body_text.replace(/\n/g, "<br>"),
                        }}
                      />
                      {/* Attachments */}
                      {msg.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {msg.attachments.map((att) => (
                            <div
                              key={att.id}
                              className={cn(
                                "flex items-center gap-2 text-[11px] px-2 py-1 rounded",
                                isOutgoing ? "bg-blue-500/30" : "bg-muted"
                              )}
                            >
                              <Paperclip className="size-3 shrink-0" />
                              <span className="truncate">{att.filename}</span>
                              <span className="shrink-0">
                                {(att.file_size / 1024).toFixed(0)} KB
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Footer */}
                      <div
                        className={cn(
                          "flex items-center gap-1 mt-1.5",
                          isOutgoing ? "justify-end" : "justify-start"
                        )}
                      >
                        <span
                          className={cn(
                            "text-[10px]",
                            isOutgoing ? "text-white/60" : "text-muted-foreground"
                          )}
                        >
                          {formatTime(msg.created_at)}
                        </span>
                        {isOutgoing && <EmailStatusIcon status={msg.status} />}
                      </div>
                      {/* Error */}
                      {msg.error_message && (
                        <p className="text-[10px] text-red-300 mt-1">
                          {msg.error_message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Compose area */}
      {showCompose && (
        <div className="border-t bg-background px-4 py-3 space-y-2">
          {composeEmail.isError && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 text-destructive rounded-lg text-xs">
              <AlertCircle className="size-3.5 shrink-0" />
              <span className="truncate">
                {composeEmail.error instanceof Error
                  ? composeEmail.error.message
                  : "Failed to send email"}
              </span>
            </div>
          )}
          <Input
            placeholder="To"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-8 text-sm"
          />
          <Input
            placeholder="Subject"
            value={composeSubject}
            onChange={(e) => setComposeSubject(e.target.value)}
            className="h-8 text-sm"
          />
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your email..."
            rows={4}
            className="text-sm resize-none"
          />
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCompose(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSend}
              disabled={composeEmail.isPending || !to.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
            >
              {composeEmail.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
              Send
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/* -- Compose dialog (new email) ------------------------------------------ */

function ComposeNewEmail({
  onClose,
  onSent,
}: {
  onClose: () => void
  onSent: () => void
}) {
  const composeEmail = useComposeEmail()
  const [to, setTo] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")

  async function handleSend() {
    if (!to.trim()) return
    try {
      await composeEmail.mutateAsync({
        to_emails: to.split(",").map((e) => e.trim()).filter(Boolean),
        subject,
        body_html: `<p>${body.replace(/\n/g, "<br>")}</p>`,
        body_text: body,
      })
      onSent()
    } catch {
      // Error surfaced via mutation state
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-sm font-semibold">New Email</h3>
          <Button variant="ghost" size="icon" className="size-7" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
        <div className="p-4 space-y-3">
          {composeEmail.isError && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 text-destructive rounded-lg text-xs">
              <AlertCircle className="size-3.5 shrink-0" />
              <span>
                {composeEmail.error instanceof Error
                  ? composeEmail.error.message
                  : "Failed to send"}
              </span>
            </div>
          )}
          <Input
            placeholder="To (comma-separated)"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="text-sm"
          />
          <Input
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="text-sm"
          />
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your email..."
            rows={8}
            className="text-sm resize-none"
          />
        </div>
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={composeEmail.isPending || !to.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
          >
            {composeEmail.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}

/* -- Main page ----------------------------------------------------------- */

export default function EmailPage() {
  const { data: accounts, isLoading: settingsLoading } = useEmailAccounts()
  const [selectedAccountId, setSelectedAccountId] = useState<number | undefined>(undefined)
  const { data: threadsData, isLoading: threadsLoading } = useEmailThreads(selectedAccountId)
  const triggerSync = useTriggerEmailSync()
  const queryClient = useQueryClient()

  const [selectedThread, setSelectedThread] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showCompose, setShowCompose] = useState(false)

  const enabledAccounts = (accounts ?? []).filter((a) => a.enabled)
  const threads = threadsData?.results ?? []
  const selectedThreadData = threads.find((t) => t.thread_id === selectedThread)

  const handleSync = useCallback(() => {
    const accts = enabledAccounts.filter((a) => a.enable_incoming)
    accts.forEach((a) => triggerSync.mutate(a.id))
  }, [enabledAccounts, triggerSync])

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
            <Mail className="size-8 text-muted-foreground/40" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Email not configured</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Enable email integration in Settings to start sending and receiving emails.
            </p>
          </div>
          <Button asChild>
            <a href="/settings/integrations/email">Go to Settings</a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100svh-4rem)] flex">
      {/* Sidebar: thread list */}
      <div
        className={cn(
          "w-full md:w-[340px] lg:w-[380px] shrink-0 border-r flex flex-col bg-background",
          selectedThread ? "hidden md:flex" : "flex"
        )}
      >
        <div className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
          <Mail className="size-5 text-blue-600" />
          <h1 className="text-base font-semibold">Email</h1>
          <div className="ml-auto flex items-center gap-2">
            <AccountSelector
              accounts={enabledAccounts}
              selectedId={selectedAccountId}
              onSelect={(id) => {
                setSelectedAccountId(id)
                setSelectedThread(null)
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={handleSync}
              disabled={triggerSync.isPending}
              title="Sync inbox"
            >
              <RefreshCw className={cn("size-4", triggerSync.isPending && "animate-spin")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setShowCompose(true)}
              title="Compose"
            >
              <Plus className="size-4" />
            </Button>
            <Badge variant="secondary" className="text-xs tabular-nums">
              {threads.length}
            </Badge>
          </div>
        </div>

        <ThreadList
          threads={threads}
          isLoading={threadsLoading}
          selected={selectedThread}
          onSelect={setSelectedThread}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Main: email panel */}
      <div
        className={cn(
          "flex-1 flex flex-col bg-background",
          !selectedThread ? "hidden md:flex" : "flex"
        )}
      >
        {selectedThread ? (
          <EmailPanel
            threadId={selectedThread}
            subject={selectedThreadData?.subject}
            participants={selectedThreadData?.participants}
            accountId={selectedAccountId ?? selectedThreadData?.email_account_id ?? undefined}
            onBack={() => setSelectedThread(null)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="size-20 rounded-full bg-muted flex items-center justify-center mb-5">
              <Mail className="size-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              Welcome to Email
            </h3>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-xs">
              Select a thread from the sidebar or compose a new email
            </p>
          </div>
        )}
      </div>

      {/* Compose modal */}
      {showCompose && (
        <ComposeNewEmail
          onClose={() => setShowCompose(false)}
          onSent={() => {
            setShowCompose(false)
            queryClient.invalidateQueries({ queryKey: ["email-threads"] })
          }}
        />
      )}
    </div>
  )
}
