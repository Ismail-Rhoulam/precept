"use client"

import { useState } from "react"
import type { ChartDataPoint } from "@/types/dashboard"

function formatValue(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return "$" + (value / 1_000_000).toFixed(1) + "M"
  }
  if (Math.abs(value) >= 1_000) {
    return "$" + (value / 1_000).toFixed(0) + "K"
  }
  return "$" + value.toLocaleString()
}

interface OverviewChartProps {
  data: ChartDataPoint[]
}

export default function OverviewChart({ data }: OverviewChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[350px] text-sm text-muted-foreground">
        No data available
      </div>
    )
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1)

  // Y-axis ticks
  const tickCount = 5
  const yTicks = Array.from({ length: tickCount }, (_, i) => {
    const value = Math.round((maxValue / (tickCount - 1)) * i)
    return value
  })

  const padding = { top: 10, right: 10, bottom: 30, left: 55 }
  const width = 600
  const height = 350
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const barGap = 8
  const barWidth = Math.max(16, Math.min(48, (chartWidth - barGap * data.length) / data.length))
  const totalBarArea = data.length * (barWidth + barGap)
  const startX = padding.left + (chartWidth - totalBarArea) / 2

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-[350px]"
    >
      {/* Y-axis grid lines and labels */}
      {yTicks.map((tick, i) => {
        const y = padding.top + chartHeight - (tick / maxValue) * chartHeight
        return (
          <g key={i}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeWidth={1}
            />
            <text
              x={padding.left - 8}
              y={y + 4}
              textAnchor="end"
              className="text-[11px] fill-muted-foreground"
            >
              {formatValue(tick)}
            </text>
          </g>
        )
      })}

      {/* Bars */}
      {data.map((item, index) => {
        const barHeight = (item.value / maxValue) * chartHeight
        const x = startX + index * (barWidth + barGap)
        const y = padding.top + chartHeight - barHeight
        const isHovered = hoveredIndex === index

        return (
          <g
            key={item.label}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            className="cursor-default"
          >
            {/* Bar */}
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(barHeight, 1)}
              rx={4}
              className={isHovered ? "fill-primary/80" : "fill-primary"}
            />

            {/* Hover tooltip */}
            {isHovered && (
              <>
                <rect
                  x={x + barWidth / 2 - 35}
                  y={y - 28}
                  width={70}
                  height={22}
                  rx={4}
                  className="fill-foreground"
                />
                <text
                  x={x + barWidth / 2}
                  y={y - 13}
                  textAnchor="middle"
                  className="text-[11px] fill-background font-medium"
                >
                  {formatValue(item.value)}
                </text>
              </>
            )}

            {/* X-axis label */}
            <text
              x={x + barWidth / 2}
              y={height - 8}
              textAnchor="middle"
              className="text-[11px] fill-muted-foreground"
            >
              {item.label.length > 6 ? item.label.slice(0, 5) + "…" : item.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
