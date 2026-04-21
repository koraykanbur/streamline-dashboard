import { useState, useEffect, useCallback } from 'react'
import { Card } from '../components/Card'
import StatusPill from '../components/StatusPill'
import MissingDataBanner from '../components/MissingDataBanner'
import { api } from '../lib/api'
import { fmt$, fmtDate } from '../lib/utils'
import { Order, DateRange } from '../types'

const PRODUCTS = [
  'Matte Tumbler 500ml', 'Canvas Tote Bag', 'Bamboo Notebook', 'Linen Pouch Set',
  'Ceramic Mug', 'Kraft Journal', 'Glass Water Bottle', 'Cork Coaster Set',
]
const STATUSES = ['Fulfilled', 'Pending', 'Cancelled']
const CHANNELS = ['Direct', 'Marketplace', 'Wholesale']

function SortIcon({ dir }: { dir: 'asc' | 'desc' | null }) {
  if (!dir) return <span style={{ color: '#CBD5E1', fontSize: 10, marginLeft: 4 }}>↕</span>
  return <span style={{ color: '#0D9488', fontSize: 10, marginLeft: 4 }}>{dir === 'asc' ? '↑' : '↓'}</span>
}

function OrderSlideOver({ order, onClose }: { order: Order; onClose: () => void }) {
  const rows: [string, string][] = [
    ['Order ID', order.id],
    ['Date', fmtDate(order.date)],
    ['Customer', order.customer],
    ['Product', order.product],
    ['Quantity', String(order.qty)],
    ['Channel', order.channel],
    ['Revenue', fmt$(order.revenue)],
    ['Cost', fmt$(order.cost)],
    ['Profit', fmt$(order.profit)],
    ['Margin', order.margin + '%'],
  ]
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.25)', zIndex: 40 }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 380, background: '#fff',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.1)', zIndex: 50,
        display: 'flex', flexDirection: 'column',
        animation: 'slideInPanel 0.22s ease',
      }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A' }}>{order.id}</div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Order details</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <StatusPill status={order.status} />
            <button onClick={onClose} style={{ width: 30, height: 30, border: '1px solid #E2E8F0', borderRadius: 6, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
        <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {rows.map(([label, val], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: i < rows.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
              <span style={{ fontSize: 13.5, color: '#94A3B8', fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 13.5, color: '#0F172A', fontWeight: label === 'Profit' ? 600 : 400 }}>{val}</span>
            </div>
          ))}
          <div style={{ marginTop: 20, padding: 16, background: '#F0FDFA', borderRadius: 8, border: '1px solid #99F6E4' }}>
            <div style={{ fontSize: 12, color: '#0D9488', fontWeight: 600, marginBottom: 6 }}>MARGIN BREAKDOWN</div>
            <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', background: '#E2E8F0' }}>
              <div style={{ width: Math.min(order.margin, 100) + '%', height: '100%', background: '#0D9488', transition: 'width 0.6s ease', borderRadius: 4 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12, color: '#64748B' }}>
              <span>Profit {order.margin}%</span>
              <span>Cost {(100 - order.margin).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes slideInPanel { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </>
  )
}

function exportCSV(orders: Order[]) {
  const headers = ['Order ID', 'Date', 'Customer', 'Product', 'Qty', 'Revenue', 'Cost', 'Profit', 'Margin %', 'Status', 'Channel']
  const rows = orders.map(o => [o.id, o.date, `"${o.customer}"`, `"${o.product}"`, o.qty, o.revenue, o.cost, o.profit, o.margin, o.status, o.channel])
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `streamline-orders-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
}

const TH = { padding: '10px 14px', fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.06em', background: '#F8FAFC', whiteSpace: 'nowrap' as const, borderBottom: '1px solid #E2E8F0' }

export default function OrdersScreen({ dateRange, refreshKey }: { dateRange: DateRange; refreshKey: number }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [missingColumns, setMissingColumns] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [productFilter, setProductFilter] = useState('All')
  const [channelFilter, setChannelFilter] = useState('All')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'date', dir: 'desc' })
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [allFiltered, setAllFiltered] = useState<Order[]>([])
  const PER_PAGE = 25

  const range = dateRange === 'all' ? 'all' : dateRange.replace('d', '')

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {
        range, search, status: statusFilter, product: productFilter,
        channel: channelFilter, sortKey: sort.key, sortDir: sort.dir,
        page: String(page), perPage: String(PER_PAGE),
      }
      const data = await api.orders(params) as { orders: Order[]; total: number; totalPages: number; missingColumns: string[] }
      setOrders(data.orders)
      setTotal(data.total)
      setTotalPages(data.totalPages)
      setMissingColumns(data.missingColumns || [])

      // Also fetch all for CSV export
      const allData = await api.orders({ ...params, page: '1', perPage: '9999' }) as { orders: Order[] }
      setAllFiltered(allData.orders)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [range, search, statusFilter, productFilter, channelFilter, sort, page, refreshKey])

  useEffect(() => { fetch() }, [fetch])

  const toggleSort = (key: string) => {
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' })
    setPage(1)
  }

  const sortableCols: Record<string, string> = { 'Date': 'date', 'Revenue': 'revenue', 'Profit': 'profit', 'Margin %': 'margin' }

  return (
    <div className="p-4 md:p-6 flex flex-col gap-4">
      {missingColumns.length > 0 && <MissingDataBanner columns={missingColumns} />}

      {/* Filter bar */}
      <Card style={{ padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }}
            width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search orders, customers…"
            style={{ padding: '7px 12px 7px 32px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 13.5, outline: 'none', width: 230, fontFamily: 'inherit' }}
            onFocus={e => { e.target.style.borderColor = '#0D9488' }}
            onBlur={e => { e.target.style.borderColor = '#E2E8F0' }}
          />
        </div>

        {[
          { label: 'Status', val: statusFilter, set: (v: string) => { setStatusFilter(v); setPage(1) }, opts: ['All', ...STATUSES] },
          { label: 'Product', val: productFilter, set: (v: string) => { setProductFilter(v); setPage(1) }, opts: ['All', ...PRODUCTS] },
          { label: 'Channel', val: channelFilter, set: (v: string) => { setChannelFilter(v); setPage(1) }, opts: ['All', ...CHANNELS] },
        ].map(f => (
          <select key={f.label} value={f.val} onChange={e => f.set(e.target.value)} style={{
            padding: '7px 10px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 13.5, outline: 'none',
            fontFamily: 'inherit', color: '#475569', background: '#fff', cursor: 'pointer',
          }}>
            {f.opts.map(o => <option key={o}>{o}</option>)}
          </select>
        ))}

        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#94A3B8' }}>
          {loading ? '…' : `${total} orders`}
        </span>

        <button
          onClick={() => exportCSV(allFiltered)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '7px 12px', borderRadius: 6, border: '1px solid #E2E8F0',
            background: '#fff', cursor: 'pointer', color: '#475569', fontSize: 12.5, fontFamily: 'inherit',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
          </svg>
          Export CSV
        </button>
      </Card>

      {/* Table */}
      <Card style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Order ID', 'Date', 'Customer', 'Product', 'Revenue', 'Cost', 'Profit', 'Margin %', 'Status'].map(col => {
                  const sortKey = sortableCols[col]
                  return (
                    <th
                      key={col}
                      style={{ ...TH, cursor: sortKey ? 'pointer' : 'default', textAlign: ['Revenue', 'Cost', 'Profit', 'Margin %'].includes(col) ? 'right' : 'left' }}
                      onClick={() => sortKey && toggleSort(sortKey)}
                    >
                      {col}{sortKey && <SortIcon dir={sort.key === sortKey ? sort.dir : null} />}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => (
                <tr
                  key={o.id}
                  onClick={() => setSelectedOrder(o)}
                  style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer', background: i % 2 === 0 ? '#fff' : '#FAFAFA', transition: 'background 0.1s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F0FDFA' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? '#fff' : '#FAFAFA' }}
                >
                  <td style={{ padding: '11px 14px', color: '#0D9488', fontWeight: 600 }}>{o.id}</td>
                  <td style={{ padding: '11px 14px', color: '#475569' }}>{fmtDate(o.date)}</td>
                  <td style={{ padding: '11px 14px', color: '#0F172A', fontWeight: 500 }}>{o.customer}</td>
                  <td style={{ padding: '11px 14px', color: '#475569' }}>{o.product}</td>
                  <td style={{ padding: '11px 14px', color: '#0F172A', fontWeight: 500, textAlign: 'right' }}>{fmt$(o.revenue)}</td>
                  <td style={{ padding: '11px 14px', color: '#64748B', textAlign: 'right' }}>{fmt$(o.cost)}</td>
                  <td style={{ padding: '11px 14px', color: o.profit >= 0 ? '#16A34A' : '#DC2626', fontWeight: 600, textAlign: 'right' }}>{fmt$(o.profit)}</td>
                  <td style={{ padding: '11px 14px', color: '#475569', textAlign: 'right' }}>{o.margin}%</td>
                  <td style={{ padding: '11px 14px' }}><StatusPill status={o.status} /></td>
                </tr>
              ))}
              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>
                    No orders match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: 13, color: '#94A3B8' }}>
            {total === 0 ? 'No results' : `Showing ${Math.min((page - 1) * PER_PAGE + 1, total)}–${Math.min(page * PER_PAGE, total)} of ${total}`}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', cursor: page === 1 ? 'default' : 'pointer', fontSize: 13, color: page === 1 ? '#CBD5E1' : '#475569', fontFamily: 'inherit' }}
            >←</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let p = i + 1
              if (totalPages > 5 && page > 3) p = page - 2 + i
              if (p > totalPages) return null
              return (
                <button key={p} onClick={() => setPage(p)} style={{
                  width: 32, height: 32, borderRadius: 6, border: '1px solid',
                  borderColor: page === p ? '#0D9488' : '#E2E8F0',
                  background: page === p ? '#0D9488' : '#fff',
                  color: page === p ? '#fff' : '#475569',
                  cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
                }}>{p}</button>
              )
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', cursor: page === totalPages ? 'default' : 'pointer', fontSize: 13, color: page === totalPages ? '#CBD5E1' : '#475569', fontFamily: 'inherit' }}
            >→</button>
          </div>
        </div>
      </Card>

      {selectedOrder && <OrderSlideOver order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  )
}
