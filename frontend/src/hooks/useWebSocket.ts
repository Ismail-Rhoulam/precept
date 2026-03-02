import { useEffect, useRef, useCallback } from "react"
import { useQueryClient, QueryClient } from "@tanstack/react-query"
import { getAccessToken } from "@/lib/api/client"
import { useAuthStore } from "@/stores/authStore"
import { useNotificationStore } from "@/stores/notificationStore"

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8001/ws/crm/"

const MAX_RECONNECT_DELAY = 30000
const INITIAL_RECONNECT_DELAY = 3000
const PING_INTERVAL = 30000

interface WebSocketMessage {
  type: string
  event?: string
  entity_type?: string
  entity_id?: number
  notification_id?: number
  notification_type?: string
  [key: string]: unknown
}

function handleCrmUpdate(data: WebSocketMessage, queryClient: QueryClient) {
  const { event, entity_type, entity_id } = data

  // Map entity_type to query key prefix
  const entityKeyMap: Record<string, string> = {
    lead: "leads",
    deal: "deals",
    contact: "contacts",
    organization: "organizations",
  }

  const queryKeyPrefix = entity_type ? entityKeyMap[entity_type] : undefined

  if (event?.endsWith("_created") || event?.endsWith("_deleted")) {
    // Invalidate list queries
    if (queryKeyPrefix) {
      queryClient.invalidateQueries({ queryKey: [queryKeyPrefix] })
    }
    // Also refresh dashboard
    queryClient.invalidateQueries({ queryKey: ["dashboard"] })
  }

  if (event?.endsWith("_updated")) {
    // Invalidate both list and detail queries
    if (queryKeyPrefix) {
      queryClient.invalidateQueries({ queryKey: [queryKeyPrefix] })
      if (entity_id) {
        queryClient.invalidateQueries({
          queryKey: [queryKeyPrefix, entity_id],
        })
      }
    }
    queryClient.invalidateQueries({ queryKey: ["dashboard"] })
  }

  if (event === "lead_converted") {
    queryClient.invalidateQueries({ queryKey: ["leads"] })
    queryClient.invalidateQueries({ queryKey: ["deals"] })
    if (entity_id) {
      queryClient.invalidateQueries({ queryKey: ["leads", entity_id] })
    }
    queryClient.invalidateQueries({ queryKey: ["dashboard"] })
  }

  if (event === "activity_updated") {
    // Invalidate activities for the specific entity
    if (entity_type && entity_id) {
      queryClient.invalidateQueries({
        queryKey: ["activities", entity_type, entity_id],
      })
      queryClient.invalidateQueries({
        queryKey: ["comments", entity_type, entity_id],
      })
    }
    // Also invalidate tasks and notes lists (may have changed)
    queryClient.invalidateQueries({ queryKey: ["tasks"] })
    queryClient.invalidateQueries({ queryKey: ["notes"] })
  }
}

function handleNotification(
  data: WebSocketMessage,
  queryClient: QueryClient,
  _setUnreadCount: (count: number) => void
) {
  // Invalidate notification queries to refresh the list
  queryClient.invalidateQueries({ queryKey: ["notifications"] })
  queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] })
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const pingIntervalRef = useRef<ReturnType<typeof setInterval>>()
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY)
  const queryClient = useQueryClient()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount)

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data)

        if (data.type === "pong") return // heartbeat response

        if (data.type === "crm_update") {
          handleCrmUpdate(data, queryClient)
        }

        if (data.type === "notification") {
          handleNotification(data, queryClient, setUnreadCount)
        }
      } catch (err) {
        console.error("[WS] Failed to parse message:", err)
      }
    },
    [queryClient, setUnreadCount]
  )

  const connect = useCallback(() => {
    const token = getAccessToken()
    if (!token) return

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close()
    }

    const ws = new WebSocket(`${WS_URL}?token=${token}`)
    wsRef.current = ws

    ws.onopen = () => {
      console.log("[WS] Connected")
      // Reset reconnect delay on successful connection
      reconnectDelayRef.current = INITIAL_RECONNECT_DELAY
      // Start ping interval (every 30s)
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }))
        }
      }, PING_INTERVAL)
    }

    ws.onmessage = handleMessage

    ws.onclose = (event) => {
      console.log("[WS] Disconnected", event.code)
      clearInterval(pingIntervalRef.current)
      // Auto-reconnect with exponential backoff (unless intentional close)
      if (event.code !== 1000) {
        const delay = reconnectDelayRef.current
        console.log(`[WS] Reconnecting in ${delay / 1000}s...`)
        reconnectTimeoutRef.current = setTimeout(connect, delay)
        // Exponential backoff: double the delay, cap at MAX_RECONNECT_DELAY
        reconnectDelayRef.current = Math.min(
          delay * 2,
          MAX_RECONNECT_DELAY
        )
      }
    }

    ws.onerror = (err) => {
      console.error("[WS] Error:", err)
    }
  }, [handleMessage])

  useEffect(() => {
    if (isAuthenticated) {
      connect()
    }

    return () => {
      clearInterval(pingIntervalRef.current)
      clearTimeout(reconnectTimeoutRef.current)
      if (wsRef.current) {
        wsRef.current.close(1000) // Normal closure
      }
    }
  }, [isAuthenticated, connect])

  return wsRef
}
