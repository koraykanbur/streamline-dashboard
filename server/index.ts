import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { fetchSheetData, invalidateCache } from './lib/sheets.js'
import { SAMPLE_TIME_SERIES, SAMPLE_ORDERS, PRODUCTS, CUSTOMERS } from './lib/sampleData.js'
import { generateInsights, chat, DataContext } from './lib/claude.js'
import type { Order } from './lib/sampleData.js'

const app = express()
const PORT = process.env.PORT || 3001

const ALLOWED_ORIGINS = [
  /^https?:\/\/localhost(:\d+)?$/,          // any localhost port
  /^https:\/\/[\w-]+\.vercel\.app$/,        // *.vercel.app
  ...(process.env.CORS_ORIGIN
    ? [new RegExp(`^${process.env.CORS_ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`)]
    : []),
]

app.use(cors({
  origin: (origin, cb) => {
    // Allow server-to-server (no Origin header) and matched origins
    if (!origin || ALLOWED_ORIGINS.some(r => r.test(origin))) return cb(null, true)
    cb(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}))
app.use(express.json())

const aiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many AI requests, please wait a moment.' },
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function useSampleData() {
  return process.env.USE_SAMPLE_DATA === 'true' ||
    (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_SHEETS_API_KEY)
}

async function getOrders(): Promise<{ orders: Order[]; missingColumns: string[]; source: string }> {
  if (useSampleData()) {
    return { orders: SAMPLE_ORDERS, missingColumns: [], source: 'sample' }
  }
  try {
    const data = await fetchSheetData()
    return data
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Sheets fetch error, falling back to sample data:', msg)
    return { orders: SAMPLE_ORDERS, missingColumns: [], source: 'sample' }
  }
}

function filterByDateRange(orders: Order[], range: string): Order[] {
  if (!range || range === 'all') return orders
  const days = parseInt(range)
  if (isNaN(days)) return orders
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffStr = cutoff.toISOString().split('T')[0]
  return orders.filter(o => o.date >= cutoffStr)
}

function computeKPIs(current: Order[], previous: Order[]) {
  const sum = (arr: Order[], k: keyof Order) => arr.reduce((s, o) => s + (Number(o[k]) || 0), 0)
  const rev = sum(current, 'revenue')
  const profit = sum(current, 'profit')
  const prevRev = sum(previous, 'revenue')
  const prevProfit = sum(previous, 'profit')
  const count = current.length
  const prevCount = previous.length
  const pct = (a: number, b: number) => b > 0 ? Math.round(((a - b) / b) * 1000) / 10 : 0
  return {
    totalRevenue: Math.round(rev * 100) / 100,
    totalProfit: Math.round(profit * 100) / 100,
    avgMargin: rev > 0 ? Math.round((profit / rev) * 1000) / 10 : 0,
    orderCount: count,
    aov: count > 0 ? Math.round((rev / count) * 100) / 100 : 0,
    revDelta: pct(rev, prevRev),
    profitDelta: pct(profit, prevProfit),
    marginDelta: 0,
    ordersDelta: pct(count, prevCount),
    aovDelta: 0,
  }
}

function buildDataContext(orders: Order[], timeSeries: typeof SAMPLE_TIME_SERIES): DataContext {
  const productMap: Record<string, { revenue: number; profit: number; orders: number }> = {}
  const customerMap: Record<string, { revenue: number; orders: number }> = {}

  orders.forEach(o => {
    if (!productMap[o.product]) productMap[o.product] = { revenue: 0, profit: 0, orders: 0 }
    productMap[o.product].revenue += o.revenue
    productMap[o.product].profit += o.profit
    productMap[o.product].orders++

    if (!customerMap[o.customer]) customerMap[o.customer] = { revenue: 0, orders: 0 }
    customerMap[o.customer].revenue += o.revenue
    customerMap[o.customer].orders++
  })

  const topProducts = Object.entries(productMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)
    .map(([name, s]) => ({
      name,
      revenue: Math.round(s.revenue * 100) / 100,
      margin: s.revenue > 0 ? Math.round((s.profit / s.revenue) * 1000) / 10 : 0,
    }))

  const topCustomers = Object.entries(customerMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)
    .map(([name, s]) => ({
      name,
      revenue: Math.round(s.revenue * 100) / 100,
      orders: s.orders,
    }))

  const recent = timeSeries.slice(-7)
  const prev = timeSeries.slice(-14, -7)
  const recentAvg = recent.reduce((s, d) => s + d.revenue, 0) / 7
  const prevAvg = prev.reduce((s, d) => s + d.revenue, 0) / 7
  const recentTrend: 'up' | 'down' | 'flat' =
    recentAvg > prevAvg * 1.05 ? 'up' : recentAvg < prevAvg * 0.95 ? 'down' : 'flat'

  const anomalies = timeSeries.filter(d => d.isAnomaly).map(d => ({
    date: d.date,
    type: d.anomalyType as 'spike' | 'drop',
  }))

  const totalRevenue = orders.reduce((s, o) => s + o.revenue, 0)
  const totalProfit = orders.reduce((s, o) => s + o.profit, 0)

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalProfit: Math.round(totalProfit * 100) / 100,
    avgMargin: totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 1000) / 10 : 0,
    topProducts,
    topCustomers,
    recentTrend,
    dateRange: 'last 30 days',
    orderCount: orders.length,
    anomalies,
  }
}

function aggregateTimeSeries(timeSeries: typeof SAMPLE_TIME_SERIES, mode: string) {
  if (mode === 'daily') return timeSeries

  const buckets: Record<string, { date: string; revenue: number; profit: number; n: number }> = {}
  timeSeries.forEach(d => {
    const dt = new Date(d.date + 'T00:00:00')
    let key: string
    if (mode === 'weekly') {
      const mon = new Date(dt)
      mon.setDate(dt.getDate() - dt.getDay() + 1)
      key = mon.toISOString().split('T')[0]
    } else {
      key = d.date.slice(0, 7)
    }
    if (!buckets[key]) buckets[key] = { date: key, revenue: 0, profit: 0, n: 0 }
    buckets[key].revenue += d.revenue
    buckets[key].profit += d.profit
    buckets[key].n++
  })

  return Object.values(buckets).sort((a, b) => a.date.localeCompare(b.date))
}

function detectAnomalies(timeSeries: typeof SAMPLE_TIME_SERIES) {
  const WINDOW = 14
  const anomalies: Array<{ date: string; type: 'spike' | 'drop'; value: number }> = []
  for (let i = WINDOW; i < timeSeries.length; i++) {
    const window = timeSeries.slice(i - WINDOW, i).map(d => d.revenue)
    const mean = window.reduce((s, v) => s + v, 0) / WINDOW
    const stdDev = Math.sqrt(window.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / WINDOW)
    const current = timeSeries[i].revenue
    if (stdDev > 0 && Math.abs(current - mean) > 2 * stdDev) {
      anomalies.push({ date: timeSeries[i].date, type: current > mean ? 'spike' : 'drop', value: current })
    }
  }
  return anomalies
}

function generateForecast(timeSeries: typeof SAMPLE_TIME_SERIES, days = 30) {
  const last = timeSeries.slice(-30)
  const n = last.length
  const sumX = last.reduce((s, _, i) => s + i, 0)
  const sumYRev = last.reduce((s, d) => s + d.revenue, 0)
  const sumYProfit = last.reduce((s, d) => s + d.profit, 0)
  const sumXY_Rev = last.reduce((s, d, i) => s + i * d.revenue, 0)
  const sumXY_Profit = last.reduce((s, d, i) => s + i * d.profit, 0)
  const sumX2 = last.reduce((s, _, i) => s + i * i, 0)
  const denom = n * sumX2 - sumX * sumX

  const slopeRev = denom !== 0 ? (n * sumXY_Rev - sumX * sumYRev) / denom : 0
  const interceptRev = (sumYRev - slopeRev * sumX) / n
  const slopeProfit = denom !== 0 ? (n * sumXY_Profit - sumX * sumYProfit) / denom : 0
  const interceptProfit = (sumYProfit - slopeProfit * sumX) / n

  const forecast = []
  const lastDate = new Date(timeSeries[timeSeries.length - 1].date + 'T00:00:00')
  for (let i = 1; i <= days; i++) {
    const d = new Date(lastDate)
    d.setDate(d.getDate() + i)
    forecast.push({
      date: d.toISOString().split('T')[0],
      revenue: Math.max(0, Math.round(interceptRev + slopeRev * (n + i))),
      profit: Math.max(0, Math.round(interceptProfit + slopeProfit * (n + i))),
    })
  }
  return forecast
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/summary
app.get('/api/summary', async (req, res) => {
  try {
    const { orders, missingColumns, source } = await getOrders()
    const range = String(req.query.range || '30')
    const days = parseInt(range)
    const current = filterByDateRange(orders, range)
    const previous = isNaN(days) ? [] : orders.filter(o => {
      const cutoffCurrent = new Date()
      cutoffCurrent.setDate(cutoffCurrent.getDate() - days)
      const cutoffPrevious = new Date()
      cutoffPrevious.setDate(cutoffPrevious.getDate() - days * 2)
      return o.date >= cutoffPrevious.toISOString().split('T')[0] &&
        o.date < cutoffCurrent.toISOString().split('T')[0]
    })

    const kpis = computeKPIs(current, previous)
    res.json({ ...kpis, missingColumns, source })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: msg })
  }
})

// GET /api/orders
app.get('/api/orders', async (req, res) => {
  try {
    const { orders, missingColumns, source } = await getOrders()
    const range = String(req.query.range || 'all')
    const search = String(req.query.search || '').toLowerCase()
    const status = String(req.query.status || '')
    const product = String(req.query.product || '')
    const channel = String(req.query.channel || '')
    const sortKey = String(req.query.sortKey || 'date')
    const sortDir = String(req.query.sortDir || 'desc')
    const page = Math.max(1, parseInt(String(req.query.page || '1')))
    const perPage = Math.min(100, Math.max(1, parseInt(String(req.query.perPage || '25'))))

    let filtered = filterByDateRange(orders, range)
    if (search) {
      filtered = filtered.filter(o =>
        o.id.toLowerCase().includes(search) ||
        o.customer.toLowerCase().includes(search) ||
        o.product.toLowerCase().includes(search)
      )
    }
    if (status && status !== 'All') filtered = filtered.filter(o => o.status === status)
    if (product && product !== 'All') filtered = filtered.filter(o => o.product === product)
    if (channel && channel !== 'All') filtered = filtered.filter(o => o.channel === channel)

    filtered.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'date') return a.date.localeCompare(b.date) * dir
      if (sortKey === 'revenue') return (a.revenue - b.revenue) * dir
      if (sortKey === 'profit') return (a.profit - b.profit) * dir
      if (sortKey === 'margin') return (a.margin - b.margin) * dir
      return 0
    })

    const total = filtered.length
    const paginated = filtered.slice((page - 1) * perPage, page * perPage)

    res.json({
      orders: paginated,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
      missingColumns,
      source,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: msg })
  }
})

// GET /api/products
app.get('/api/products', async (req, res) => {
  try {
    const { orders, source } = await getOrders()
    const range = String(req.query.range || 'all')
    const filtered = filterByDateRange(orders, range)

    const map: Record<string, { name: string; units: number; revenue: number; cost: number; profit: number }> = {}
    filtered.forEach(o => {
      if (!map[o.product]) map[o.product] = { name: o.product, units: 0, revenue: 0, cost: 0, profit: 0 }
      map[o.product].units += o.qty
      map[o.product].revenue += o.revenue
      map[o.product].cost += o.cost
      map[o.product].profit += o.profit
    })

    const products = Object.values(map)
      .map(p => ({
        ...p,
        revenue: Math.round(p.revenue * 100) / 100,
        cost: Math.round(p.cost * 100) / 100,
        profit: Math.round(p.profit * 100) / 100,
        avgMargin: p.revenue > 0 ? Math.round((p.profit / p.revenue) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)

    res.json({ products, source })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: msg })
  }
})

// GET /api/customers
app.get('/api/customers', async (req, res) => {
  try {
    const { orders, source } = await getOrders()
    const range = String(req.query.range || 'all')
    const filtered = filterByDateRange(orders, range)

    const map: Record<string, { name: string; totalOrders: number; totalRevenue: number; totalProfit: number; lastPurchase: string }> = {}
    filtered.forEach(o => {
      if (!map[o.customer]) map[o.customer] = { name: o.customer, totalOrders: 0, totalRevenue: 0, totalProfit: 0, lastPurchase: '' }
      map[o.customer].totalOrders++
      map[o.customer].totalRevenue += o.revenue
      map[o.customer].totalProfit += o.profit
      if (!map[o.customer].lastPurchase || o.date > map[o.customer].lastPurchase) {
        map[o.customer].lastPurchase = o.date
      }
    })

    // Merge with known customer types from CUSTOMERS list
    const customerTypeMap: Record<string, 'new' | 'repeat'> = {}
    CUSTOMERS.forEach(c => { customerTypeMap[c.name] = c.type })

    const customers = Object.values(map)
      .map(c => ({
        ...c,
        totalRevenue: Math.round(c.totalRevenue * 100) / 100,
        totalProfit: Math.round(c.totalProfit * 100) / 100,
        type: customerTypeMap[c.name] || 'new',
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)

    // Customer orders for expansion
    const customerOrders: Record<string, Order[]> = {}
    filtered.forEach(o => {
      if (!customerOrders[o.customer]) customerOrders[o.customer] = []
      customerOrders[o.customer].push(o)
    })

    const newCount = customers.filter(c => c.type === 'new').length
    const repeatCount = customers.filter(c => c.type === 'repeat').length

    res.json({ customers, customerOrders, newCount, repeatCount, source })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: msg })
  }
})

// GET /api/trends
app.get('/api/trends', async (req, res) => {
  try {
    const { orders, source } = await getOrders()
    const view = String(req.query.view || 'daily').toLowerCase()

    // Build daily time series from orders
    const dailyMap: Record<string, { revenue: number; profit: number }> = {}
    orders.forEach(o => {
      if (!dailyMap[o.date]) dailyMap[o.date] = { revenue: 0, profit: 0 }
      dailyMap[o.date].revenue += o.revenue
      dailyMap[o.date].profit += o.profit
    })

    // Fill with sample time series if using sample data (has more richness)
    const useBuiltInTs = useSampleData()
    const rawTimeSeries = useBuiltInTs
      ? SAMPLE_TIME_SERIES
      : Object.entries(dailyMap)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([date, d]) => ({ date, ...d, isAnomaly: false, anomalyType: null }))

    const aggregated = aggregateTimeSeries(rawTimeSeries, view)
    const forecast = generateForecast(rawTimeSeries, view === 'monthly' ? 90 : 30)
    const forecastAgg = aggregateTimeSeries(
      forecast.map(d => ({ ...d, isAnomaly: false, anomalyType: null })),
      view,
    )
    const anomalies = detectAnomalies(rawTimeSeries)

    // Channel breakdown (last 8 weeks)
    const weeklyAll = aggregateTimeSeries(rawTimeSeries, 'weekly').slice(-8)
    const channelBreakdown = weeklyAll.map(w => ({
      date: w.date,
      Direct: Math.round(w.revenue * 0.45),
      Marketplace: Math.round(w.revenue * 0.35),
      Wholesale: Math.round(w.revenue * 0.20),
    }))

    // Best period
    const bestWeek = weeklyAll.reduce((best: typeof weeklyAll[0] | null, w) =>
      !best || w.revenue > best.revenue ? w : best, null)

    res.json({ timeSeries: aggregated, forecast: forecastAgg, anomalies, channelBreakdown, bestWeek, source })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: msg })
  }
})

// GET /api/insights
app.get('/api/insights', aiRateLimit, async (req, res) => {
  try {
    const { orders } = await getOrders()
    const last30 = filterByDateRange(orders, '30')
    const context = buildDataContext(last30, SAMPLE_TIME_SERIES.slice(-30))
    const insights = await generateInsights(context)
    res.json({ insights })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: msg })
  }
})

// POST /api/chat
app.post('/api/chat', aiRateLimit, async (req, res) => {
  try {
    const { messages, dataContext } = req.body
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array required' })
    }

    let context: DataContext
    if (dataContext) {
      context = dataContext
    } else {
      const { orders } = await getOrders()
      const last30 = filterByDateRange(orders, '30')
      context = buildDataContext(last30, SAMPLE_TIME_SERIES.slice(-30))
    }

    const reply = await chat(messages, context)
    res.json({ reply })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: msg })
  }
})

// GET /api/sample
app.get('/api/sample', (_req, res) => {
  const last150 = SAMPLE_ORDERS.slice(0, 150)
  res.json({
    orders: last150,
    timeSeries: SAMPLE_TIME_SERIES,
    products: PRODUCTS,
    customers: CUSTOMERS,
    count: last150.length,
  })
})

// POST /api/refresh
app.post('/api/refresh', (_req, res) => {
  invalidateCache()
  res.json({ ok: true })
})

app.listen(PORT, () => {
  console.log(`Streamline API running on http://localhost:${PORT}`)
  if (useSampleData()) {
    console.log('Using built-in sample data (set GOOGLE_SHEET_ID + GOOGLE_SHEETS_API_KEY to use real data)')
  } else {
    console.log(`Fetching from Google Sheet: ${process.env.GOOGLE_SHEET_ID}`)
  }
})
