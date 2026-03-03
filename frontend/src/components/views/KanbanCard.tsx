"use client"

import { cn } from "@/lib/utils"
import { Building2, Mail, Globe, User, Calendar, TrendingUp, DollarSign } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { Lead } from "@/types/lead"
import type { Deal } from "@/types/deal"

function OwnerAvatar({ name, email }: { name: string | null; email: string | null }) {
  const displayName = name || email
  if (!displayName) return null

  const initials = (name || email || "?")
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("")

  return (
    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
        <span className="text-[10px] font-medium text-muted-foreground">{initials}</span>
      </div>
      <span className="text-xs text-muted-foreground truncate">{displayName}</span>
    </div>
  )
}

export function LeadKanbanCard({ lead }: { lead: Lead }) {
  const fullName = [lead.first_name, lead.last_name].filter(Boolean).join(" ") || "Unnamed Lead"

  return (
    <Card className="shadow-sm hover:shadow-md hover:border-border/80 transition-all duration-150">
      <CardContent className="p-4">
        {/* Lead Name */}
        <h4 className="text-sm font-semibold text-foreground truncate">{fullName}</h4>

        {/* Email */}
        {lead.email && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <Mail className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground truncate">{lead.email}</span>
          </div>
        )}

        {/* Tags */}
        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
          {lead.organization && (
            <Badge variant="secondary" className="gap-1 rounded-full text-xs font-medium">
              <Building2 className="w-3 h-3" />
              <span className="truncate max-w-[100px]">{lead.organization}</span>
            </Badge>
          )}
          {lead.source && (
            <Badge className="gap-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border-transparent hover:bg-blue-100">
              <Globe className="w-3 h-3" />
              <span className="truncate max-w-[80px]">{lead.source}</span>
            </Badge>
          )}
        </div>

        {/* Owner */}
        <OwnerAvatar name={lead.lead_owner_name} email={lead.lead_owner_email} />
      </CardContent>
    </Card>
  )
}

function formatCurrency(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${currency || "$"} ${value.toLocaleString()}`
  }
}

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

export function DealKanbanCard({ deal }: { deal: Deal }) {
  const fullName =
    [deal.first_name, deal.last_name].filter(Boolean).join(" ") || "Unnamed Deal"
  const closeDateFormatted = formatDate(deal.expected_closure_date)

  const probabilityColor =
    deal.probability >= 70
      ? "bg-green-100 text-green-800 border-transparent hover:bg-green-100"
      : deal.probability >= 40
        ? "bg-yellow-100 text-yellow-800 border-transparent hover:bg-yellow-100"
        : "bg-red-100 text-red-800 border-transparent hover:bg-red-100"

  return (
    <Card className="shadow-sm hover:shadow-md hover:border-border/80 transition-all duration-150">
      <CardContent className="p-4">
        {/* Deal Name */}
        <h4 className="text-sm font-semibold text-foreground truncate">{fullName}</h4>

        {/* Organization */}
        {deal.organization_name && (
          <div className="flex items-center gap-1.5 mt-1">
            <Building2 className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground truncate">{deal.organization_name}</span>
          </div>
        )}

        {/* Deal Value */}
        <div className="flex items-center gap-1.5 mt-2.5">
          <DollarSign className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span className="text-base font-bold text-foreground">
            {formatCurrency(deal.deal_value, deal.currency)}
          </span>
        </div>

        {/* Probability & Close Date */}
        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
          <Badge className={cn("gap-1 rounded-full text-xs font-medium", probabilityColor)}>
            <TrendingUp className="w-3 h-3" />
            {deal.probability}%
          </Badge>
          {closeDateFormatted && (
            <Badge variant="secondary" className="gap-1 rounded-full text-xs font-medium">
              <Calendar className="w-3 h-3" />
              {closeDateFormatted}
            </Badge>
          )}
        </div>

        {/* Owner */}
        <OwnerAvatar name={deal.deal_owner_name} email={deal.deal_owner_email} />
      </CardContent>
    </Card>
  )
}
