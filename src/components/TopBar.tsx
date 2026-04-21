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
  onMenuToggle: () => void
}

export default function TopBar({ screen, dateRange, onDateRange, onAskAI, onRefreshed, onMenuToggle }: Props) {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    if (refreshing) return
    setRefreshing(true)
    try {
      await api.refresh()
      onRefreshed()
    } catch {}
    setRefreshing(false)
  }

  return (
    <div style={{
      height: 56, display: 'flex', alignItems: 'center',
      padding: '0 16px', background: '#fff',
      borderBottom: '1px solid #E2E8F0', gap: 10, flexShrink: 0,
    }}>
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuToggle}
        className="flex md:hidden items-center justify-center"
        style={{
          width: 36, height: 36, borderRadius: 7, border: '1px solid #E2E8F0',
          background: '#fff', cursor: 'pointer', color: '#475569', fontSize: 18,
          flexShrink: 0,
        }}
        aria-label="Open menu"
      >
        ☰
      </button>

      {/* Desktop: static title */}
      <span className="hidden md:block" style={{ fontWeight: 700, fontSize: 15, color: '#0F172A', whiteSpace: 'nowrap', flexShrink: 0 }}>
        {SCREEN_LABELS[screen]}
      </span>

      {/* Mobile: tappable title that refreshes */}
      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="flex md:hidden items-center gap-1.5"
        style={{
          border: 'none', background: 'transparent', cursor: refreshing ? 'default' : 'pointer',
          padding: 0, fontFamily: 'inherit', flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 15, color: refreshing ? '#94A3B8' : '#0F172A', whiteSpace: 'nowrap' }}>
          {SCREEN_LABELS[screen]}
        </span>
        <svg
          width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={refreshing ? '#94A3B8' : '#64748B'}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }}
        >
          <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
        </svg>
      </button>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Search — hidden on small mobile */}
      <div className="hidden sm:block" style={{ flex: 1, maxWidth: 280, position: 'relative' }}>
        <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }}
          width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          placeholder="Search everything…"
          style={{
            width: '100%', padding: '7px 12px 7px 30px',
            border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13,
            outline: 'none', fontFamily: 'inherit', color: '#475569', background: '#F8FAFC',
            transition: 'border-color 0.15s, background 0.15s',
          }}
          onFocus={e => { e.target.style.borderColor = '#94A3B8'; e.target.style.background = '#fff' }}
          onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#F8FAFC' }}
        />
      </div>

      <div style={{ flex: 1 }} />

      {/* Date range pills */}
      <div style={{ display: 'flex', gap: 2, background: '#F1F5F9', borderRadius: 7, padding: 3, flexShrink: 0 }}>
        {RANGES.map(r => (
          <button key={r} onClick={() => onDateRange(r)} style={{
            padding: '4px 10px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 12,
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

      {/* Refresh — hidden on mobile (use pull-to-refresh instead) */}
      <button
        onClick={handleRefresh}
        className="hidden sm:flex items-center"
        style={{
          gap: 6, padding: '7px 11px', border: '1px solid #E2E8F0', borderRadius: 7,
          background: '#fff', cursor: 'pointer', color: '#475569',
          fontSize: 13, fontWeight: 500, fontFamily: 'inherit', transition: 'all 0.15s', flexShrink: 0,
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
          padding: '7px 12px', borderRadius: 6, border: 'none',
          background: '#0D9488', color: '#fff', cursor: 'pointer',
          fontWeight: 600, fontSize: 13, letterSpacing: '-0.1px',
          transition: 'background 0.15s', fontFamily: 'inherit', flexShrink: 0,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#0F766E' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#0D9488' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a10 10 0 00-7.35 16.83L4 22l3.17-.65A10 10 0 1012 2z"/>
          <path d="M8 10h8M8 14h5"/>
        </svg>
        <span className="hidden sm:inline">Ask AI</span>
      </button>
    </div>
  )
}
