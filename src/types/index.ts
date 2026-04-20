export type Screen = 'overview' | 'orders' | 'products' | 'customers' | 'trends'
export type DateRange = '7d' | '30d' | '90d' | 'all'

export interface Order {
  id: string
  date: string
  customer: string
  customerId: string
  product: string
  productId: string
  qty: number
  revenue: number
  cost: number
  profit: number
  margin: number
  status: 'Fulfilled' | 'Pending' | 'Cancelled'
  channel: string
}

export interface SummaryData {
  totalRevenue: number
  totalProfit: number
  avgMargin: number
  orderCount: number
  aov: number
  revDelta: number
  profitDelta: number
  marginDelta: number
  ordersDelta: number
  aovDelta: number
  missingColumns: string[]
  source: string
}

export interface ProductStat {
  name: string
  units: number
  revenue: number
  cost: number
  profit: number
  avgMargin: number
}

export interface CustomerStat {
  name: string
  type: 'new' | 'repeat'
  totalOrders: number
  totalRevenue: number
  totalProfit: number
  lastPurchase: string
}

export interface TimeSeriesEntry {
  date: string
  revenue: number
  profit: number
  isAnomaly?: boolean
  anomalyType?: 'spike' | 'drop' | null
  n?: number
}

export interface Anomaly {
  date: string
  type: 'spike' | 'drop'
  value: number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface DataContext {
  totalRevenue: number
  totalProfit: number
  avgMargin: number
  topProducts: Array<{ name: string; revenue: number; margin: number }>
  topCustomers: Array<{ name: string; revenue: number; orders: number }>
  recentTrend: 'up' | 'down' | 'flat'
  dateRange: string
  orderCount: number
  anomalies: Array<{ date: string; type: 'spike' | 'drop' }>
}
