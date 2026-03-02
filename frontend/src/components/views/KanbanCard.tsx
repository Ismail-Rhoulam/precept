"use client"

import { cn } from "@/lib/utils"
import { Building2, Mail, Globe, User, Calendar, TrendingUp, DollarSign } from "lucide-react"
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
    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
        <span className="text-[10px] font-medium text-gray-600">{initials}</span>
      </div>
      <span className="text-xs text-gray-500 truncate">{displayName}</span>
    </div>
  )
}

export function LeadKanbanCard({ lead }: { lead: Lead }) {
  const fullName = [lead.first_name, lead.last_name].filter(Boolean).join(" ") || "Unnamed Lead"

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-150">
      {/* Lead Name */}
      <h4 className="text-sm font-semibold text-gray-900 truncate">{fullName}</h4>

      {/* Email */}
      {lead.email && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />
          <span className="text-xs text-gray-500 truncate">{lead.email}</span>
        </div>
      )}

      {/* Tags */}
      <div className="flex items-center gap-1.5 mt-3 flex-wrap">
        {lead.organization && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            <Building2 className="w-3 h-3" />
            <span className="truncate max-w-[100px]">{lead.organization}</span>
          </span>
        )}
        {lead.source && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
            <Globe className="w-3 h-3" />
            <span className="truncate max-w-[80px]">{lead.source}</span>
          </span>
        )}
      </div>

      {/* Owner */}
      <OwnerAvatar name={lead.lead_owner_name} email={lead.lead_owner_email} />
    </div>
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
      ? "bg-green-100 text-green-800"
      : deal.probability >= 40
        ? "bg-yellow-100 text-yellow-800"
        : "bg-red-100 text-red-800"

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-150">
      {/* Deal Name */}
      <h4 className="text-sm font-semibold text-gray-900 truncate">{fullName}</h4>

      {/* Organization */}
      {deal.organization_name && (
        <div className="flex items-center gap-1.5 mt-1">
          <Building2 className="w-3 h-3 text-gray-400 flex-shrink-0" />
          <span className="text-xs text-gray-500 truncate">{deal.organization_name}</span>
        </div>
      )}

      {/* Deal Value */}
      <div className="flex items-center gap-1.5 mt-2.5">
        <DollarSign className="w-4 h-4 text-green-600 flex-shrink-0" />
        <span className="text-base font-bold text-gray-900">
          {formatCurrency(deal.deal_value, deal.currency)}
        </span>
      </div>

      {/* Probability & Close Date */}
      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
            probabilityColor
          )}
        >
          <TrendingUp className="w-3 h-3" />
          {deal.probability}%
        </span>
        {closeDateFormatted && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            <Calendar className="w-3 h-3" />
            {closeDateFormatted}
          </span>
        )}
      </div>

      {/* Owner */}
      <OwnerAvatar name={deal.deal_owner_name} email={deal.deal_owner_email} />
    </div>
  )
}
