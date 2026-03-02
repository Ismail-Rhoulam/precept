"use client"

import { useState } from "react"
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Loader2,
  AlertCircle,
  Inbox,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { format } from "date-fns"
import { useCallLogs } from "@/hooks/useCallLogs"
import type { CallLog } from "@/types/call-log"
import { cn } from "@/lib/utils"

const statusColors: Record<string, string> = {
  Initiated: "bg-gray-100 text-gray-700",
  Ringing: "bg-yellow-100 text-yellow-800",
  "In Progress": "bg-blue-100 text-blue-800",
  Completed: "bg-green-100 text-green-800",
  Missed: "bg-red-100 text-red-800",
  Failed: "bg-red-100 text-red-600",
}

const typeColors: Record<string, string> = {
  Incoming: "bg-green-100 text-green-800",
  Outgoing: "bg-blue-100 text-blue-800",
}

export default function CallLogsPage() {
  const [page, setPage] = useState(1)
  const pageSize = 20

  const { data, isLoading, isError, error } = useCallLogs({
    page,
    page_size: pageSize,
  })

  const callLogs: CallLog[] = Array.isArray(data) ? data : data?.results || []

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Phone className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Call Logs</h1>
          <p className="text-sm text-gray-500">Phone activity and call history</p>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 shadow-sm text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading call logs...</p>
        </div>
      ) : isError ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 shadow-sm text-center">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900 mb-1">
            Failed to load call logs
          </p>
          <p className="text-sm text-red-600">
            {error instanceof Error ? error.message : "An error occurred"}
          </p>
        </div>
      ) : callLogs.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 shadow-sm text-center">
          <Inbox className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No call logs yet</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Call ID
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Caller
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receiver
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Medium
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {callLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-gray-700">
                        {log.call_id}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-gray-900">
                          {log.caller_name || log.caller_number}
                        </p>
                        {log.caller_name && (
                          <p className="text-xs text-gray-500">
                            {log.caller_number}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-gray-900">
                          {log.receiver_name || log.receiver_number}
                        </p>
                        {log.receiver_name && (
                          <p className="text-xs text-gray-500">
                            {log.receiver_number}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                          typeColors[log.call_type] || "bg-gray-100 text-gray-700"
                        )}
                      >
                        {log.call_type === "Incoming" ? (
                          <PhoneIncoming className="h-3 w-3" />
                        ) : (
                          <PhoneOutgoing className="h-3 w-3" />
                        )}
                        {log.call_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                          statusColors[log.status] || "bg-gray-100 text-gray-700"
                        )}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">
                        {log.duration || "--"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">
                        {log.telephony_medium || "--"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-500">
                        {format(new Date(log.created_at), "MMM d, yyyy h:mm a")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {callLogs.length > 0 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500">
            Page {page}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className={cn(
                "inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md border transition-colors",
                page <= 1
                  ? "border-gray-200 text-gray-300 cursor-not-allowed"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              )}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={callLogs.length < pageSize}
              className={cn(
                "inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md border transition-colors",
                callLogs.length < pageSize
                  ? "border-gray-200 text-gray-300 cursor-not-allowed"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              )}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
