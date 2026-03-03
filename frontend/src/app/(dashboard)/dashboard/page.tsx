"use client"

import { useState } from "react"
import { Download, RefreshCw, AlertCircle } from "lucide-react"
import { format, subDays } from "date-fns"
import { useDashboard } from "@/hooks/useDashboard"
import type { DashboardFilters } from "@/types/dashboard"
import NumberCard from "@/components/dashboard/NumberCard"
import OverviewChart from "@/components/dashboard/OverviewChart"
import RecentDeals from "@/components/dashboard/RecentDeals"
import BarChart from "@/components/dashboard/BarChart"
import DonutChart from "@/components/dashboard/DonutChart"
import LineChart from "@/components/dashboard/LineChart"
import DateRangePicker from "@/components/dashboard/DateRangePicker"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

function toDateString(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

function NumberCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-7 w-28 mb-2" />
        <Skeleton className="h-3 w-36" />
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

  const totalDeals = data?.number_cards?.find(
    (c) => c.title.toLowerCase().includes("deal")
  )

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      {/* Page Header */}
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
            title="Refresh data"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <Button size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium">Failed to load dashboard data</p>
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

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Loading State */}
          {isLoading && !data && (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <NumberCardSkeleton key={i} />
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <Skeleton className="h-5 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-[350px] w-full" />
                  </CardContent>
                </Card>
                <Card className="col-span-3">
                  <CardHeader>
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-4 w-44 mt-1" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center">
                          <Skeleton className="h-9 w-9 rounded-full" />
                          <div className="ml-4 space-y-1">
                            <Skeleton className="h-4 w-[120px]" />
                            <Skeleton className="h-3 w-[160px]" />
                          </div>
                          <Skeleton className="ml-auto h-4 w-[80px]" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Data Content */}
          {data && (
            <>
              {/* Number Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {data.number_cards.length > 0 ? (
                  data.number_cards.map((card) => (
                    <NumberCard key={card.title} data={card} />
                  ))
                ) : (
                  Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          No Data
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">--</div>
                        <p className="text-xs text-muted-foreground">
                          No data for selected period
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Overview Chart + Recent Deals */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <OverviewChart data={data.charts.sales_pipeline} />
                  </CardContent>
                </Card>
                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Recent Deals</CardTitle>
                    <CardDescription>
                      {totalDeals
                        ? `${totalDeals.value} deals this period.`
                        : "Your latest deals."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RecentDeals />
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Empty state */}
          {!isLoading && !isError && data && data.number_cards.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <h3 className="text-base font-semibold mb-1">No dashboard data</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                There is no data available for the selected date range.
                Try adjusting the date range or create some leads and deals first.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          {isLoading && !data && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-56 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {data && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <LineChart
                  data={data.charts.sales_trend}
                  title="Sales Trend"
                  type="trend"
                />
                <DonutChart
                  data={data.charts.leads_by_source}
                  title="Leads by Source"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <BarChart
                  data={data.charts.funnel_conversion}
                  title="Funnel Conversion"
                  horizontal
                />
                <DonutChart
                  data={data.charts.deals_by_source}
                  title="Deals by Source"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <LineChart
                  data={data.charts.forecasted_revenue}
                  title="Forecasted Revenue"
                  type="forecast"
                />
                <BarChart
                  data={data.charts.deals_by_salesperson}
                  title="Deals by Salesperson"
                  showValue2
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <BarChart
                  data={data.charts.lost_deal_reasons}
                  title="Lost Deal Reasons"
                  horizontal
                />
                <BarChart
                  data={data.charts.deals_by_territory}
                  title="Deals by Territory"
                  showValue2
                />
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
