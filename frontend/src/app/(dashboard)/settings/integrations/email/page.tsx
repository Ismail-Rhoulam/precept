"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Mail,
  ArrowLeft,
  Loader2,
  Save,
  AlertCircle,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Star,
  Pencil,
  X,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useEmailAccounts,
  useCreateEmailAccount,
  useUpdateEmailAccount,
  useDeleteEmailAccount,
  useTestEmailConnection,
  useBuiltinSmtpStatus,
  useDkimRecord,
  useVerifyDns,
} from "@/hooks/useIntegrations"
import type { EmailAccount } from "@/types/integration"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

type FormData = {
  enabled: boolean
  display_name: string
  is_default: boolean
  email_address: string
  smtp_mode: "external" | "builtin"
  mail_domain: string
  smtp_host: string
  smtp_port: number
  smtp_username: string
  smtp_password: string
  smtp_use_tls: boolean
  smtp_use_ssl: boolean
  imap_host: string
  imap_port: number
  imap_username: string
  imap_password: string
  imap_use_ssl: boolean
  imap_folder: string
  enable_incoming: boolean
  sync_frequency: string
}

const emptyForm: FormData = {
  enabled: false,
  display_name: "",
  is_default: false,
  email_address: "",
  smtp_mode: "external",
  mail_domain: "",
  smtp_host: "",
  smtp_port: 587,
  smtp_username: "",
  smtp_password: "",
  smtp_use_tls: true,
  smtp_use_ssl: false,
  imap_host: "",
  imap_port: 993,
  imap_username: "",
  imap_password: "",
  imap_use_ssl: true,
  imap_folder: "INBOX",
  enable_incoming: false,
  sync_frequency: "Every 5 minutes",
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: () => void
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        checked ? "bg-primary" : "bg-muted-foreground/30"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-card shadow ring-0 transition duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  )
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="shrink-0 text-muted-foreground hover:text-foreground"
      title={`Copy ${label}`}
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
    </button>
  )
}

function DnsStatusBadge({ status }: { status?: "verified" | "pending" | "error" }) {
  if (status === "verified")
    return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 text-[10px] px-1.5 py-0">Verified</Badge>
  if (status === "error")
    return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Error</Badge>
  return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Pending</Badge>
}

function BuiltinSmtpInfo({
  mailDomain,
  onMailDomainChange,
}: {
  mailDomain: string
  onMailDomainChange: (v: string) => void
}) {
  const { data: status } = useBuiltinSmtpStatus()
  const { data: dkim } = useDkimRecord()
  const [showDns, setShowDns] = useState(false)
  const [dnsCheckActive, setDnsCheckActive] = useState(false)
  const { data: dnsStatus, isFetching: dnsChecking, refetch: recheckDns } = useVerifyDns(dnsCheckActive)
  const displayDomain = mailDomain || "yourdomain.com"

  const dkimRecords = dkim?.records || []
  const dkim1 = dkimRecords[0]
  const dkim2 = dkimRecords[1]

  const allVerified =
    dnsStatus?.spf === "verified" &&
    dnsStatus?.dkim1 === "verified" &&
    dnsStatus?.dkim2 === "verified" &&
    dnsStatus?.dmarc === "verified"

  const dnsRows = [
    {
      label: "SPF",
      type: "TXT",
      name: "@",
      value: `v=spf1 a mx${status?.server_ip ? ` ip4:${status.server_ip}` : ""} -all`,
      status: dnsStatus?.spf,
    },
    {
      label: "DKIM 1",
      type: "TXT",
      name: dkim1?.dns_name || `mail._domainkey.${displayDomain}`,
      value: dkim1?.record || "",
      error: dkim1?.error,
      status: dnsStatus?.dkim1,
    },
    {
      label: "DKIM 2",
      type: "TXT",
      name: dkim2?.dns_name || `mail2._domainkey.${displayDomain}`,
      value: dkim2?.record || "",
      error: dkim2?.error,
      status: dnsStatus?.dkim2,
    },
    {
      label: "DMARC",
      type: "TXT",
      name: `_dmarc.${displayDomain}`,
      value: `v=DMARC1; p=none; rua=mailto:rua@${displayDomain}`,
      status: dnsStatus?.dmarc,
    },
  ]

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4 text-sm">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "size-2 rounded-full",
            status?.available ? "bg-green-500" : "bg-yellow-500"
          )}
        />
        <span className="font-medium">
          {status?.available
            ? "Postfix server is running"
            : "Postfix server not detected"}
        </span>
      </div>

      <div className="space-y-2">
        <Label>Mail Domain</Label>
        <Input
          value={mailDomain}
          onChange={(e) => onMailDomainChange(e.target.value)}
          placeholder="example.com"
        />
        <p className="text-xs text-muted-foreground">
          Your sending domain. Emails will be sent as <span className="font-mono">you@{displayDomain}</span>
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        Emails are sent directly from your server with DKIM signing.
        No external SMTP credentials needed.
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setShowDns(!showDns)}
      >
        {showDns ? "Hide" : "View"} DNS Setup
      </Button>
      {showDns && (
        <div className="space-y-3 pt-2 text-xs">
          <div className="flex items-center justify-between">
            <p className="font-medium text-foreground">
              Add these DNS records to your domain:
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setDnsCheckActive(true)
                recheckDns()
              }}
              disabled={dnsChecking}
              className="h-7 text-xs"
            >
              {dnsChecking ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <CheckCircle2 className="size-3" />
              )}
              {dnsChecking ? "Checking..." : "Re-check DNS"}
            </Button>
          </div>

          {allVerified && (
            <Alert className="border-green-200 bg-green-50 text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>All DNS records are verified. Your domain is ready to send email.</AlertDescription>
            </Alert>
          )}

          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Record</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Type</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Value</th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {dnsRows.map((row) => (
                  <tr key={row.label} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 font-medium whitespace-nowrap">{row.label}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.type}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <span className="font-mono">{row.name}</span>
                        <CopyButton text={row.name} label="name" />
                      </div>
                    </td>
                    <td className="px-3 py-2 max-w-[300px]">
                      {row.value ? (
                        <div className="flex items-start gap-1">
                          <code className="bg-muted rounded px-1.5 py-0.5 break-all leading-relaxed">
                            {row.value}
                          </code>
                          <CopyButton text={row.value} label="value" />
                        </div>
                      ) : (
                        <span className="italic text-muted-foreground">
                          {row.error || "Key not generated yet"}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <DnsStatusBadge status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {dnsCheckActive && !allVerified && dnsStatus && !dnsChecking && (
            <p className="text-muted-foreground">
              Polling every 10 seconds until all records are verified...
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function AccountForm({
  form,
  setForm,
  onSave,
  onCancel,
  saving,
  error,
  isNew,
  accountId,
}: {
  form: FormData
  setForm: (fn: (prev: FormData) => FormData) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
  error: string | null
  isNew: boolean
  accountId?: number
}) {
  const testConnection = useTestEmailConnection()
  const [testResult, setTestResult] = useState<{
    type: string
    success: boolean
    error?: string
  } | null>(null)

  async function handleTest(type: "smtp" | "imap") {
    if (!accountId) return
    setTestResult(null)
    try {
      const result = await testConnection.mutateAsync({
        id: accountId,
        testType: type,
      })
      setTestResult({ type, ...result })
    } catch {
      setTestResult({ type, success: false, error: "Test request failed" })
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardContent className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {isNew ? "Add Email Account" : "Edit Email Account"}
          </h3>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="size-4" />
          </Button>
        </div>

        {/* Display Name */}
        <div className="space-y-2">
          <Label>Display Name</Label>
          <Input
            type="text"
            value={form.display_name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, display_name: e.target.value }))
            }
            placeholder='e.g. "Sales", "Support", "Noreply"'
          />
        </div>

        {/* Email Address */}
        <div className="space-y-2">
          <Label>Email Address</Label>
          <Input
            type="email"
            value={form.email_address}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, email_address: e.target.value }))
            }
            placeholder="sales@company.com"
          />
        </div>

        {/* Enabled Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label>Enable Account</Label>
            <p className="text-xs text-muted-foreground">
              Activate sending/receiving for this account
            </p>
          </div>
          <Toggle
            checked={form.enabled}
            onChange={() =>
              setForm((prev) => ({ ...prev, enabled: !prev.enabled }))
            }
          />
        </div>

        {/* SMTP Section */}
        <div className="space-y-4 pt-2">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            SMTP (Outgoing)
          </h4>

          {/* SMTP Mode Selector */}
          <div className="space-y-2">
            <Label>SMTP Mode</Label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({ ...prev, smtp_mode: "external" }))
                }
                className={cn(
                  "flex-1 rounded-lg border p-3 text-left text-sm transition-colors",
                  form.smtp_mode === "external"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-muted-foreground/40"
                )}
              >
                <span className="font-medium">External SMTP</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Connect to Gmail, Outlook, or any SMTP server
                </p>
              </button>
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({ ...prev, smtp_mode: "builtin" }))
                }
                className={cn(
                  "flex-1 rounded-lg border p-3 text-left text-sm transition-colors",
                  form.smtp_mode === "builtin"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-muted-foreground/40"
                )}
              >
                <span className="font-medium">Built-in (Self-Hosted)</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Send via the built-in Postfix server with DKIM
                </p>
              </button>
            </div>
          </div>

          {form.smtp_mode === "builtin" ? (
            <BuiltinSmtpInfo
              mailDomain={form.mail_domain}
              onMailDomainChange={(v) =>
                setForm((prev) => ({ ...prev, mail_domain: v }))
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SMTP Host</Label>
                  <Input
                    value={form.smtp_host}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, smtp_host: e.target.value }))
                    }
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Port</Label>
                  <Input
                    type="number"
                    value={form.smtp_port}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        smtp_port: parseInt(e.target.value) || 587,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>SMTP Username</Label>
                <Input
                  value={form.smtp_username}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, smtp_username: e.target.value }))
                  }
                  placeholder="your-email@gmail.com"
                />
              </div>

              <PasswordField
                label="SMTP Password"
                value={form.smtp_password}
                onChange={(v) => setForm((prev) => ({ ...prev, smtp_password: v }))}
                placeholder="App password or SMTP password"
              />

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="smtp_use_tls"
                    checked={form.smtp_use_tls}
                    onChange={() =>
                      setForm((prev) => ({
                        ...prev,
                        smtp_use_tls: !prev.smtp_use_tls,
                        smtp_use_ssl: false,
                      }))
                    }
                    className="rounded"
                  />
                  <Label htmlFor="smtp_use_tls" className="text-sm">
                    Use TLS (STARTTLS)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="smtp_use_ssl"
                    checked={form.smtp_use_ssl}
                    onChange={() =>
                      setForm((prev) => ({
                        ...prev,
                        smtp_use_ssl: !prev.smtp_use_ssl,
                        smtp_use_tls: false,
                      }))
                    }
                    className="rounded"
                  />
                  <Label htmlFor="smtp_use_ssl" className="text-sm">
                    Use SSL
                  </Label>
                </div>
              </div>
            </>
          )}

          {!isNew && accountId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTest("smtp")}
              disabled={testConnection.isPending}
            >
              {testConnection.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Mail className="h-3 w-3" />
              )}
              Test SMTP
            </Button>
          )}
        </div>

        {/* IMAP Section */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              IMAP (Incoming)
            </h4>
            <Toggle
              checked={form.enable_incoming}
              onChange={() =>
                setForm((prev) => ({
                  ...prev,
                  enable_incoming: !prev.enable_incoming,
                }))
              }
            />
          </div>

          {form.enable_incoming && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>IMAP Host</Label>
                  <Input
                    value={form.imap_host}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        imap_host: e.target.value,
                      }))
                    }
                    placeholder="imap.gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>IMAP Port</Label>
                  <Input
                    type="number"
                    value={form.imap_port}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        imap_port: parseInt(e.target.value) || 993,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>IMAP Username</Label>
                <Input
                  value={form.imap_username}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      imap_username: e.target.value,
                    }))
                  }
                  placeholder="Leave blank to use SMTP username"
                />
              </div>

              <PasswordField
                label="IMAP Password"
                value={form.imap_password}
                onChange={(v) =>
                  setForm((prev) => ({ ...prev, imap_password: v }))
                }
                placeholder="Leave blank to use SMTP password"
              />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="imap_use_ssl"
                  checked={form.imap_use_ssl}
                  onChange={() =>
                    setForm((prev) => ({
                      ...prev,
                      imap_use_ssl: !prev.imap_use_ssl,
                    }))
                  }
                  className="rounded"
                />
                <Label htmlFor="imap_use_ssl" className="text-sm">
                  Use SSL
                </Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>IMAP Folder</Label>
                  <Input
                    value={form.imap_folder}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        imap_folder: e.target.value,
                      }))
                    }
                    placeholder="INBOX"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sync Frequency</Label>
                  <select
                    value={form.sync_frequency}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        sync_frequency: e.target.value,
                      }))
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="Every 5 minutes">Every 5 minutes</option>
                    <option value="Every 15 minutes">Every 15 minutes</option>
                    <option value="Hourly">Hourly</option>
                  </select>
                </div>
              </div>

              {!isNew && accountId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTest("imap")}
                  disabled={testConnection.isPending}
                >
                  {testConnection.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Mail className="h-3 w-3" />
                  )}
                  Test IMAP
                </Button>
              )}
            </>
          )}
        </div>

        {/* Test result */}
        {testResult && (
          <Alert
            variant={testResult.success ? "default" : "destructive"}
            className={
              testResult.success
                ? "border-green-200 bg-green-50 text-green-700"
                : undefined
            }
          >
            {testResult.success ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {testResult.type.toUpperCase()}{" "}
              {testResult.success
                ? "connection successful!"
                : `connection failed: ${testResult.error}`}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter className="border-t px-6 py-4 justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={onSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {isNew ? "Add Account" : "Save Changes"}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

export default function EmailSettingsPage() {
  const { data: accounts, isLoading, isError } = useEmailAccounts()
  const createMutation = useCreateEmailAccount()
  const updateMutation = useUpdateEmailAccount()
  const deleteMutation = useDeleteEmailAccount()

  const [editingId, setEditingId] = useState<number | "new" | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  function startEdit(account: EmailAccount) {
    setEditingId(account.id)
    setForm({
      enabled: account.enabled,
      display_name: account.display_name,
      is_default: account.is_default,
      email_address: account.email_address,
      smtp_mode: account.smtp_mode || "external",
      mail_domain: account.mail_domain || "",
      smtp_host: account.smtp_host,
      smtp_port: account.smtp_port,
      smtp_username: account.smtp_username,
      smtp_password: account.smtp_password,
      smtp_use_tls: account.smtp_use_tls,
      smtp_use_ssl: account.smtp_use_ssl,
      imap_host: account.imap_host,
      imap_port: account.imap_port,
      imap_username: account.imap_username,
      imap_password: account.imap_password,
      imap_use_ssl: account.imap_use_ssl,
      imap_folder: account.imap_folder,
      enable_incoming: account.enable_incoming,
      sync_frequency: account.sync_frequency,
    })
  }

  function startNew() {
    setEditingId("new")
    setForm(emptyForm)
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleSave() {
    setSuccessMessage(null)
    try {
      if (editingId === "new") {
        await createMutation.mutateAsync(form)
        setSuccessMessage("Email account created successfully.")
      } else if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: form })
        setSuccessMessage("Email account updated successfully.")
      }
      setEditingId(null)
      setForm(emptyForm)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch {
      // Error surfaced via mutation state
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this email account?")) return
    try {
      await deleteMutation.mutateAsync(id)
      setSuccessMessage("Email account deleted.")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch {
      // Error surfaced via mutation state
    }
  }

  async function handleSetDefault(id: number) {
    try {
      await updateMutation.mutateAsync({ id, data: { is_default: true } })
    } catch {
      // Error surfaced via mutation state
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading email settings...
        </span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="py-16 text-center">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
        <p className="text-sm text-destructive">
          Failed to load email settings. Please try again.
        </p>
      </div>
    )
  }

  const saving = createMutation.isPending || updateMutation.isPending
  const mutationError =
    createMutation.error || updateMutation.error
      ? (createMutation.error || updateMutation.error) instanceof Error
        ? ((createMutation.error || updateMutation.error) as Error).message
        : "Failed to save."
      : null

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
            <Mail className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Email Settings</h1>
              <p className="text-sm text-muted-foreground">
                Configure SMTP/IMAP email accounts
              </p>
            </div>
          </div>
          {!editingId && (
            <Button onClick={startNew}>
              <Plus className="h-4 w-4" />
              Add Account
            </Button>
          )}
        </div>
      </div>

      {/* Success message */}
      {successMessage && (
        <Alert className="border-green-200 bg-green-50 text-green-700 mb-4 max-w-2xl">
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Edit/New form */}
      {editingId && (
        <div className="mb-4">
          <AccountForm
            form={form}
            setForm={setForm}
            onSave={handleSave}
            onCancel={cancelEdit}
            saving={saving}
            error={mutationError}
            isNew={editingId === "new"}
            accountId={typeof editingId === "number" ? editingId : undefined}
          />
        </div>
      )}

      {/* Accounts list */}
      {accounts && accounts.length > 0 ? (
        <div className="space-y-3 max-w-2xl">
          {accounts.map((account) => (
            <Card
              key={account.id}
              className={cn(
                "transition-colors",
                !account.enabled && "opacity-60"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "size-2.5 rounded-full shrink-0",
                        account.enabled
                          ? "bg-green-500"
                          : "bg-muted-foreground/30"
                      )}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {account.display_name || account.email_address}
                        </span>
                        {account.is_default && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0"
                          >
                            Default
                          </Badge>
                        )}
                        {account.smtp_mode === "builtin" && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                          >
                            Built-in
                          </Badge>
                        )}
                        {account.enable_incoming && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                          >
                            IMAP
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {account.email_address}
                        {account.smtp_mode !== "builtin" && account.smtp_host && ` · ${account.smtp_host}`}
                        {account.smtp_mode === "builtin" && " · Self-hosted Postfix"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!account.is_default && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => handleSetDefault(account.id)}
                        title="Set as default"
                      >
                        <Star className="size-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => startEdit(account)}
                      title="Edit"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(account.id)}
                      title="Delete"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        !editingId && (
          <Card className="max-w-2xl">
            <CardContent className="py-12 text-center">
              <Mail className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                No email accounts configured
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Add an account to start sending and receiving emails
              </p>
              <Button className="mt-4" onClick={startNew}>
                <Plus className="h-4 w-4" />
                Add Account
              </Button>
            </CardContent>
          </Card>
        )
      )}
    </div>
  )
}
