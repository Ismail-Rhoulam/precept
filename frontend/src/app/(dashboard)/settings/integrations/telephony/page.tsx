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
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

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
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Agent" : "Add Agent"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 px-1">
          {/* User Email */}
          <div className="space-y-2">
            <Label>User Email</Label>
            <Input
              type="email"
              value={form.user_email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, user_email: e.target.value }))
              }
              placeholder="user@example.com"
              disabled={isEditing}
              className={cn(isEditing && "bg-muted text-muted-foreground")}
            />
          </div>

          {/* User Name */}
          <div className="space-y-2">
            <Label>User Name</Label>
            <Input
              type="text"
              value={form.user_name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, user_name: e.target.value }))
              }
              placeholder="Full name"
            />
          </div>

          {/* Mobile Number */}
          <div className="space-y-2">
            <Label>Mobile Number</Label>
            <Input
              type="tel"
              value={form.mobile_no}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, mobile_no: e.target.value }))
              }
              placeholder="+1234567890"
            />
          </div>

          {/* Default Medium */}
          <div className="space-y-2">
            <Label>Default Calling Medium</Label>
            <select
              value={form.default_medium}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  default_medium: e.target.value,
                }))
              }
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="Twilio">Twilio</option>
              <option value="Exotel">Exotel</option>
            </select>
          </div>

          {/* Twilio Settings */}
          <div className="border rounded-md p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label>Twilio</Label>
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
                  form.twilio_enabled ? "bg-primary" : "bg-muted-foreground/30"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-card shadow ring-0 transition duration-200 ease-in-out",
                    form.twilio_enabled ? "translate-x-4" : "translate-x-0"
                  )}
                />
              </button>
            </div>
            {form.twilio_enabled && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Twilio Number
                </Label>
                <Input
                  type="text"
                  value={form.twilio_number}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      twilio_number: e.target.value,
                    }))
                  }
                  placeholder="+1234567890"
                />
              </div>
            )}
          </div>

          {/* Exotel Settings */}
          <div className="border rounded-md p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label>Exotel</Label>
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
                  form.exotel_enabled ? "bg-primary" : "bg-muted-foreground/30"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-card shadow ring-0 transition duration-200 ease-in-out",
                    form.exotel_enabled ? "translate-x-4" : "translate-x-0"
                  )}
                />
              </button>
            </div>
            {form.exotel_enabled && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Exotel Number
                </Label>
                <Input
                  type="text"
                  value={form.exotel_number}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      exotel_number: e.target.value,
                    }))
                  }
                  placeholder="Exotel virtual number"
                />
              </div>
            )}
          </div>

          {/* Call Receiving Device */}
          <div className="space-y-2">
            <Label>Call Receiving Device</Label>
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
                  className="h-4 w-4 text-primary focus:ring-primary border-input"
                />
                <span className="text-sm">Computer</span>
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
                  className="h-4 w-4 text-primary focus:ring-primary border-input"
                />
                <span className="text-sm">Phone</span>
              </label>
            </div>
          </div>

          {/* Error */}
          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
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
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Integrations
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">
                Telephony Agents
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage agent phone numbers and calling preferences
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              setEditingAgent(null)
              setShowModal(true)
            }}
          >
            <Plus className="h-4 w-4" />
            Add Agent
          </Button>
        </div>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading agents...
            </span>
          </div>
        ) : isError ? (
          <div className="py-16 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
            <p className="text-sm text-destructive">
              Failed to load agents. Please try again.
            </p>
          </div>
        ) : !agents || agents.length === 0 ? (
          <div className="py-16 text-center">
            <Inbox className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No telephony agents configured. Add agents to enable click-to-call.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-semibold uppercase">
                  User
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase">
                  Mobile
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase">
                  Default Medium
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase">
                  Twilio Number
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase">
                  Exotel Number
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase">
                  Device
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase text-center w-24">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {agent.user_name || "\u2014"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {agent.user_email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {agent.mobile_no || "\u2014"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {agent.default_medium}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {agent.twilio_enabled
                      ? agent.twilio_number || "\u2014"
                      : "\u2014"}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {agent.exotel_enabled
                      ? agent.exotel_number || "\u2014"
                      : "\u2014"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {agent.call_receiving_device}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => {
                          setEditingAgent(agent)
                          setShowModal(true)
                        }}
                        className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Edit agent"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(agent)}
                        disabled={deleteAgent.isPending}
                        className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                        title="Delete agent"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Error display for mutations */}
      {deleteAgent.isError && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {deleteAgent.error instanceof Error
              ? deleteAgent.error.message
              : "An error occurred."}
          </AlertDescription>
        </Alert>
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
