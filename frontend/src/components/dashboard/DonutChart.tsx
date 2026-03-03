"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import type { ChartDataPoint } from "@/types/dashboard"

const DEFAULT_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#F97316",
  "#6366F1",
  "#14B8A6",
]

function formatValue(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return (value / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M"
  }
  if (Math.abs(value) >= 1_000) {
    return (value / 1_000).toFixed(1).replace(/\.0$/, "") + "K"
  }
  return value.toLocaleString()
}

interface DonutChartProps {
  data: ChartDataPoint[]
  title: string
}

export default function DonutChart({ data, title }: DonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    )
  }

  const total = data.reduce((sum, d) => sum + d.value, 0)
  const cx = 100
  const cy = 100
  const radius = 80
  const innerRadius = 50
  const hoverRadiusBoost = 6

  // Build arcs
  let cumulativeAngle = -Math.PI / 2 // Start from top
  const arcs = data.map((item, index) => {
    const fraction = total > 0 ? item.value / total : 0
    const angle = fraction * Math.PI * 2
    const startAngle = cumulativeAngle
    const endAngle = cumulativeAngle + angle
    cumulativeAngle = endAngle

    const isHovered = hoveredIndex === index
    const r = isHovered ? radius + hoverRadiusBoost : radius
    const ir = isHovered ? innerRadius - 2 : innerRadius

    const x1Outer = cx + r * Math.cos(startAngle)
    const y1Outer = cy + r * Math.sin(startAngle)
    const x2Outer = cx + r * Math.cos(endAngle)
    const y2Outer = cy + r * Math.sin(endAngle)
    const x1Inner = cx + ir * Math.cos(endAngle)
    const y1Inner = cy + ir * Math.sin(endAngle)
    const x2Inner = cx + ir * Math.cos(startAngle)
    const y2Inner = cy + ir * Math.sin(startAngle)

    const largeArc = angle > Math.PI ? 1 : 0
    const color = item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]

    // For a full circle (100%), draw two half circles
    if (fraction >= 0.9999) {
      return {
        path: `
          M ${cx} ${cy - r}
          A ${r} ${r} 0 1 1 ${cx} ${cy + r}
          A ${r} ${r} 0 1 1 ${cx} ${cy - r}
          Z
          M ${cx} ${cy - ir}
          A ${ir} ${ir} 0 1 0 ${cx} ${cy + ir}
          A ${ir} ${ir} 0 1 0 ${cx} ${cy - ir}
          Z
        `,
        color,
        label: item.label,
        value: item.value,
        percentage: (fraction * 100).toFixed(1),
      }
    }

    return {
      path: `
        M ${x1Outer} ${y1Outer}
        A ${r} ${r} 0 ${largeArc} 1 ${x2Outer} ${y2Outer}
        L ${x1Inner} ${y1Inner}
        A ${ir} ${ir} 0 ${largeArc} 0 ${x2Inner} ${y2Inner}
        Z
      `,
      color,
      label: item.label,
      value: item.value,
      percentage: (fraction * 100).toFixed(1),
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center">
          <svg
            viewBox="0 0 200 200"
            className="w-48 h-48"
            style={{ overflow: "visible" }}
          >
            {arcs.map((arc, index) => (
              <path
                key={index}
                d={arc.path}
                fill={arc.color}
                className="transition-all duration-200 cursor-default"
                style={{
                  opacity: hoveredIndex !== null && hoveredIndex !== index ? 0.5 : 1,
                }}
                fillRule="evenodd"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            ))}
            {/* Center text */}
            <text
              x={cx}
              y={cy - 6}
              textAnchor="middle"
              className="text-[10px] fill-gray-400"
            >
              Total
            </text>
            <text
              x={cx}
              y={cy + 10}
              textAnchor="middle"
              className="text-[16px] font-bold fill-gray-900"
            >
              {formatValue(total)}
            </text>
          </svg>
        </div>

        {/* Tooltip for hovered segment */}
        {hoveredIndex !== null && arcs[hoveredIndex] && (
          <div className="mt-3 text-center">
            <span className="text-sm font-medium">
              {arcs[hoveredIndex].label}
            </span>
            <span className="text-sm text-muted-foreground">
              {" "}
              - {formatValue(arcs[hoveredIndex].value)} (
              {arcs[hoveredIndex].percentage}%)
            </span>
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
          {data.map((item, index) => {
            const color =
              item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
            const percentage =
              total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0"

            return (
              <div
                key={item.label}
                className={cn(
                  "flex items-center gap-2 cursor-default transition-opacity",
                  hoveredIndex !== null && hoveredIndex !== index
                    ? "opacity-50"
                    : "opacity-100"
                )}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-muted-foreground truncate">
                  {item.label}
                </span>
                <span className="text-xs text-muted-foreground ml-auto shrink-0">
                  {percentage}%
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
