"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import {
  Mail,
  Send,
  Loader2,
  AlertCircle,
  Inbox,
  Paperclip,
  X,
  Reply,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api/client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EmailAttachment {
  id: number
  filename: string
  mime_type: string
  file_size: number
}

interface EmailMessage {
  id: number
  direction: "Incoming" | "Outgoing"
  status: "Draft" | "Queued" | "Sending" | "Sent" | "Failed" | "Received"
  from_email: string
  to_emails: string[]
  cc_emails: string[]
  bcc_emails: string[]
  subject: string
  body_html: string
  body_text: string
  email_account_id: number | null
  entity_type: string | null
  entity_id: number | null
  attachments: EmailAttachment[]
  error_message: string
  created_at: string
  updated_at: string
}

interface EmailMessagesResponse {
  results: EmailMessage[]
  total: number
  page: number
  page_size: number
}

interface ComposePayload {
  to_emails: string[]
  subject: string
  body_html: string
  entity_type: string
  entity_id: number
  account_id?: number
}

interface UploadAttachmentResponse {
  id: number
  filename: string
  mime_type: string
  file_size: number
}

interface EmailChatProps {
  entityType: "lead" | "deal"
  entityId: number
  emailAddress?: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLLAPSED_LIMIT = 3

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getInitials(email: string): string {
  const local = email.split("@")[0] || ""
  return local.slice(0, 2).toUpperCase()
}

function StatusBadge({ status }: { status: EmailMessage["status"] }) {
  const variants: Record<
    EmailMessage["status"],
    { label: string; className: string }
  > = {
    Draft: { label: "Draft", className: "bg-gray-100 text-gray-700" },
    Queued: { label: "Queued", className: "bg-yellow-100 text-yellow-700" },
    Sending: { label: "Sending", className: "bg-blue-100 text-blue-700" },
    Sent: { label: "Sent", className: "bg-green-100 text-green-700" },
    Failed: { label: "Failed", className: "bg-red-100 text-red-700" },
    Received: { label: "Received", className: "bg-blue-100 text-blue-700" },
  }

  const v = variants[status] ?? variants.Draft
  return (
    <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", v.className)}>
      {v.label}
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// Sanitize HTML for rendering email bodies safely
// ---------------------------------------------------------------------------

function sanitizeHtml(html: string): string {
  // Strip <script>, <style>, on* attributes for basic XSS protection.
  // For production, consider a library like DOMPurify.
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\bon\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\bon\w+\s*=\s*'[^']*'/gi, "")
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EmailChat({
  entityType,
  entityId,
  emailAddress,
}: EmailChatProps) {
  const queryClient = useQueryClient()

  // ---- State ----
  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [composeTo, setComposeTo] = useState(emailAddress ?? "")
  const [composeSubject, setComposeSubject] = useState("")
  const [composeBody, setComposeBody] = useState("")
  const [composeAttachments, setComposeAttachments] = useState<File[]>([])
  const [expandedMessageIds, setExpandedMessageIds] = useState<Set<number>>(
    new Set()
  )

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ---- Queries ----
  const queryKey = ["email-messages", entityType, entityId]

  const {
    data: messagesData,
    isLoading,
    isError,
  } = useQuery<EmailMessagesResponse>({
    queryKey,
    queryFn: () =>
      api.get<EmailMessagesResponse>(
        `/integrations/email/messages/${entityType}/${entityId}`
      ),
    refetchInterval: 30_000,
  })

  const messages = useMemo(() => {
    if (!messagesData?.results) return []
    // Sort chronologically (oldest first)
    return [...messagesData.results].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  }, [messagesData])

  // ---- Mutations ----
  const sendEmail = useMutation({
    mutationFn: async (payload: ComposePayload) => {
      // Upload attachments first, then send
      const uploadedIds: number[] = []

      for (const file of composeAttachments) {
        const formData = new FormData()
        formData.append("file", file)
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("access_token")
            : null
        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
        const resp = await fetch(
          `${baseUrl}/integrations/email/upload-attachment`,
          {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
          }
        )
        if (!resp.ok) {
          const err = await resp
            .json()
            .catch(() => ({ detail: "Attachment upload failed" }))
          throw new Error(err.detail || "Attachment upload failed")
        }
        const result: UploadAttachmentResponse = await resp.json()
        uploadedIds.push(result.id)
      }

      const body: Record<string, unknown> = { ...payload }
      if (uploadedIds.length > 0) {
        body.attachment_ids = uploadedIds
      }

      return api.post<EmailMessage>("/integrations/email/compose", body)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      resetCompose()
    },
  })

  // ---- Effects ----
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages.length])

  // Keep composeTo in sync if emailAddress prop changes
  useEffect(() => {
    if (emailAddress && !composeTo) {
      setComposeTo(emailAddress)
    }
  }, [emailAddress]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Handlers ----
  function resetCompose() {
    setIsComposeOpen(false)
    setComposeTo(emailAddress ?? "")
    setComposeSubject("")
    setComposeBody("")
    setComposeAttachments([])
  }

  function handleSend() {
    const toList = composeTo
      .split(/[,;]/)
      .map((e) => e.trim())
      .filter(Boolean)

    if (toList.length === 0 || !composeSubject.trim()) return

    sendEmail.mutate({
      to_emails: toList,
      subject: composeSubject.trim(),
      body_html: composeBody.trim() || `<p>${composeBody.trim()}</p>`,
      entity_type: entityType,
      entity_id: entityId,
    })
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    setComposeAttachments((prev) => [...prev, ...Array.from(files)])
    e.target.value = ""
  }

  function removeAttachment(index: number) {
    setComposeAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  function toggleMessageExpanded(id: number) {
    setExpandedMessageIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function handleReply(msg: EmailMessage) {
    setIsComposeOpen(true)
    setComposeTo(msg.direction === "Incoming" ? msg.from_email : msg.to_emails.join(", "))
    setComposeSubject(
      msg.subject.startsWith("Re:") ? msg.subject : `Re: ${msg.subject}`
    )
    setComposeBody("")
  }

  // ---- Derived ----
  const hiddenCount = messages.length - COLLAPSED_LIMIT
  const visibleMessages =
    isExpanded || messages.length <= COLLAPSED_LIMIT
      ? messages
      : messages.slice(-COLLAPSED_LIMIT)

  const isBusy = sendEmail.isPending

  // ---- Render ----
  return (
    <Card className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-3 bg-muted/50">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="bg-blue-100">
              <Mail className="h-3 w-3 text-blue-600" />
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-foreground">Email</span>
          {emailAddress && (
            <span className="text-xs text-muted-foreground">
              {emailAddress}
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => setIsComposeOpen((prev) => !prev)}
        >
          <Mail className="h-3 w-3 mr-1" />
          Compose
        </Button>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[400px] bg-muted/20">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading emails...
            </span>
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-8">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <span className="ml-2 text-sm text-destructive">
              Failed to load emails
            </span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Inbox className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No emails yet</p>
            <p className="text-xs text-muted-foreground/60">
              Send an email to start the conversation
            </p>
          </div>
        ) : (
          <>
            {/* Show more button */}
            {!isExpanded && hiddenCount > 0 && (
              <button
                onClick={() => setIsExpanded(true)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mx-auto py-1"
              >
                <ChevronUp className="h-3 w-3" />
                Show {hiddenCount} more email{hiddenCount > 1 ? "s" : ""}
              </button>
            )}

            {isExpanded && hiddenCount > 0 && (
              <button
                onClick={() => setIsExpanded(false)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mx-auto py-1"
              >
                <ChevronDown className="h-3 w-3" />
                Show fewer
              </button>
            )}

            {visibleMessages.map((msg) => {
              const isOutgoing = msg.direction === "Outgoing"
              const isBodyExpanded = expandedMessageIds.has(msg.id)
              const bodyContent = msg.body_html || msg.body_text || ""
              const hasLongBody = bodyContent.length > 300

              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    isOutgoing ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg shadow-sm px-3 py-2",
                      isOutgoing
                        ? "bg-blue-50 text-foreground rounded-br-sm"
                        : "bg-background text-foreground border border-border rounded-bl-sm"
                    )}
                  >
                    {/* From / To */}
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback
                          className={cn(
                            "text-[9px]",
                            isOutgoing ? "bg-blue-200" : "bg-gray-200"
                          )}
                        >
                          {getInitials(
                            isOutgoing
                              ? msg.from_email
                              : msg.from_email
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium truncate">
                        {msg.from_email}
                      </span>
                      {isOutgoing && <StatusBadge status={msg.status} />}
                    </div>

                    {/* To line */}
                    <div className="text-[11px] text-muted-foreground mb-1 truncate">
                      To: {msg.to_emails.join(", ")}
                      {msg.cc_emails.length > 0 && (
                        <span> | CC: {msg.cc_emails.join(", ")}</span>
                      )}
                    </div>

                    {/* Subject */}
                    {msg.subject && (
                      <div className="text-xs font-semibold mb-1 truncate">
                        {msg.subject}
                      </div>
                    )}

                    {/* Body */}
                    {bodyContent && (
                      <div className="relative">
                        {msg.body_html ? (
                          <div
                            className={cn(
                              "text-sm prose prose-sm max-w-none break-words",
                              !isBodyExpanded && hasLongBody && "max-h-[120px] overflow-hidden"
                            )}
                            dangerouslySetInnerHTML={{
                              __html: sanitizeHtml(
                                isBodyExpanded || !hasLongBody
                                  ? msg.body_html
                                  : msg.body_html.slice(0, 300)
                              ),
                            }}
                          />
                        ) : (
                          <p
                            className={cn(
                              "text-sm whitespace-pre-wrap break-words",
                              !isBodyExpanded && hasLongBody && "max-h-[120px] overflow-hidden"
                            )}
                          >
                            {isBodyExpanded || !hasLongBody
                              ? msg.body_text
                              : msg.body_text.slice(0, 300) + "..."}
                          </p>
                        )}

                        {hasLongBody && !isBodyExpanded && (
                          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-blue-50/80 to-transparent pointer-events-none" />
                        )}

                        {hasLongBody && (
                          <button
                            onClick={() => toggleMessageExpanded(msg.id)}
                            className="text-xs text-blue-600 hover:text-blue-700 mt-1"
                          >
                            {isBodyExpanded ? "Show less" : "Show more"}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Attachments */}
                    {msg.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {msg.attachments.map((att) => (
                          <div
                            key={att.id}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1"
                          >
                            <Paperclip className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{att.filename}</span>
                            <span className="flex-shrink-0">
                              ({formatFileSize(att.file_size)})
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Error message for failed emails */}
                    {msg.status === "Failed" && msg.error_message && (
                      <div className="mt-1 text-[11px] text-red-600">
                        {msg.error_message}
                      </div>
                    )}

                    {/* Footer: timestamp + reply */}
                    <div
                      className={cn(
                        "flex items-center gap-2 mt-1.5",
                        isOutgoing ? "justify-end" : "justify-between"
                      )}
                    >
                      <span className="text-[10px] text-muted-foreground">
                        {formatTime(msg.created_at)}
                      </span>
                      <button
                        onClick={() => handleReply(msg)}
                        className="flex items-center gap-0.5 text-[10px] text-blue-600 hover:text-blue-700"
                      >
                        <Reply className="h-3 w-3" />
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </CardContent>

      {/* Compose Form */}
      {isComposeOpen && (
        <CardFooter className="flex-col items-stretch p-3 gap-2 border-t">
          {sendEmail.isError && (
            <Alert variant="destructive" className="py-2">
              <AlertDescription className="text-xs">
                {sendEmail.error instanceof Error
                  ? sendEmail.error.message
                  : "Failed to send email"}
              </AlertDescription>
            </Alert>
          )}

          {/* To */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              To
            </label>
            <Input
              value={composeTo}
              onChange={(e) => setComposeTo(e.target.value)}
              placeholder="recipient@example.com"
              className="text-sm h-8"
              disabled={isBusy}
            />
          </div>

          {/* Subject */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Subject
            </label>
            <Input
              value={composeSubject}
              onChange={(e) => setComposeSubject(e.target.value)}
              placeholder="Email subject"
              className="text-sm h-8"
              disabled={isBusy}
            />
          </div>

          {/* Body */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Body
            </label>
            <Textarea
              value={composeBody}
              onChange={(e) => setComposeBody(e.target.value)}
              placeholder="Write your email..."
              rows={4}
              className="text-sm resize-none"
              disabled={isBusy}
            />
          </div>

          {/* Attachments */}
          {composeAttachments.length > 0 && (
            <div className="space-y-1">
              {composeAttachments.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-2 px-2 py-1 bg-muted rounded text-xs"
                >
                  <Paperclip className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="truncate flex-1">{file.name}</span>
                  <span className="flex-shrink-0 text-muted-foreground">
                    {formatFileSize(file.size)}
                  </span>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="text-muted-foreground hover:text-foreground"
                    disabled={isBusy}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.csv,.png,.jpg,.jpeg,.gif,.webp"
              onChange={handleFileSelect}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={resetCompose}
              disabled={isBusy}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={
                isBusy || !composeTo.trim() || !composeSubject.trim()
              }
              size="sm"
              className={cn(
                "text-xs",
                isBusy ? "" : "bg-blue-600 text-white hover:bg-blue-700"
              )}
            >
              {isBusy ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Send className="h-3 w-3 mr-1" />
              )}
              Send
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
