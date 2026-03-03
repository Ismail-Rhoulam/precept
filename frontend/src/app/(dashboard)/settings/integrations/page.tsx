"use client"

import Link from "next/link"
import {
  Phone,
  MessageCircle,
  Facebook,
  Users,
  ArrowLeft,
  ArrowRight,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useIntegrationStatus } from "@/hooks/useIntegrations"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const integrationCards = [
  {
    name: "Twilio",
    description: "VoIP calling, call recording, and browser-based phone",
    href: "/settings/integrations/twilio",
    icon: Phone,
    statusKey: "twilio_enabled" as const,
  },
  {
    name: "Exotel",
    description: "Cloud telephony, click-to-call, and call tracking",
    href: "/settings/integrations/exotel",
    icon: Phone,
    statusKey: "exotel_enabled" as const,
  },
  {
    name: "WhatsApp",
    description: "WhatsApp Business messaging and notifications",
    href: "/settings/integrations/whatsapp",
    icon: MessageCircle,
    statusKey: "whatsapp_enabled" as const,
  },
  {
    name: "Facebook",
    description: "Lead sync from Facebook Lead Ads and forms",
    href: "/settings/integrations/facebook",
    icon: Facebook,
    statusKey: null,
  },
  {
    name: "Telephony Agents",
    description: "Manage agent phone numbers and calling preferences",
    href: "/settings/integrations/telephony",
    icon: Users,
    statusKey: null,
  },
]

export default function IntegrationsPage() {
  const { data: status, isLoading } = useIntegrationStatus()

  function getEnabled(statusKey: string | null): boolean | null {
    if (!statusKey || !status) return null
    return status[statusKey as keyof typeof status] as boolean
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>
        <div className="flex items-center gap-3">
          <Phone className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Integrations</h1>
            <p className="text-sm text-muted-foreground">
              Connect your CRM with external services
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">
            Loading integrations...
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrationCards.map((card) => {
            const enabled = getEnabled(card.statusKey)

            return (
              <Link key={card.href} href={card.href}>
                <Card className="hover:border-primary/30 hover:shadow-md transition-all group h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10 transition-colors">
                        <card.icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      {enabled !== null && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            enabled
                              ? "bg-green-100 text-green-800"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <h2 className="text-base font-semibold group-hover:text-primary transition-colors">
                          {card.name}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          {card.description}
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0 ml-2" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
