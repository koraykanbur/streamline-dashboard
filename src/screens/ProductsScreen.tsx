import { useState, useEffect, useMemo } from 'react'
import { Card, CardHeader } from '../components/Card'
import StreamlineHBarChart from '../components/charts/StreamlineHBarChart'
import StreamlineScatterChart from '../components/charts/StreamlineScatterChart'
import { api } from '../lib/api'
import { fmt$ } from '../lib/utils'
import { DateRange, ProductStat } from '../types'

function SortIcon({ dir }: { dir: 'asc' | 'desc' | null }) {
  if (!dir) return <span style={{ color: '#CBD5E1', fontSize: 10, marginLeft: 4 }}>↕</span>
  return <span style={{ color: '#0D9488', fontSize: 10, marginLeft: 4 }}>{dir === 'asc' ? '↑' : '↓'}</span>
}

const TH: React.CSSProperties = {
  padding: '10px 14px', fontSize: 11, fontWeight: 600, color: '#94A3B8',
  textTransform: 'uppercase', letterSpacing: '0.06em', background: '#F8FAFC',
  borderBottom: '1px solid #E2E8F0', cursor: 'pointer',
}

export default function ProductsScreen({ dateRange, refreshKey }: { dateRange: DateRange; refreshKey: number }) {
  const [products, setProducts] = useState<ProductStat[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<{ key: keyof ProductStat; dir: 'asc' | 'desc' }>({ key: 'revenue', dir: 'desc' })

  useEffect(() => {
    setLoading(true)
    const range = dateRange === 'all' ? 'all' : dateRange.replace('d', '')
    api.products(range)
      .then(d => setProducts((d as { products: ProductStat[] }).products))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [dateRange, refreshKey])

  const topByRev = products[0]
  const topByMargin = useMemo(() => [...products].sort((a, b) => b.avgMargin - a.avgMargin)[0], [products])
  const lowMargin = useMemo(() => [...products].sort((a, b) => a.avgMargin - b.avgMargin)[0], [products])

  const sorted = useMemo(() => {
    return [...products].sort((a, b) => (sort.dir === 'asc' ? 1 : -1) * ((a[sort.key] as number) - (b[sort.key] as number)))
  }, [products, sort])

  const toggleSort = (key: keyof ProductStat) => {
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' })
  }

  const barData = products.map(p => ({ name: p.name, value: p.revenue }))
  const scatterData = products.map(p => ({ name: p.name, revenue: p.revenue, margin: p.avgMargin, units: p.units }))

  if (loading && !products.length) {
    return <div style={{ padding: 24, color: '#94A3B8', fontSize: 14 }}>Loading products…</div>
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stat cards */}
      {topByRev && topByMargin && lowMargin && (
        <div style={{ display: 'flex', gap: 14 }}>
          {[
            { label: 'Top by Revenue', name: topByRev.name, val: fmt$(topByRev.revenue), sub: `${topByRev.units} units sold`, color: '#0D9488', bg: '#F0FDFA', border: '#99F6E4' },
            { label: 'Top by Margin', name: topByMargin.name, val: topByMargin.avgMargin + '%', sub: 'avg margin', color: '#0D9488', bg: '#F0FDFA', border: '#99F6E4' },
            { label: 'Lowest Margin', name: lowMargin.name, val: lowMargin.avgMargin + '%', sub: 'needs attention', color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
          ].map((c, i) => (
            <div key={i} style={{ flex: 1, background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, padding: '16px 20px' }}>
              <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{c.label}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 3 }}>{c.name}</div>
              <div style={{ fontSize: 22, fontWeight: 600, color: c.color }}>{c.val}</div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 3 }}>{c.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div style={{ display: 'flex', gap: 16 }}>
        <Card style={{ flex: 2 }}>
          <CardHeader title="Revenue by Product" />
          <div style={{ padding: '16px 20px 20px' }}>
            <StreamlineHBarChart data={barData} height={280} color="#0D9488" />
          </div>
        </Card>
        <Card style={{ flex: 1 }}>
          <CardHeader
            title="Revenue vs Margin"
            action={<span style={{ fontSize: 11, color: '#94A3B8' }}>bubble = units sold</span>}
          />
          <div style={{ padding: '16px 20px 20px' }}>
            <StreamlineScatterChart data={scatterData} height={280} />
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card style={{ overflow: 'hidden' }}>
        <CardHeader title="Product Performance" />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {[
                ['Product', null],
                ['Units Sold', 'units'],
                ['Total Revenue', 'revenue'],
                ['Total Profit', 'profit'],
                ['Avg Margin %', 'avgMargin'],
              ].map(([label, key]) => (
                <th
                  key={String(label)}
                  onClick={() => key && toggleSort(key as keyof ProductStat)}
                  style={{ ...TH, textAlign: key ? 'right' : 'left', cursor: key ? 'pointer' : 'default' }}
                >
                  {label}{key && <SortIcon dir={sort.key === key ? sort.dir : null} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => (
              <tr key={p.name} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F8FAFC' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? '#fff' : '#FAFAFA' }}
              >
                <td style={{ padding: '11px 14px', fontWeight: 500, color: '#0F172A' }}>{p.name}</td>
                <td style={{ padding: '11px 14px', color: '#475569', textAlign: 'right' }}>{p.units}</td>
                <td style={{ padding: '11px 14px', fontWeight: 500, color: '#0F172A', textAlign: 'right' }}>{fmt$(p.revenue)}</td>
                <td style={{ padding: '11px 14px', color: '#16A34A', fontWeight: 600, textAlign: 'right' }}>{fmt$(p.profit)}</td>
                <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 48, height: 5, borderRadius: 3, background: '#E2E8F0', overflow: 'hidden', display: 'inline-block' }}>
                      <span style={{ display: 'block', height: '100%', width: Math.min(p.avgMargin, 100) + '%', background: p.avgMargin < 30 ? '#F59E0B' : '#0D9488', borderRadius: 3 }} />
                    </span>
                    <span style={{ color: '#475569' }}>{p.avgMargin}%</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
