import {
  ResponsiveContainer, ComposedChart, Line, Area, CartesianGrid,
  XAxis, YAxis, Tooltip, Legend, ReferenceLine,
} from 'recharts'

interface Series {
  key: string
  label: string
  color: string
  fill?: boolean
  dashed?: boolean
}

interface Props {
  data: Record<string, unknown>[]
  series: Series[]
  height?: number
  xKey?: string
  referenceLines?: Array<{ x: string; label?: string; color?: string }>
}

function fmt$(v: number) {
  if (v >= 1000) return '$' + (v / 1000).toFixed(0) + 'k'
  return '$' + v
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string; strokeDasharray?: string }>; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#fff', border: '1px solid #E2E8F0', borderRadius: 6,
      padding: '10px 12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', marginBottom: 6 }}>{label}</div>
      {payload.filter(p => p.value != null).map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569', marginBottom: 2 }}>
          <span style={{ width: 8, height: 2, background: p.color, display: 'inline-block', borderRadius: 1 }} />
          {p.name}: <strong style={{ color: '#0F172A', marginLeft: 2 }}>${p.value?.toLocaleString()}</strong>
        </div>
      ))}
    </div>
  )
}

export default function StreamlineLineChart({ data, series, height = 260, xKey = 'date', referenceLines }: Props) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            {series.filter(s => s.fill).map(s => (
              <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={s.color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={s.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke="#F1F5F9" vertical={false} />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'Inter' }}
            axisLine={{ stroke: '#E2E8F0' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'Inter' }}
            tickFormatter={fmt$}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, fontFamily: 'Inter', color: '#64748B', paddingTop: 8 }}
            iconType="plainline"
            iconSize={16}
          />
          {referenceLines?.map((r, i) => (
            <ReferenceLine key={i} x={r.x} stroke={r.color || '#F59E0B'} strokeDasharray="4 4" label={{ value: r.label, fill: '#94A3B8', fontSize: 11 }} />
          ))}
          {series.map(s => s.fill ? (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              fill={`url(#fill-${s.key})`}
              dot={false}
              activeDot={{ r: 5, fill: s.color, strokeWidth: 0 }}
              strokeDasharray={s.dashed ? '6 4' : undefined}
              connectNulls={false}
            />
          ) : (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: s.color, strokeWidth: 0 }}
              strokeDasharray={s.dashed ? '6 4' : undefined}
              connectNulls={false}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
