import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardHeader } from '../components/Card'
import StreamlineDonutChart from '../components/charts/StreamlineDonutChart'
import StatusPill from '../components/StatusPill'
import { api } from '../lib/api'
import { fmt$, fmtDate } from '../lib/utils'
import { DateRange, CustomerStat, Order } from '../types'

export default function CustomersScreen({ dateRange, refreshKey }: { dateRange: DateRange; refreshKey: number }) {
  const [customers, setCustomers] = useState<CustomerStat[]>([])
  const [customerOrders, setCustomerOrders] = useState<Record<string, Order[]>>({})
  const [newCount, setNewCount] = useState(0)
  const [repeatCount, setRepeatCount] = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const range = dateRange === 'all' ? 'all' : dateRange.replace('d', '')
    api.customers(range)
      .then(d => {
        const data = d as { customers: CustomerStat[]; customerOrders: Record<string, Order[]>; newCount: number; repeatCount: number }
        setCustomers(data.customers)
        setCustomerOrders(data.customerOrders)
        setNewCount(data.newCount)
        setRepeatCount(data.repeatCount)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [dateRange, refreshKey])

  const total = newCount + repeatCount
  const donutData = [
    { name: 'Repeat Customers', value: total > 0 ? Math.round(repeatCount / total * 100) : 0, color: '#0D9488' },
    { name: 'New Customers', value: total > 0 ? Math.round(newCount / total * 100) : 0, color: '#F59E0B' },
  ]

  const avgOrders = customers.length > 0
    ? (customers.reduce((s, c) => s + c.totalOrders, 0) / customers.length).toFixed(1)
    : '0'

  if (loading && !customers.length) {
    return <div style={{ padding: 24, color: '#94A3B8', fontSize: 14 }}>Loading customers…</div>
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 16 }}>
        {/* Customers table */}
        <Card style={{ flex: 2, overflow: 'hidden' }}>
          <CardHeader title="Top Customers" action={<span style={{ fontSize: 12, color: '#94A3B8' }}>Click a row to expand</span>} />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Rank', 'Customer', 'Orders', 'Revenue', 'Profit', 'Last Purchase'].map(col => (
                  <th key={col} style={{
                    padding: '10px 14px', fontSize: 11, fontWeight: 600, color: '#94A3B8',
                    textTransform: 'uppercase', letterSpacing: '0.06em', background: '#F8FAFC',
                    borderBottom: '1px solid #E2E8F0',
                    textAlign: col === 'Rank' || col === 'Orders' ? 'center' : col === 'Revenue' || col === 'Profit' ? 'right' : 'left',
                  }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.map((c, i) => {
                const isExpanded = expanded === c.name
                const hue = (i * 47) % 360
                const initials = c.name.split(' ').map(w => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase()
                const orders = customerOrders[c.name] || []
                return (
                  <React.Fragment key={c.name}>
                    <tr
                      onClick={() => setExpanded(isExpanded ? null : c.name)}
                      style={{
                        borderBottom: '1px solid #F1F5F9', cursor: 'pointer',
                        background: isExpanded ? '#F0FDFA' : i % 2 === 0 ? '#fff' : '#FAFAFA',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => { if (!isExpanded) (e.currentTarget as HTMLElement).style.background = '#F0FDFA' }}
                      onMouseLeave={e => { if (!isExpanded) (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? '#fff' : '#FAFAFA' }}
                    >
                      <td style={{ padding: '11px 14px', textAlign: 'center', color: '#94A3B8', fontWeight: 600, fontSize: 12 }}>#{i + 1}</td>
                      <td style={{ padding: '11px 14px', fontWeight: 600, color: '#0F172A' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: `hsl(${hue},40%,88%)`, flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700, color: `hsl(${hue},40%,30%)`,
                          }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontSize: 13.5 }}>{c.name}</div>
                            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 400 }}>
                              {c.type === 'new' ? 'New customer' : 'Repeat customer'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '11px 14px', textAlign: 'center', color: '#475569' }}>{c.totalOrders}</td>
                      <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 500, color: '#0F172A' }}>{fmt$(c.totalRevenue)}</td>
                      <td style={{ padding: '11px 14px', textAlign: 'right', color: '#16A34A', fontWeight: 600 }}>{fmt$(c.totalProfit)}</td>
                      <td style={{ padding: '11px 14px', color: '#64748B', fontSize: 12 }}>{fmtDate(c.lastPurchase)}</td>
                    </tr>

                    {isExpanded && (
                      <tr>
                        <td colSpan={6} style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', padding: 0 }}>
                          <div style={{ padding: '12px 20px' }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              Recent Orders ({orders.length})
                            </div>
                            {orders.length === 0 ? (
                              <div style={{ color: '#94A3B8', fontSize: 13, padding: '8px 0' }}>No orders in this period.</div>
                            ) : (
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                                <tbody>
                                  {orders.slice(0, 10).map(o => (
                                    <tr key={o.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                      <td style={{ padding: '7px 10px', color: '#0D9488', fontWeight: 600 }}>{o.id}</td>
                                      <td style={{ padding: '7px 10px', color: '#64748B' }}>{fmtDate(o.date)}</td>
                                      <td style={{ padding: '7px 10px', color: '#475569' }}>{o.product}</td>
                                      <td style={{ padding: '7px 10px', color: '#0F172A', fontWeight: 500, textAlign: 'right' }}>{fmt$(o.revenue)}</td>
                                      <td style={{ padding: '7px 10px', textAlign: 'right' }}><StatusPill status={o.status} /></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </Card>

        {/* Right panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card style={{ padding: '16px 20px' }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#0F172A', marginBottom: 12 }}>New vs Repeat</div>
            <StreamlineDonutChart data={donutData} height={220} />
          </Card>

          <Card style={{ padding: '16px 20px' }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: '#0F172A', marginBottom: 12 }}>Customer Summary</div>
            {[
              ['Total Customers', String(customers.length)],
              ['Repeat Customers', String(repeatCount)],
              ['New Customers', String(newCount)],
              ['Avg Orders / Customer', avgOrders],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9', fontSize: 13 }}>
                <span style={{ color: '#64748B' }}>{label}</span>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>{val}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  )
}

