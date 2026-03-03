"use client"

import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import type { NumberCardData } from "@/types/dashboard"

function formatValue(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return (value / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M"
  }
  if (Math.abs(value) >= 1_000) {
    return (value / 1_000).toFixed(1).replace(/\.0$/, "") + "K"
  }
  return value.toLocaleString()
}

function formatDelta(delta: number): string {
  const sign = delta >= 0 ? "+" : ""
  return `${sign}${delta.toFixed(1)}%`
}

interface NumberCardProps {
  data: NumberCardData
}

export default function NumberCard({ data }: NumberCardProps) {
  const { title, value, delta, prefix, suffix, negative_is_better } = data

  const isPositiveDelta = delta >= 0
  const isGood = negative_is_better ? !isPositiveDelta : isPositiveDelta

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground truncate">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1">
          {prefix && (
            <span className="text-lg font-semibold text-muted-foreground">{prefix}</span>
          )}
          <span className="text-2xl font-bold">
            {formatValue(value)}
          </span>
          {suffix && (
            <span className="text-sm font-medium text-muted-foreground">{suffix}</span>
          )}
        </div>
        {delta !== 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            {isPositiveDelta ? (
              <TrendingUp
                className={cn(
                  "w-4 h-4",
                  isGood ? "text-green-500" : "text-red-500"
                )}
              />
            ) : (
              <TrendingDown
                className={cn(
                  "w-4 h-4",
                  isGood ? "text-green-500" : "text-red-500"
                )}
              />
            )}
            <span
              className={cn(
                "text-sm font-medium",
                isGood ? "text-green-600" : "text-red-600"
              )}
            >
              {formatDelta(delta)}
            </span>
            <span className="text-xs text-muted-foreground">vs previous period</span>
          </div>
        )}
        {delta === 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-sm font-medium text-muted-foreground">No change</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
