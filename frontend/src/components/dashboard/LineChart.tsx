"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import type { TimeSeriesPoint, ForecastPoint } from "@/types/dashboard"

const TREND_COLORS = {
  leads: "#3B82F6",
  deals: "#10B981",
  won_deals: "#F59E0B",
}

const FORECAST_COLORS = {
  forecasted: "#8B5CF6",
  actual: "#10B981",
}

function formatValue(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return (value / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M"
  }
  if (Math.abs(value) >= 1_000) {
    return (value / 1_000).toFixed(1).replace(/\.0$/, "") + "K"
  }
  return value.toLocaleString()
}

function formatDateLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  } catch {
    return dateStr
  }
}

interface LineChartProps {
  data: TimeSeriesPoint[] | ForecastPoint[]
  title: string
  type: "trend" | "forecast"
}

interface TooltipState {
  visible: boolean
  index: number
  x: number
  y: number
}

export default function LineChart({ data, title, type }: LineChartProps) {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    index: 0,
    x: 0,
    y: 0,
  })

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null

    const padding = { top: 20, right: 20, bottom: 30, left: 50 }
    const width = 500
    const height = 240
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    if (type === "trend") {
      const trendData = data as TimeSeriesPoint[]
      const allValues = trendData.flatMap((d) => [d.leads, d.deals, d.won_deals])
      const maxVal = Math.max(...allValues, 1)
      const minVal = 0

      const xStep = trendData.length > 1 ? chartWidth / (trendData.length - 1) : chartWidth / 2

      const seriesConfig = [
        { key: "leads" as const, color: TREND_COLORS.leads, label: "Leads" },
        { key: "deals" as const, color: TREND_COLORS.deals, label: "Deals" },
        { key: "won_deals" as const, color: TREND_COLORS.won_deals, label: "Won Deals" },
      ]

      const series = seriesConfig.map(({ key, color, label }) => {
        const points = trendData.map((d, i) => {
          const x = padding.left + (trendData.length > 1 ? i * xStep : chartWidth / 2)
          const y = padding.top + chartHeight - ((d[key] - minVal) / (maxVal - minVal || 1)) * chartHeight
          return { x, y, value: d[key] }
        })

        // Smooth curve path using cardinal spline approximation
        let path = `M ${points[0].x} ${points[0].y}`
        if (points.length === 1) {
          // Single point - just a dot
        } else if (points.length === 2) {
          path += ` L ${points[1].x} ${points[1].y}`
        } else {
          for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[Math.max(0, i - 1)]
            const p1 = points[i]
            const p2 = points[i + 1]
            const p3 = points[Math.min(points.length - 1, i + 2)]

            const cp1x = p1.x + (p2.x - p0.x) / 6
            const cp1y = p1.y + (p2.y - p0.y) / 6
            const cp2x = p2.x - (p3.x - p1.x) / 6
            const cp2y = p2.y - (p3.y - p1.y) / 6

            path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
          }
        }

        return { key, color, label, points, path }
      })

      const labels = trendData.map((d) => formatDateLabel(d.date))
      const xPositions = trendData.map((_, i) =>
        padding.left + (trendData.length > 1 ? i * xStep : chartWidth / 2)
      )

      return {
        width,
        height,
        padding,
        chartWidth,
        chartHeight,
        maxVal,
        series,
        labels,
        xPositions,
        dataPoints: trendData,
      }
    }

    // Forecast type
    const forecastData = data as ForecastPoint[]
    const allValues = forecastData.flatMap((d) => [
      d.forecasted,
      d.actual ?? 0,
    ])
    const maxVal = Math.max(...allValues, 1)
    const minVal = 0

    const xStep = forecastData.length > 1 ? chartWidth / (forecastData.length - 1) : chartWidth / 2

    const seriesConfig = [
      {
        key: "forecasted" as const,
        color: FORECAST_COLORS.forecasted,
        label: "Forecasted",
      },
      {
        key: "actual" as const,
        color: FORECAST_COLORS.actual,
        label: "Actual",
      },
    ]

    const series = seriesConfig.map(({ key, color, label }) => {
      const filteredPoints: { x: number; y: number; value: number; originalIndex: number }[] = []

      forecastData.forEach((d, i) => {
        const val = d[key]
        if (val != null && val !== 0) {
          const x = padding.left + (forecastData.length > 1 ? i * xStep : chartWidth / 2)
          const y = padding.top + chartHeight - ((val - minVal) / (maxVal - minVal || 1)) * chartHeight
          filteredPoints.push({ x, y, value: val, originalIndex: i })
        }
      })

      let path = ""
      if (filteredPoints.length > 0) {
        path = `M ${filteredPoints[0].x} ${filteredPoints[0].y}`
        if (filteredPoints.length === 2) {
          path += ` L ${filteredPoints[1].x} ${filteredPoints[1].y}`
        } else if (filteredPoints.length > 2) {
          for (let i = 0; i < filteredPoints.length - 1; i++) {
            const p0 = filteredPoints[Math.max(0, i - 1)]
            const p1 = filteredPoints[i]
            const p2 = filteredPoints[i + 1]
            const p3 = filteredPoints[Math.min(filteredPoints.length - 1, i + 2)]

            const cp1x = p1.x + (p2.x - p0.x) / 6
            const cp1y = p1.y + (p2.y - p0.y) / 6
            const cp2x = p2.x - (p3.x - p1.x) / 6
            const cp2y = p2.y - (p3.y - p1.y) / 6

            path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
          }
        }
      }

      // Map points back to full array indices for tooltip alignment
      const allPoints = forecastData.map((d, i) => {
        const val = d[key]
        const x = padding.left + (forecastData.length > 1 ? i * xStep : chartWidth / 2)
        const y = val != null && val !== 0
          ? padding.top + chartHeight - ((val - minVal) / (maxVal - minVal || 1)) * chartHeight
          : null
        return { x, y, value: val ?? 0 }
      })

      return { key, color, label, points: allPoints, path }
    })

    const labels = forecastData.map((d) => d.month)
    const xPositions = forecastData.map((_, i) =>
      padding.left + (forecastData.length > 1 ? i * xStep : chartWidth / 2)
    )

    return {
      width,
      height,
      padding,
      chartWidth,
      chartHeight,
      maxVal,
      series,
      labels,
      xPositions,
      dataPoints: forecastData,
    }
  }, [data, type])

  if (!data || data.length === 0 || !chartData) {
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

  const { width, height, padding, chartHeight, maxVal, series, labels, xPositions } = chartData

  // Y-axis grid lines
  const gridLineCount = 4
  const gridLines = Array.from({ length: gridLineCount + 1 }, (_, i) => {
    const fraction = i / gridLineCount
    const y = padding.top + chartHeight - fraction * chartHeight
    const value = Math.round((maxVal * fraction))
    return { y, value }
  })

  // Determine label thinning for X axis
  const maxLabels = 8
  const labelStep = Math.ceil(labels.length / maxLabels)

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const mouseX = ((e.clientX - rect.left) / rect.width) * width

    // Find nearest data point
    let nearestIndex = 0
    let nearestDist = Infinity
    xPositions.forEach((x, i) => {
      const dist = Math.abs(mouseX - x)
      if (dist < nearestDist) {
        nearestDist = dist
        nearestIndex = i
      }
    })

    if (nearestDist < 30) {
      setTooltip({
        visible: true,
        index: nearestIndex,
        x: e.clientX,
        y: e.clientY,
      })
    } else {
      setTooltip((prev) => ({ ...prev, visible: false }))
    }
  }

  function handleMouseLeave() {
    setTooltip((prev) => ({ ...prev, visible: false }))
  }

  const tooltipData =
    tooltip.visible && type === "trend"
      ? (chartData.dataPoints as TimeSeriesPoint[])[tooltip.index]
      : tooltip.visible && type === "forecast"
      ? (chartData.dataPoints as ForecastPoint[])[tooltip.index]
      : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Grid lines and Y labels */}
          {gridLines.map((line, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={line.y}
                x2={width - padding.right}
                y2={line.y}
                stroke="#F3F4F6"
                strokeWidth={1}
              />
              <text
                x={padding.left - 8}
                y={line.y + 3}
                textAnchor="end"
                className="text-[9px] fill-gray-400"
              >
                {formatValue(line.value)}
              </text>
            </g>
          ))}

          {/* Series lines */}
          {series.map((s) =>
            s.path ? (
              <path
                key={s.key}
                d={s.path}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null
          )}

          {/* Data points */}
          {series.map((s) =>
            s.points.map((p, i) =>
              p.y != null ? (
                <circle
                  key={`${s.key}-${i}`}
                  cx={p.x}
                  cy={p.y}
                  r={tooltip.visible && tooltip.index === i ? 4 : 2.5}
                  fill={s.color}
                  stroke="white"
                  strokeWidth={1.5}
                  className="transition-all duration-150"
                />
              ) : null
            )
          )}

          {/* Hover vertical line */}
          {tooltip.visible && (
            <line
              x1={xPositions[tooltip.index]}
              y1={padding.top}
              x2={xPositions[tooltip.index]}
              y2={padding.top + chartHeight}
              stroke="#D1D5DB"
              strokeWidth={1}
              strokeDasharray="4 2"
            />
          )}

          {/* X-axis labels */}
          {labels.map((label, i) => {
            if (i % labelStep !== 0 && i !== labels.length - 1) return null
            return (
              <text
                key={i}
                x={xPositions[i]}
                y={height - 4}
                textAnchor="middle"
                className="text-[9px] fill-gray-500"
              >
                {label}
              </text>
            )
          })}
        </svg>

        {/* Legend */}
        <div className="mt-3 flex items-center gap-4 justify-center flex-wrap">
          {series.map((s) => (
            <div key={s.key} className="flex items-center gap-1.5">
              <div
                className="w-3 h-0.5 rounded"
                style={{ backgroundColor: s.color }}
              />
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-[11px] text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Tooltip */}
        {tooltip.visible && tooltipData && (
          <div
            className="fixed z-50 px-3 py-2 bg-foreground text-white text-xs rounded-md shadow-lg pointer-events-none"
            style={{
              left: tooltip.x + 12,
              top: tooltip.y - 12,
              transform: "translateY(-100%)",
            }}
          >
            {type === "trend" && (
              <>
                <div className="font-medium mb-1">
                  {formatDateLabel((tooltipData as TimeSeriesPoint).date)}
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: TREND_COLORS.leads }}
                  />
                  Leads: {(tooltipData as TimeSeriesPoint).leads}
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: TREND_COLORS.deals }}
                  />
                  Deals: {(tooltipData as TimeSeriesPoint).deals}
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: TREND_COLORS.won_deals }}
                  />
                  Won: {(tooltipData as TimeSeriesPoint).won_deals}
                </div>
              </>
            )}
            {type === "forecast" && (
              <>
                <div className="font-medium mb-1">
                  {(tooltipData as ForecastPoint).month}
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: FORECAST_COLORS.forecasted }}
                  />
                  Forecasted:{" "}
                  {formatValue((tooltipData as ForecastPoint).forecasted)}
                </div>
                {(tooltipData as ForecastPoint).actual != null && (
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: FORECAST_COLORS.actual }}
                    />
                    Actual:{" "}
                    {formatValue((tooltipData as ForecastPoint).actual)}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
