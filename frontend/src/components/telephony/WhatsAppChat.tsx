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
      return <Clock className="h-3 w-3 text-gray-400" />
    case "Sent":
      return <Check className="h-3 w-3 text-gray-400" />
    case "Delivered":
      return <CheckCheck className="h-3 w-3 text-gray-400" />
    case "Read":
      return <CheckCheck className="h-3 w-3 text-blue-500" />
    case "Failed":
      return <AlertCircle className="h-3 w-3 text-red-400" />
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
    <div className="flex flex-col h-full border border-gray-200 rounded-lg bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-gray-50">
        <MessageCircle className="h-4 w-4 text-green-600" />
        <span className="text-sm font-medium text-gray-900">WhatsApp</span>
        <span className="text-xs text-gray-500">{phoneNumber}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[400px] bg-gray-50/50">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">
              Loading messages...
            </span>
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-8">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="ml-2 text-sm text-red-500">
              Failed to load messages
            </span>
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Inbox className="h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No messages yet</p>
            <p className="text-xs text-gray-400">
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
                        ? "bg-green-100 text-gray-900 rounded-br-sm"
                        : "bg-white text-gray-900 border border-gray-200 rounded-bl-sm"
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
                      <span className="text-[10px] text-gray-500">
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
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-3">
        {sendMessage.isError && (
          <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
            {sendMessage.error instanceof Error
              ? sendMessage.error.message
              : "Failed to send message"}
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 max-h-24"
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
          <button
            onClick={handleSend}
            disabled={!input.trim() || sendMessage.isPending}
            className={cn(
              "p-2 rounded-md transition-colors flex-shrink-0",
              !input.trim() || sendMessage.isPending
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            )}
          >
            {sendMessage.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
