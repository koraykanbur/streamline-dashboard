import { useState } from 'react'
import { Screen, DateRange } from '../types'
import { api } from '../lib/api'

const SCREEN_LABELS: Record<Screen, string> = {
  overview:  'Executive Overview',
  orders:    'Orders',
  products:  'Products',
  customers: 'Customers',
  trends:    'Trends',
}

const RANGES: DateRange[] = ['7d', '30d', '90d', 'all']
const RANGE_LABELS: Record<DateRange, string> = { '7d': '7d', '30d': '30d', '90d': '90d', 'all': 'All' }

interface Props {
  screen: Screen
  dateRange: DateRange
  onDateRange: (r: DateRange) => void
  onAskAI: () => void
  onRefreshed: () => void
}

export default function TopBar({ screen, dateRange, onDateRange, onAskAI, onRefreshed }: Props) {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    if (refreshing) return
    setRefreshing(true)
    try {
      await api.refresh()   // clears backend cache
      onRefreshed()         // increments refreshKey → all screens re-fetch
    } catch {}
    setRefreshing(false)
  }

  return (
    <div style={{
      height: 56, display: 'flex', alignItems: 'center',
      padding: '0 24px', background: '#fff',
      borderBottom: '1px solid #E2E8F0', gap: 16, flexShrink: 0,
    }}>
      <span style={{ fontWeight: 700, fontSize: 16, color: '#0F172A', whiteSpace: 'nowrap' }}>
        {SCREEN_LABELS[screen]}
      </span>

      {/* Search */}
      <div style={{ flex: 1, maxWidth: 320, position: 'relative' }}>
        <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }}
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          placeholder="Search everything…"
          style={{
            width: '100%', padding: '7px 12px 7px 32px',
            border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13.5,
            outline: 'none', fontFamily: 'inherit', color: '#475569', background: '#F8FAFC',
            transition: 'border-color 0.15s, background 0.15s',
          }}
          onFocus={e => { e.target.style.borderColor = '#94A3B8'; e.target.style.background = '#fff' }}
          onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#F8FAFC' }}
        />
      </div>

      <div style={{ flex: 1 }} />

      {/* Date range pills */}
      <div style={{ display: 'flex', gap: 2, background: '#F1F5F9', borderRadius: 7, padding: 3 }}>
        {RANGES.map(r => (
          <button key={r} onClick={() => onDateRange(r)} style={{
            padding: '4px 12px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13,
            fontWeight: dateRange === r ? 600 : 400,
            background: dateRange === r ? '#fff' : 'transparent',
            color: dateRange === r ? '#0F172A' : '#64748B',
            boxShadow: dateRange === r ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s', fontFamily: 'inherit',
          }}>
            {RANGE_LABELS[r]}
          </button>
        ))}
      </div>

      {/* Refresh */}
      <button
        onClick={handleRefresh}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 13px', border: '1px solid #E2E8F0', borderRadius: 7,
          background: '#fff', cursor: 'pointer', color: '#475569',
          fontSize: 13, fontWeight: 500, fontFamily: 'inherit', transition: 'all 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F8FAFC' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff' }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: refreshing ? 'rotate(360deg)' : 'none', transition: refreshing ? 'transform 0.7s linear' : 'none' }}>
          <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
        </svg>
        Refresh Data
      </button>

      {/* Ask AI */}
      <button
        onClick={onAskAI}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '7px 14px', borderRadius: 6, border: 'none',
          background: '#0D9488', color: '#fff', cursor: 'pointer',
          fontWeight: 600, fontSize: 13, letterSpacing: '-0.1px',
          transition: 'background 0.15s', fontFamily: 'inherit',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#0F766E' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#0D9488' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a10 10 0 00-7.35 16.83L4 22l3.17-.65A10 10 0 1012 2z"/>
          <path d="M8 10h8M8 14h5"/>
        </svg>
        Ask AI
      </button>
    </div>
  )
}
