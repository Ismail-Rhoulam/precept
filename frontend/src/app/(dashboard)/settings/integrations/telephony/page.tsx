"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Users,
  ArrowLeft,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  AlertCircle,
  Inbox,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useTelephonyAgents,
  useCreateAgent,
  useUpdateAgent,
  useDeleteAgent,
} from "@/hooks/useIntegrations"
import type { TelephonyAgent } from "@/types/integration"

interface AgentFormData {
  user_email: string
  user_name: string
  mobile_no: string
  default_medium: string
  twilio_enabled: boolean
  twilio_number: string
  exotel_enabled: boolean
  exotel_number: string
  call_receiving_device: "Computer" | "Phone"
}

interface AgentModalProps {
  agent?: TelephonyAgent | null
  onClose: () => void
}

function AgentModal({ agent, onClose }: AgentModalProps) {
  const isEditing = !!agent

  const [form, setForm] = useState<AgentFormData>({
    user_email: agent?.user_email || "",
    user_name: agent?.user_name || "",
    mobile_no: agent?.mobile_no || "",
    default_medium: agent?.default_medium || "Twilio",
    twilio_enabled: agent?.twilio_enabled ?? false,
    twilio_number: agent?.twilio_number || "",
    exotel_enabled: agent?.exotel_enabled ?? false,
    exotel_number: agent?.exotel_number || "",
    call_receiving_device: agent?.call_receiving_device || "Computer",
  })

  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const createAgent = useCreateAgent()
  const updateAgent = useUpdateAgent()

  async function handleSave() {
    setErrorMessage(null)
    if (!form.user_email.trim()) {
      setErrorMessage("User email is required.")
      return
    }

    try {
      if (isEditing && agent) {
        await updateAgent.mutateAsync({ id: agent.id, data: form })
      } else {
        await createAgent.mutateAsync(form)
      }
      onClose()
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to save agent."
      )
    }
  }

  const isSaving = createAgent.isPending || updateAgent.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEditing ? "Edit Agent" : "Add Agent"}
          </h3>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* User Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User Email
            </label>
            <input
              type="email"
              value={form.user_email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, user_email: e.target.value }))
              }
              placeholder="user@example.com"
              disabled={isEditing}
              className={cn(
                "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
                isEditing && "bg-gray-50 text-gray-500"
              )}
            />
          </div>

          {/* User Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User Name
            </label>
            <input
              type="text"
              value={form.user_name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, user_name: e.target.value }))
              }
              placeholder="Full name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mobile Number
            </label>
            <input
              type="tel"
              value={form.mobile_no}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, mobile_no: e.target.value }))
              }
              placeholder="+1234567890"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Default Medium */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Calling Medium
            </label>
            <select
              value={form.default_medium}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  default_medium: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white"
            >
              <option value="Twilio">Twilio</option>
              <option value="Exotel">Exotel</option>
            </select>
          </div>

          {/* Twilio Settings */}
          <div className="border border-gray-200 rounded-md p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Twilio
              </label>
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    twilio_enabled: !prev.twilio_enabled,
                  }))
                }
                className={cn(
                  "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  form.twilio_enabled ? "bg-primary" : "bg-gray-300"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    form.twilio_enabled ? "translate-x-4" : "translate-x-0"
                  )}
                />
              </button>
            </div>
            {form.twilio_enabled && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Twilio Number
                </label>
                <input
                  type="text"
                  value={form.twilio_number}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      twilio_number: e.target.value,
                    }))
                  }
                  placeholder="+1234567890"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            )}
          </div>

          {/* Exotel Settings */}
          <div className="border border-gray-200 rounded-md p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Exotel
              </label>
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    exotel_enabled: !prev.exotel_enabled,
                  }))
                }
                className={cn(
                  "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  form.exotel_enabled ? "bg-primary" : "bg-gray-300"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    form.exotel_enabled ? "translate-x-4" : "translate-x-0"
                  )}
                />
              </button>
            </div>
            {form.exotel_enabled && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Exotel Number
                </label>
                <input
                  type="text"
                  value={form.exotel_number}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      exotel_number: e.target.value,
                    }))
                  }
                  placeholder="Exotel virtual number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            )}
          </div>

          {/* Call Receiving Device */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Call Receiving Device
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="device"
                  value="Computer"
                  checked={form.call_receiving_device === "Computer"}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      call_receiving_device: e.target
                        .value as "Computer" | "Phone",
                    }))
                  }
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                />
                <span className="text-sm text-gray-700">Computer</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="device"
                  value="Phone"
                  checked={form.call_receiving_device === "Phone"}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      call_receiving_device: e.target
                        .value as "Computer" | "Phone",
                    }))
                  }
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                />
                <span className="text-sm text-gray-700">Phone</span>
              </label>
            </div>
          </div>

          {/* Error */}
          {errorMessage && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md transition-colors",
              isSaving
                ? "bg-primary/60 cursor-not-allowed"
                : "bg-primary hover:bg-primary/90"
            )}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isEditing ? "Save Changes" : "Add Agent"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TelephonyAgentsPage() {
  const { data: agents, isLoading, isError } = useTelephonyAgents()
  const deleteAgent = useDeleteAgent()

  const [showModal, setShowModal] = useState(false)
  const [editingAgent, setEditingAgent] = useState<TelephonyAgent | null>(null)

  async function handleDelete(agent: TelephonyAgent) {
    const confirmed = window.confirm(
      `Are you sure you want to remove "${agent.user_name || agent.user_email}" as a telephony agent?`
    )
    if (!confirmed) return
    try {
      await deleteAgent.mutateAsync(agent.id)
    } catch {
      // Error surfaced via mutation state
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/settings/integrations"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Integrations
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Telephony Agents
              </h1>
              <p className="text-sm text-gray-500">
                Manage agent phone numbers and calling preferences
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingAgent(null)
              setShowModal(true)
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Agent
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">
              Loading agents...
            </span>
          </div>
        ) : isError ? (
          <div className="py-16 text-center">
            <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-red-600">
              Failed to load agents. Please try again.
            </p>
          </div>
        ) : !agents || agents.length === 0 ? (
          <div className="py-16 text-center">
            <Inbox className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              No telephony agents configured. Add agents to enable click-to-call.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">
                    User
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">
                    Mobile
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">
                    Default Medium
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">
                    Twilio Number
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">
                    Exotel Number
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">
                    Device
                  </th>
                  <th className="w-24 px-4 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {agents.map((agent) => (
                  <tr
                    key={agent.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {agent.user_name || "—"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {agent.user_email}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {agent.mobile_no || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {agent.default_medium}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                      {agent.twilio_enabled
                        ? agent.twilio_number || "—"
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                      {agent.exotel_enabled
                        ? agent.exotel_number || "—"
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {agent.call_receiving_device}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setEditingAgent(agent)
                            setShowModal(true)
                          }}
                          className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit agent"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(agent)}
                          disabled={deleteAgent.isPending}
                          className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Delete agent"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Error display for mutations */}
      {deleteAgent.isError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">
            {deleteAgent.error instanceof Error
              ? deleteAgent.error.message
              : "An error occurred."}
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <AgentModal
          agent={editingAgent}
          onClose={() => {
            setShowModal(false)
            setEditingAgent(null)
          }}
        />
      )}
    </div>
  )
}
