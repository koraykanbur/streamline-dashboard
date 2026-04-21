type IconKey = 'revenue' | 'profit' | 'margin' | 'orders' | 'aov'

const KPI_ICONS: Record<IconKey, string> = {
  revenue: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  profit:  'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  margin:  'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z',
  orders:  'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
  aov:     'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
}

interface Props {
  label: string
  value: number | string
  delta?: number
  prefix?: string
  suffix?: string
  icon?: IconKey
  iconBg?: string
}

export default function KpiCard({ label, value, delta, prefix = '', suffix = '', icon, iconBg }: Props) {
  const positive = (delta ?? 0) >= 0
  const formatted = typeof value === 'number'
    ? value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : value

  return (
    <div
      className="p-4 md:p-[20px_22px]"
      style={{
        background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10,
        flex: 1, minWidth: 0,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        {icon && (
          <div style={{
            width: 40, height: 40, borderRadius: 8, background: iconBg || '#3B82F6',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={KPI_ICONS[icon]} />
            </svg>
          </div>
        )}
        {delta !== undefined && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            fontSize: 12.5, fontWeight: 600,
            color: positive ? '#16A34A' : '#DC2626',
          }}>
            {positive ? '↑' : '↓'} {Math.abs(delta)}%
          </div>
        )}
      </div>
      <div style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500, marginBottom: 6 }}>{label}</div>
      <div className="text-lg md:text-[28px]" style={{ fontWeight: 700, color: '#0F172A', lineHeight: 1, letterSpacing: '-0.5px' }}>
        {prefix}{formatted}{suffix}
      </div>
    </div>
  )
}
