"use client"

import {
  DollarSign,
  Users,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import type { NumberCardData } from "@/types/dashboard"

const ICON_MAP: Record<string, LucideIcon> = {
  "Total Revenue": DollarSign,
  "Revenue": DollarSign,
  "Total Deals": Target,
  "Deals": Target,
  "Active Leads": Users,
  "Leads": Users,
  "New Leads": Users,
  "Conversion Rate": TrendingUp,
  "Win Rate": TrendingUp,
  "Won Deals": TrendingUp,
}

function formatValue(value: number, prefix?: string): string {
  if (prefix === "$" || prefix === "€" || prefix === "£") {
    if (Math.abs(value) >= 1_000_000) {
      return `${prefix}${(value / 1_000_000).toFixed(2)}M`
    }
    if (Math.abs(value) >= 1_000) {
      return `${prefix}${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
    return `${prefix}${value.toFixed(2)}`
  }
  if (Math.abs(value) >= 1_000_000) {
    return (value / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M"
  }
  if (Math.abs(value) >= 1_000) {
    return "+" + value.toLocaleString()
  }
  return "+" + value.toLocaleString()
}

function formatDelta(delta: number): string {
  const sign = delta >= 0 ? "+" : ""
  return `${sign}${delta.toFixed(1)}% from last period`
}

interface NumberCardProps {
  data: NumberCardData
}

export default function NumberCard({ data }: NumberCardProps) {
  const { title, value, delta, prefix, suffix } = data
  const Icon = ICON_MAP[title] || DollarSign

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatValue(value, prefix)}
          {suffix && <span className="text-lg font-semibold text-muted-foreground ml-1">{suffix}</span>}
        </div>
        <p className="text-xs text-muted-foreground">
          {formatDelta(delta)}
        </p>
      </CardContent>
    </Card>
  )
}
