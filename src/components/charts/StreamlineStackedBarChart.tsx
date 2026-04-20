import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts'

interface Props {
  data: Record<string, unknown>[]
  keys: Array<{ key: string; color: string; label: string }>
  xKey?: string
  height?: number
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; fill: string }>; label?: string }) => {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s, p) => s + p.value, 0)
  return (
    <div style={{
      background: '#fff', border: '1px solid #E2E8F0', borderRadius: 6,
      padding: '10px 12px', fontSize: 12, fontFamily: 'Inter',
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    }}>
      <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569', marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.fill, display: 'inline-block' }} />
          {p.name}: <strong style={{ color: '#0F172A', marginLeft: 2 }}>${p.value.toLocaleString()}</strong>
        </div>
      ))}
      <div style={{ borderTop: '1px solid #F1F5F9', marginTop: 6, paddingTop: 6, fontWeight: 600, color: '#0F172A', fontSize: 12 }}>
        Total: ${total.toLocaleString()}
      </div>
    </div>
  )
}

export default function StreamlineStackedBarChart({ data, keys, xKey = 'date', height = 240 }: Props) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barSize={28}>
          <CartesianGrid stroke="#F1F5F9" vertical={false} />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'Inter' }}
            axisLine={{ stroke: '#E2E8F0' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'Inter' }}
            tickFormatter={v => '$' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC' }} />
          <Legend
            wrapperStyle={{ fontSize: 12, fontFamily: 'Inter', color: '#64748B', paddingTop: 8 }}
            iconType="square"
            iconSize={10}
          />
          {keys.map((k, i) => (
            <Bar
              key={k.key}
              dataKey={k.key}
              name={k.label}
              stackId="a"
              fill={k.color}
              radius={i === keys.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
