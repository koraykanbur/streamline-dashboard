import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid, ZAxis } from 'recharts'

interface Point {
  name: string
  revenue: number
  margin: number
  units: number
}

interface Props {
  data: Point[]
  height?: number
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: Point }> }) => {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div style={{
      background: '#fff', border: '1px solid #E2E8F0', borderRadius: 6,
      padding: '10px 12px', fontSize: 12, fontFamily: 'Inter',
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    }}>
      <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{p.name}</div>
      <div style={{ color: '#475569' }}>Revenue: <strong style={{ color: '#0F172A' }}>${p.revenue.toLocaleString()}</strong></div>
      <div style={{ color: '#475569' }}>Margin: <strong style={{ color: '#0F172A' }}>{p.margin}%</strong></div>
      <div style={{ color: '#475569' }}>Units: <strong style={{ color: '#0F172A' }}>{p.units}</strong></div>
    </div>
  )
}

export default function StreamlineScatterChart({ data, height = 280 }: Props) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 20 }}>
          <CartesianGrid stroke="#F1F5F9" />
          <XAxis
            type="number"
            dataKey="margin"
            name="Margin %"
            unit="%"
            tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'Inter' }}
            axisLine={{ stroke: '#E2E8F0' }}
            tickLine={false}
            label={{ value: 'Margin %', position: 'insideBottomRight', offset: -5, fontSize: 11, fill: '#94A3B8', fontFamily: 'Inter' }}
          />
          <YAxis
            type="number"
            dataKey="revenue"
            name="Revenue"
            tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'Inter' }}
            tickFormatter={v => '$' + (v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v)}
            axisLine={false}
            tickLine={false}
            width={55}
            label={{ value: 'Revenue', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: '#94A3B8', fontFamily: 'Inter' }}
          />
          <ZAxis type="number" dataKey="units" range={[36, 400]} />
          <Tooltip content={<CustomTooltip />} />
          <Scatter
            data={data}
            fill="rgba(13,148,136,0.55)"
            stroke="#0D9488"
            strokeWidth={1.5}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
