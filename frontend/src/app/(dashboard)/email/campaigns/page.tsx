"use client"

import { useRouter } from "next/navigation"
import {
  Plus,
  Loader2,
  Megaphone,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  Pause,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface EmailCampaign {
  id: number
  name: string
  status: string
  total_recipients: number
  sent_count: number
  failed_count: number
  created_at: string
}

function useCampaigns() {
  return useQuery({
    queryKey: ["email-campaigns"],
    queryFn: () => api.get<EmailCampaign[]>("/integrations/email/campaigns"),
  })
}

function statusBadge(status: string) {
  const config: Record<string, { icon: React.ReactNode; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    Draft: { icon: <Clock className="size-3" />, variant: "secondary" },
    Scheduled: { icon: <Clock className="size-3" />, variant: "outline" },
    Sending: { icon: <Send className="size-3 animate-pulse" />, variant: "default" },
    Sent: { icon: <CheckCircle className="size-3" />, variant: "default" },
    Paused: { icon: <Pause className="size-3" />, variant: "secondary" },
    Failed: { icon: <AlertCircle className="size-3" />, variant: "destructive" },
  }
  const c = config[status] || config.Draft
  return (
    <Badge variant={c.variant} className="gap-1 text-xs">
      {c.icon}
      {status}
    </Badge>
  )
}

export default function CampaignsPage() {
  const router = useRouter()
  const { data: campaigns, isLoading } = useCampaigns()

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Email Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Send bulk emails to your contacts
          </p>
        </div>
        <Button
          onClick={() => router.push("/email/campaigns/new")}
          className="gap-1.5"
        >
          <Plus className="size-4" />
          New Campaign
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : !campaigns || campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Megaphone className="size-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              No campaigns yet
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Create your first email campaign
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {campaigns.map((campaign) => (
            <Card
              key={campaign.id}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => router.push(`/email/campaigns/${campaign.id}`)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="size-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                  <Megaphone className="size-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{campaign.name}</p>
                    {statusBadge(campaign.status)}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{campaign.total_recipients} recipients</span>
                    {campaign.sent_count > 0 && (
                      <span className="text-green-600">{campaign.sent_count} sent</span>
                    )}
                    {campaign.failed_count > 0 && (
                      <span className="text-red-600">{campaign.failed_count} failed</span>
                    )}
                    <span>
                      {new Date(campaign.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
