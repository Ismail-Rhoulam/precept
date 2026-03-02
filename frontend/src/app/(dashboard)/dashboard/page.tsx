"use client"

import { useState } from "react"
import { LayoutDashboard, Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { format, subDays } from "date-fns"
import { useDashboard } from "@/hooks/useDashboard"
import type { DashboardFilters } from "@/types/dashboard"
import NumberCard from "@/components/dashboard/NumberCard"
import BarChart from "@/components/dashboard/BarChart"
import DonutChart from "@/components/dashboard/DonutChart"
import LineChart from "@/components/dashboard/LineChart"
import DateRangePicker from "@/components/dashboard/DateRangePicker"

function toDateString(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

function NumberCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
      <div className="h-7 bg-gray-200 rounded w-16 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-32" />
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm animate-pulse">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="h-4 bg-gray-200 rounded w-32" />
      </div>
      <div className="p-5">
        <div className="h-56 bg-gray-100 rounded" />
      </div>
    </div>
  )
}

function ChartSkeletonWide() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm animate-pulse">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="h-4 bg-gray-200 rounded w-48" />
      </div>
      <div className="p-5">
        <div className="h-56 bg-gray-100 rounded" />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const today = new Date()
  const [dateRange, setDateRange] = useState({
    from: toDateString(subDays(today, 30)),
    to: toDateString(today),
  })

  const filters: DashboardFilters = {
    from_date: dateRange.from,
    to_date: dateRange.to,
  }

  const { data, isLoading, isError, error, refetch } = useDashboard(filters)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-7 w-7 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">
              Overview of your sales performance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">
              Failed to load dashboard data
            </p>
            <p className="text-sm text-red-600 mt-1">
              {error instanceof Error
                ? error.message
                : "An unexpected error occurred. Please try again."}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-2 text-sm font-medium text-red-700 hover:text-red-800 underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading state with full-page spinner overlay */}
      {isLoading && !data && (
        <>
          {/* Number Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <NumberCardSkeleton key={i} />
            ))}
          </div>

          {/* Charts Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
          <ChartSkeletonWide />
        </>
      )}

      {/* Dashboard Content */}
      {data && (
        <>
          {/* Number Cards */}
          {data.number_cards && data.number_cards.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.number_cards.map((card) => (
                <NumberCard key={card.title} data={card} />
              ))}
            </div>
          )}

          {/* Charts Grid - Row 1: Sales Pipeline + Leads by Source */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BarChart
              data={data.charts.sales_pipeline}
              title="Sales Pipeline"
            />
            <DonutChart
              data={data.charts.leads_by_source}
              title="Leads by Source"
            />
          </div>

          {/* Charts Grid - Row 2: Sales Trend + Deals by Source */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LineChart
              data={data.charts.sales_trend}
              title="Sales Trend"
              type="trend"
            />
            <DonutChart
              data={data.charts.deals_by_source}
              title="Deals by Source"
            />
          </div>

          {/* Charts Grid - Row 3: Funnel Conversion + Forecasted Revenue */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BarChart
              data={data.charts.funnel_conversion}
              title="Funnel Conversion"
              horizontal
            />
            <LineChart
              data={data.charts.forecasted_revenue}
              title="Forecasted Revenue"
              type="forecast"
            />
          </div>

          {/* Charts Grid - Row 4: Deals by Salesperson + Lost Deal Reasons */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BarChart
              data={data.charts.deals_by_salesperson}
              title="Deals by Salesperson"
              showValue2
            />
            <BarChart
              data={data.charts.lost_deal_reasons}
              title="Lost Deal Reasons"
              horizontal
            />
          </div>

          {/* Charts Grid - Row 5: Deals by Territory (full width) */}
          <div className="grid grid-cols-1 gap-6">
            <BarChart
              data={data.charts.deals_by_territory}
              title="Deals by Territory"
              showValue2
            />
          </div>
        </>
      )}

      {/* Empty state when no data and not loading */}
      {!isLoading && !isError && data && data.number_cards.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <LayoutDashboard className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            No dashboard data
          </h3>
          <p className="text-sm text-gray-500 text-center max-w-sm">
            There is no data available for the selected date range. Try
            adjusting the date range or create some leads and deals first.
          </p>
        </div>
      )}
    </div>
  )
}
