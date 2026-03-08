"use client"

import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Loader2,
  Send,
  CheckCircle,
  AlertCircle,
  Clock,
  Megaphone,
} from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface EmailCampaign {
  id: number
  name: string
  email_account_id: number | null
  template_id: number | null
  subject: string
  body_html: string
  status: string
  recipients: { email: string; first_name?: string; last_name?: string }[]
  total_recipients: number
  sent_count: number
  failed_count: number
  created_at: string
}

interface CampaignLog {
  id: number
  recipient_email: string
  status: string
  error_message: string
  sent_at: string | null
}

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const qc = useQueryClient()
  const campaignId = Number(params.id)

  const { data: campaign, isLoading } = useQuery({
    queryKey: ["email-campaign", campaignId],
    queryFn: () => api.get<EmailCampaign>(`/integrations/email/campaigns/${campaignId}`),
  })

  const { data: logsData } = useQuery({
    queryKey: ["email-campaign-logs", campaignId],
    queryFn: () =>
      api.get<{ results: CampaignLog[]; total: number }>(
        `/integrations/email/campaigns/${campaignId}/logs`
      ),
    enabled: !!campaign && campaign.status !== "Draft",
  })

  const sendCampaign = useMutation({
    mutationFn: () =>
      api.post(`/integrations/email/campaigns/${campaignId}/send`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email-campaign", campaignId] })
      qc.invalidateQueries({ queryKey: ["email-campaigns"] })
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Campaign not found</p>
      </div>
    )
  }

  const logs = logsData?.results ?? []
  const canSend = ["Draft", "Paused", "Failed"].includes(campaign.status)

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => router.push("/email/campaigns")}
        className="gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Campaigns
      </Button>

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold">{campaign.name}</h1>
                <Badge
                  variant={
                    campaign.status === "Sent"
                      ? "default"
                      : campaign.status === "Failed"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {campaign.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {campaign.subject || "(no subject)"}
              </p>
            </div>
            {canSend && (
              <Button
                onClick={() => sendCampaign.mutate()}
                disabled={sendCampaign.isPending || campaign.recipients.length === 0}
                className="gap-1.5"
              >
                {sendCampaign.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Send Campaign
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Megaphone className="size-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{campaign.total_recipients || campaign.recipients.length}</p>
              <p className="text-xs text-muted-foreground">Recipients</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="size-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="size-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{campaign.sent_count}</p>
              <p className="text-xs text-muted-foreground">Sent</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="size-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="size-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{campaign.failed_count}</p>
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recipients */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recipients ({campaign.recipients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {campaign.recipients.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recipients added</p>
          ) : (
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              {campaign.recipients.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 text-sm"
                >
                  <span className="flex-1 truncate">{r.email}</span>
                  {r.first_name && (
                    <span className="text-muted-foreground">
                      {r.first_name} {r.last_name || ""}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logs */}
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Send Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 text-sm"
                >
                  {log.status === "Sent" ? (
                    <CheckCircle className="size-4 text-green-500 shrink-0" />
                  ) : (
                    <AlertCircle className="size-4 text-red-500 shrink-0" />
                  )}
                  <span className="flex-1 truncate">{log.recipient_email}</span>
                  {log.error_message && (
                    <span className="text-xs text-red-500 truncate max-w-[200px]">
                      {log.error_message}
                    </span>
                  )}
                  {log.sent_at && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(log.sent_at).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {campaign.body_html && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Email Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="border rounded-md p-4 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: campaign.body_html }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
