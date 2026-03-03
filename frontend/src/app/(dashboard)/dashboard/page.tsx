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
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

function toDateString(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

function NumberCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-7 w-16 mb-2" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  )
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-56 w-full" />
      </CardContent>
    </Card>
  )
}

function ChartSkeletonWide() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-56 w-full" />
      </CardContent>
    </Card>
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
          <LayoutDashboard className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Overview of your sales performance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium">
              Failed to load dashboard data
            </p>
            <p className="mt-1">
              {error instanceof Error
                ? error.message
                : "An unexpected error occurred. Please try again."}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-2 text-sm font-medium underline"
            >
              Retry
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading state with skeleton */}
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
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <LayoutDashboard className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold mb-1">
            No dashboard data
          </h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            There is no data available for the selected date range. Try
            adjusting the date range or create some leads and deals first.
          </p>
        </div>
      )}
    </div>
  )
}
