"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
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

interface BarChartProps {
  data: ChartDataPoint[]
  title: string
  horizontal?: boolean
  showValue2?: boolean
}

interface TooltipState {
  visible: boolean
  x: number
  y: number
  label: string
  value: number
  value2?: number | null
}

export default function BarChart({
  data,
  title,
  horizontal = false,
  showValue2 = false,
}: BarChartProps) {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    label: "",
    value: 0,
  })

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="flex items-center justify-center h-64 text-sm text-gray-400">
          No data available
        </div>
      </div>
    )
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1)
  const maxValue2 =
    showValue2 && data.some((d) => d.value2 != null)
      ? Math.max(...data.map((d) => d.value2 ?? 0), 1)
      : 0

  function handleMouseEnter(
    e: React.MouseEvent,
    item: ChartDataPoint
  ) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      label: item.label,
      value: item.value,
      value2: item.value2,
    })
  }

  function handleMouseLeave() {
    setTooltip((prev) => ({ ...prev, visible: false }))
  }

  if (horizontal) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="p-5 space-y-3">
          {data.map((item, index) => {
            const percentage = (item.value / maxValue) * 100
            const color = item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]

            return (
              <div
                key={item.label}
                className="group cursor-default"
                onMouseEnter={(e) => handleMouseEnter(e, item)}
                onMouseLeave={handleMouseLeave}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600 truncate max-w-[60%]">
                    {item.label}
                  </span>
                  <span className="text-xs font-semibold text-gray-900">
                    {formatValue(item.value)}
                  </span>
                </div>
                <div className="h-6 bg-gray-100 rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all duration-500 ease-out group-hover:opacity-80"
                    style={{
                      width: `${Math.max(percentage, 2)}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
        {tooltip.visible && (
          <div
            className="fixed z-50 px-3 py-2 bg-gray-900 text-white text-xs rounded-md shadow-lg pointer-events-none"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="font-medium">{tooltip.label}</div>
            <div>{formatValue(tooltip.value)}</div>
            {tooltip.value2 != null && (
              <div className="text-gray-300">
                Secondary: {formatValue(tooltip.value2)}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Vertical bar chart
  const barWidth = Math.max(12, Math.min(48, 280 / data.length))

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="p-5 relative">
        {/* Y-axis labels */}
        <div className="flex h-56">
          <div className="flex flex-col justify-between pr-2 text-right w-12 shrink-0">
            {[4, 3, 2, 1, 0].map((i) => (
              <span key={i} className="text-[10px] text-gray-400">
                {formatValue(Math.round((maxValue / 4) * i))}
              </span>
            ))}
          </div>

          {/* Chart area */}
          <div className="flex-1 relative">
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="absolute left-0 right-0 border-t border-gray-100"
                style={{ top: `${(i / 4) * 100}%` }}
              />
            ))}

            {/* Bars */}
            <div className="relative h-full flex items-end justify-around px-1">
              {data.map((item, index) => {
                const height = (item.value / maxValue) * 100
                const color =
                  item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]

                return (
                  <div
                    key={item.label}
                    className="flex flex-col items-center gap-1 group relative"
                    style={{ width: barWidth }}
                    onMouseEnter={(e) => handleMouseEnter(e, item)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {/* Value2 line marker */}
                    {showValue2 && item.value2 != null && maxValue2 > 0 && (
                      <div
                        className="absolute w-3 h-3 rounded-full border-2 border-white shadow-sm z-10"
                        style={{
                          backgroundColor: "#EF4444",
                          bottom: `${(item.value2 / maxValue2) * 100}%`,
                          transform: "translateY(50%)",
                        }}
                      />
                    )}
                    <div
                      className="w-full rounded-t transition-all duration-500 ease-out group-hover:opacity-80 cursor-default"
                      style={{
                        height: `${Math.max(height, 1)}%`,
                        backgroundColor: color,
                        minWidth: 8,
                      }}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* X-axis labels */}
        <div className="flex ml-12 mt-2">
          <div className="flex-1 flex justify-around px-1">
            {data.map((item) => (
              <span
                key={item.label}
                className="text-[10px] text-gray-500 text-center truncate"
                style={{ width: barWidth, maxWidth: barWidth + 16 }}
                title={item.label}
              >
                {item.label}
              </span>
            ))}
          </div>
        </div>

        {/* Value2 legend */}
        {showValue2 && data.some((d) => d.value2 != null) && (
          <div className="mt-3 flex items-center gap-4 justify-center">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-blue-500" />
              <span className="text-[10px] text-gray-500">Value</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-[10px] text-gray-500">Count</span>
            </div>
          </div>
        )}

        {tooltip.visible && (
          <div
            className="fixed z-50 px-3 py-2 bg-gray-900 text-white text-xs rounded-md shadow-lg pointer-events-none"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="font-medium">{tooltip.label}</div>
            <div>{formatValue(tooltip.value)}</div>
            {tooltip.value2 != null && (
              <div className="text-gray-300">
                Count: {formatValue(tooltip.value2)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
