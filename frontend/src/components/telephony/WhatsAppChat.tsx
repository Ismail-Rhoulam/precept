"use client"

import { useState, useRef, useEffect } from "react"
import {
  MessageCircle,
  Send,
  Loader2,
  Check,
  CheckCheck,
  AlertCircle,
  Clock,
  Inbox,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useWhatsAppMessages,
  useSendWhatsAppMessage,
} from "@/hooks/useIntegrations"
import type { WhatsAppMessage } from "@/types/integration"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface WhatsAppChatProps {
  entityType: "lead" | "deal"
  entityId: number
  phoneNumber: string
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

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

export default function WhatsAppChat({
  entityType,
  entityId,
  phoneNumber,
}: WhatsAppChatProps) {
  const {
    data: messages,
    isLoading,
    isError,
  } = useWhatsAppMessages(entityType, entityId)
  const sendMessage = useSendWhatsAppMessage()

  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleSend() {
    if (!input.trim()) return
    const content = input.trim()
    setInput("")

    try {
      await sendMessage.mutateAsync({
        to_number: phoneNumber,
        content,
        entity_type: entityType,
        entity_id: entityId,
      })
    } catch {
      // Error surfaced via mutation state
      setInput(content)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

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
            <span className="ml-2 text-sm text-muted-foreground">
              Loading messages...
            </span>
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-8">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <span className="ml-2 text-sm text-destructive">
              Failed to load messages
            </span>
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Inbox className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground/60">
              Send a message to start the conversation
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isOutgoing = msg.message_type === "Outgoing"

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
                      "max-w-[75%] rounded-lg px-3 py-2 shadow-sm",
                      isOutgoing
                        ? "bg-green-100 text-foreground rounded-br-sm"
                        : "bg-background text-foreground border border-border rounded-bl-sm"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                    {msg.media_url && (
                      <a
                        href={msg.media_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline mt-1 block"
                      >
                        View attachment
                      </a>
                    )}
                    <div
                      className={cn(
                        "flex items-center gap-1 mt-1",
                        isOutgoing ? "justify-end" : "justify-start"
                      )}
                    >
                      <span className="text-[10px] text-muted-foreground">
                        {formatTime(msg.created_at)}
                      </span>
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
              {sendMessage.error instanceof Error
                ? sendMessage.error.message
                : "Failed to send message"}
            </AlertDescription>
          </Alert>
        )}
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none max-h-24 min-h-[38px]"
            style={{
              height: "auto",
              minHeight: "38px",
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = "auto"
              target.style.height = Math.min(target.scrollHeight, 96) + "px"
            }}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sendMessage.isPending}
            size="icon"
            className={cn(
              "flex-shrink-0",
              !input.trim() || sendMessage.isPending
                ? ""
                : "bg-green-600 text-white hover:bg-green-700"
            )}
          >
            {sendMessage.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
