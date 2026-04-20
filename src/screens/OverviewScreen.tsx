import { useState, useEffect } from 'react'
import KpiCard from '../components/KpiCard'
import { Card, CardHeader } from '../components/Card'
import MissingDataBanner from '../components/MissingDataBanner'
import StatusPill from '../components/StatusPill'
import StreamlineLineChart from '../components/charts/StreamlineLineChart'
import { api } from '../lib/api'
import { fmt$, fmtDate, fmtShort } from '../lib/utils'
import { DateRange, Order, SummaryData, TimeSeriesEntry } from '../types'

interface ProductStat { name: string; revenue: number; units: number; avgMargin: number }

const RANGE_DAYS: Record<DateRange, number | null> = { '7d': 7, '30d': 30, '90d': 90, 'all': null }

function InsightsPanel() {
  const [insights, setInsights] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const { insights } = await api.insights()
      setInsights(insights)
      setLoaded(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load insights')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <Card>
      <CardHeader
        title="AI Insights"
        action={
          <button
            onClick={load}
            disabled={loading}
            style={{
              padding: '5px 10px', borderRadius: 6, border: '1px solid #E2E8F0',
              background: '#fff', cursor: loading ? 'default' : 'pointer', fontSize: 12,
              color: '#475569', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        }
      />
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading && !loaded && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94A3B8', fontSize: 13 }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #E2E8F0', borderTopColor: '#0D9488', animation: 'spin 0.8s linear infinite' }} />
            Generating insights from your data…
          </div>
        )}
        {error && (
          <div style={{ color: '#DC2626', fontSize: 13, padding: '8px 12px', background: '#FEF2F2', borderRadius: 6 }}>{error}</div>
        )}
        {insights.map((insight, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>
              {i === 0 ? '📈' : i === 1 ? '💡' : i === 2 ? '⚠️' : i === 3 ? '🎯' : '✨'}
            </span>
            <p style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.6, margin: 0 }}>{insight}</p>
          </div>
        ))}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Card>
  )
}

export default function OverviewScreen({ dateRange, refreshKey }: { dateRange: DateRange; refreshKey: number }) {
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [products, setProducts] = useState<ProductStat[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [timeSeries, setTimeSeries] = useState<TimeSeriesEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const range = dateRange === 'all' ? 'all' : dateRange.replace('d', '')
    Promise.all([
      api.summary(range),
      api.products(range),
      api.orders({ range, perPage: '8', sortKey: 'date', sortDir: 'desc' }),
      api.trends('daily'),
    ]).then(([s, p, o, t]) => {
      setSummary(s as unknown as SummaryData)
      setProducts((p as { products: ProductStat[] }).products.slice(0, 5))
      setOrders((o as { orders: Order[] }).orders)
      const ts = (t as { timeSeries: TimeSeriesEntry[] }).timeSeries
      const days = RANGE_DAYS[dateRange]
      setTimeSeries(days ? ts.slice(-days) : ts)
    }).catch(console.error).finally(() => setLoading(false))
  }, [dateRange, refreshKey])

  const chartData = timeSeries.map(d => ({
    date: fmtShort(d.date),
    Revenue: d.revenue,
    Profit: d.profit,
  }))

  const maxRev = products[0]?.revenue || 1

  if (loading && !summary) {
    return (
      <div style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <div style={{ color: '#94A3B8', fontSize: 14 }}>Loading overview…</div>
      </div>
    )
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {summary?.missingColumns?.length ? <MissingDataBanner columns={summary.missingColumns} /> : null}

      {/* KPI Row */}
      <div style={{ display: 'flex', gap: 16 }}>
        <KpiCard label="Total Revenue" value={summary?.totalRevenue ?? 0} prefix="$" delta={summary?.revDelta} icon="revenue" iconBg="#3B82F6" />
        <KpiCard label="Total Profit" value={summary?.totalProfit ?? 0} prefix="$" delta={summary?.profitDelta} icon="profit" iconBg="#10B981" />
        <KpiCard label="Profit Margin" value={summary?.avgMargin ?? 0} suffix="%" delta={summary?.marginDelta} icon="margin" iconBg="#F59E0B" />
        <KpiCard label="Total Orders" value={summary?.orderCount ?? 0} delta={summary?.ordersDelta} icon="orders" iconBg="#8B5CF6" prefix="" suffix="" />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'flex', gap: 16 }}>
        {/* Revenue Trend */}
        <Card style={{ flex: 3 }}>
          <div style={{ padding: '18px 20px 4px' }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#0F172A' }}>Revenue & Profit Trend</span>
          </div>
          <div style={{ padding: '8px 20px 20px' }}>
            <StreamlineLineChart
              data={chartData}
              xKey="date"
              series={[
                { key: 'Revenue', label: 'Revenue', color: '#4F46E5', fill: true },
                { key: 'Profit', label: 'Profit', color: '#0D9488' },
              ]}
              height={280}
            />
          </div>
        </Card>

        {/* Top Products */}
        <Card style={{ flex: 2 }}>
          <div style={{ padding: '18px 20px 12px' }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#0F172A' }}>Top Products by Revenue</span>
          </div>
          <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {products.map((p, i) => {
              const pct = Math.round((p.revenue / maxRev) * 100)
              return (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 100, fontSize: 12, color: '#64748B', textAlign: 'right', flexShrink: 0, fontWeight: 500, lineHeight: 1.3 }}>
                    {p.name}
                  </div>
                  <div style={{ flex: 1, height: 28, background: '#F1F5F9', borderRadius: 5, overflow: 'visible', position: 'relative' }}>
                    <div style={{
                      height: '100%', width: pct + '%', background: '#3B82F6',
                      borderRadius: 5, transition: 'width 0.6s ease',
                      opacity: 1 - i * 0.12,
                    }} />
                    <span style={{
                      position: 'absolute',
                      top: '50%', transform: 'translateY(-50%)',
                      fontSize: 11, fontWeight: 600,
                      ...(pct > 30
                        ? { right: `${100 - pct}%`, marginRight: 6, color: '#fff' }
                        : { left: `${pct}%`, marginLeft: 6, color: '#475569' }),
                    }}>
                      ${(p.revenue / 1000).toFixed(1)}k
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* AI Insights */}
      <InsightsPanel />

      {/* Recent Orders */}
      <Card style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#0F172A' }}>Recent Orders</span>
          <span style={{ fontSize: 13, color: '#3B82F6', fontWeight: 600, cursor: 'pointer' }}>View All →</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
              {['Date', 'Client', 'Product', 'Revenue', 'Profit', 'Status'].map(col => (
                <th key={col} style={{
                  padding: '10px 20px',
                  textAlign: col === 'Revenue' || col === 'Profit' ? 'right' : 'left',
                  fontSize: 12, fontWeight: 600, color: '#94A3B8',
                  textTransform: 'uppercase', letterSpacing: '0.05em', background: '#FAFAFA',
                }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((o, i) => (
              <tr
                key={o.id}
                style={{ borderBottom: '1px solid #F8FAFC', transition: 'background 0.1s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F8FAFC' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <td style={{ padding: '13px 20px', color: '#3B82F6', fontWeight: 600 }}>{fmtDate(o.date)}</td>
                <td style={{ padding: '13px 20px', fontWeight: 700, color: '#0F172A' }}>{o.customer.split(' ')[0]}</td>
                <td style={{ padding: '13px 20px', color: '#475569' }}>{o.product}</td>
                <td style={{ padding: '13px 20px', textAlign: 'right', color: '#0F172A', fontWeight: 500 }}>{fmt$(o.revenue)}</td>
                <td style={{ padding: '13px 20px', textAlign: 'right', color: '#16A34A', fontWeight: 700 }}>{fmt$(o.profit)}</td>
                <td style={{ padding: '13px 20px' }}><StatusPill status={o.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
