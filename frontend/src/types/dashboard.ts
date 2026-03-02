export interface NumberCardData {
  title: string
  value: number
  previous_value: number
  delta: number
  prefix: string
  suffix: string
  negative_is_better: boolean
}

export interface ChartDataPoint {
  label: string
  value: number
  value2?: number | null
  color?: string | null
}

export interface TimeSeriesPoint {
  date: string
  leads: number
  deals: number
  won_deals: number
}

export interface ForecastPoint {
  month: string
  forecasted: number
  actual: number
}

export interface DashboardData {
  number_cards: NumberCardData[]
  charts: {
    sales_pipeline: ChartDataPoint[]
    leads_by_source: ChartDataPoint[]
    deals_by_source: ChartDataPoint[]
    funnel_conversion: ChartDataPoint[]
    deals_by_territory: ChartDataPoint[]
    deals_by_salesperson: ChartDataPoint[]
    lost_deal_reasons: ChartDataPoint[]
    sales_trend: TimeSeriesPoint[]
    forecasted_revenue: ForecastPoint[]
  }
}

export interface DashboardFilters {
  from_date: string
  to_date: string
}
