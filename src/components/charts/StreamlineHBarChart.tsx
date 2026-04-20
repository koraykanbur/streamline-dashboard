import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'

interface Props {
  data: Array<{ name: string; value: number }>
  height?: number
  color?: string
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number }> }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#fff', border: '1px solid #E2E8F0', borderRadius: 6,
      padding: '8px 12px', fontSize: 12, fontFamily: 'Inter',
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    }}>
      <strong style={{ color: '#0F172A' }}>${payload[0].value.toLocaleString()}</strong>
    </div>
  )
}

export default function StreamlineHBarChart({ data, height = 300, color = '#0D9488' }: Props) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
          barSize={18}
        >
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'Inter' }}
            tickFormatter={v => '$' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12, fill: '#475569', fontFamily: 'Inter' }}
            axisLine={false}
            tickLine={false}
            width={130}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F1F5F9' }} />
          <Bar dataKey="value" radius={4}>
            {data.map((_, i) => (
              <Cell key={i} fill={color} fillOpacity={1 - i * 0.07} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
