type Status = 'Fulfilled' | 'Pending' | 'Cancelled'

const cfg: Record<Status, { bg: string; color: string; dot: string }> = {
  Fulfilled: { bg: '#F0FDF4', color: '#16A34A', dot: '#22C55E' },
  Pending:   { bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B' },
  Cancelled: { bg: '#FEF2F2', color: '#DC2626', dot: '#EF4444' },
}

export default function StatusPill({ status }: { status: string }) {
  const c = cfg[status as Status] || cfg.Pending
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 20,
      background: c.bg, color: c.color, fontSize: 12, fontWeight: 600,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
      {status}
    </span>
  )
}
