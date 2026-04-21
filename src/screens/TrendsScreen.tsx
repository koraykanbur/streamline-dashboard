import { useState, useEffect, useMemo } from 'react'
import { Card, CardHeader } from '../components/Card'
import StreamlineLineChart from '../components/charts/StreamlineLineChart'
import StreamlineStackedBarChart from '../components/charts/StreamlineStackedBarChart'
import { api } from '../lib/api'
import { fmt$, fmtDate, fmtShort, fmtMonthYear } from '../lib/utils'
import { DateRange, TimeSeriesEntry, Anomaly } from '../types'

type View = 'daily' | 'weekly' | 'monthly'

interface BestWeek { date: string; revenue: number; profit: number }
interface ChannelRow { date: string; Direct: number; Marketplace: number; Wholesale: number }

export default function TrendsScreen({ dateRange, refreshKey }: { dateRange: DateRange; refreshKey: number }) {
  const [view, setView] = useState<View>('daily')
  const [timeSeries, setTimeSeries] = useState<TimeSeriesEntry[]>([])
  const [forecast, setForecast] = useState<TimeSeriesEntry[]>([])
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [channelBreakdown, setChannelBreakdown] = useState<ChannelRow[]>([])
  const [bestWeek, setBestWeek] = useState<BestWeek | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.trends(view)
      .then(d => {
        const data = d as { timeSeries: TimeSeriesEntry[]; forecast: TimeSeriesEntry[]; anomalies: Anomaly[]; channelBreakdown: ChannelRow[]; bestWeek: BestWeek }
        setTimeSeries(data.timeSeries)
        setForecast(data.forecast)
        setAnomalies(data.anomalies)
        setChannelBreakdown(data.channelBreakdown)
        setBestWeek(data.bestWeek)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [view, refreshKey])

  const formatDate = (d: string) => {
    if (view === 'monthly') return fmtMonthYear(d)
    return fmtShort(d)
  }

  const chartData = useMemo(() => {
    const historical = timeSeries.map(d => ({
      date: formatDate(d.date),
      Revenue: d.revenue,
      Profit: d.profit,
      'Forecast Revenue': null as number | null,
      'Forecast Profit': null as number | null,
    }))

    // Bridge last historical point into forecast
    if (timeSeries.length && forecast.length) {
      const last = historical[historical.length - 1]
      const forecastPoints = forecast.map((d, i) => ({
        date: formatDate(d.date),
        Revenue: null as number | null,
        Profit: null as number | null,
        'Forecast Revenue': d.revenue,
        'Forecast Profit': d.profit,
      }))
      // Add bridge point
      return [
        ...historical.slice(0, -1),
        { ...last, 'Forecast Revenue': last.Revenue, 'Forecast Profit': last.Profit },
        ...forecastPoints,
      ]
    }
    return historical
  }, [timeSeries, forecast, view])

  const channelData = channelBreakdown.map(d => ({
    date: fmtShort(d.date),
    Direct: d.Direct,
    Marketplace: d.Marketplace,
    Wholesale: d.Wholesale,
  }))

  const CHANNEL_KEYS = [
    { key: 'Direct', color: '#0D9488', label: 'Direct' },
    { key: 'Marketplace', color: '#0F172A', label: 'Marketplace' },
    { key: 'Wholesale', color: '#F59E0B', label: 'Wholesale' },
  ]

  return (
    <div className="p-4 md:p-6 flex flex-col gap-5">
      {/* Best period callout */}
      {bestWeek && (
        <div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)',
            borderRadius: 8, padding: '16px 24px',
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: '#5EEAD4', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              Best Performing Period
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 2 }}>
              Week of {fmtDate(bestWeek.date)} — {fmt$(bestWeek.revenue)} revenue
            </div>
            <div style={{ fontSize: 13, color: '#94A3B8' }}>
              {fmt$(bestWeek.profit)} profit · {bestWeek.revenue > 0 ? Math.round(bestWeek.profit / bestWeek.revenue * 100) : 0}% margin that week
            </div>
          </div>
          <div style={{ fontSize: 36 }}>🏆</div>
        </div>
      )}

      {/* Main trend chart */}
      <Card>
        <CardHeader
          title="Revenue & Profit Over Time"
          action={
            <div style={{ display: 'flex', gap: 2, background: '#F1F5F9', borderRadius: 6, padding: 3 }}>
              {(['daily', 'weekly', 'monthly'] as View[]).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  style={{
                    padding: '4px 12px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 12,
                    fontWeight: view === v ? 600 : 400,
                    background: view === v ? '#fff' : 'transparent',
                    color: view === v ? '#0F172A' : '#64748B',
                    boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    fontFamily: 'inherit', transition: 'all 0.15s', textTransform: 'capitalize',
                  }}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          }
        />
        <div style={{ padding: '16px 20px 20px' }}>
          <StreamlineLineChart
            data={chartData}
            xKey="date"
            series={[
              { key: 'Revenue', label: 'Revenue', color: '#0D9488', fill: true },
              { key: 'Profit', label: 'Profit', color: '#0F172A' },
              { key: 'Forecast Revenue', label: 'Forecast Revenue', color: '#0D9488', dashed: true },
              { key: 'Forecast Profit', label: 'Forecast Profit', color: '#0F172A', dashed: true },
            ]}
            height={290}
          />
        </div>

        {/* Anomaly markers */}
        {view === 'daily' && anomalies.length > 0 && (
          <div style={{ padding: '0 20px 16px', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Anomalies:
            </span>
            {anomalies.map((a, i) => (
              <span key={i} style={{
                padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                background: a.type === 'spike' ? '#F0FDF4' : '#FEF2F2',
                color: a.type === 'spike' ? '#16A34A' : '#DC2626',
                border: `1px solid ${a.type === 'spike' ? '#86EFAC' : '#FECACA'}`,
              }}>
                {a.type === 'spike' ? '↑' : '↓'} {fmtDate(a.date)} — {a.type === 'spike' ? 'Revenue spike' : 'Revenue dip'}
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* Channel breakdown */}
      <Card>
        <CardHeader title="Revenue by Channel (last 8 weeks)" />
        <div style={{ padding: '16px 20px 20px' }}>
          {loading ? (
            <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
              Loading…
            </div>
          ) : (
            <StreamlineStackedBarChart
              data={channelData}
              keys={CHANNEL_KEYS}
              xKey="date"
              height={240}
            />
          )}
        </div>
      </Card>
    </div>
  )
}
