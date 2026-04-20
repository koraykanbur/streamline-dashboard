import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'

interface Props {
  data: Array<{ name: string; value: number; color: string }>
  height?: number
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { color: string } }> }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#fff', border: '1px solid #E2E8F0', borderRadius: 6,
      padding: '8px 12px', fontSize: 12, fontFamily: 'Inter',
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    }}>
      <span style={{ color: payload[0].payload.color, fontWeight: 600 }}>{payload[0].name}:</span>
      {' '}<strong style={{ color: '#0F172A' }}>{payload[0].value}%</strong>
    </div>
  )
}

export default function StreamlineDonutChart({ data, height = 220 }: Props) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius="58%"
            outerRadius="78%"
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} stroke="#fff" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={10}
            wrapperStyle={{ fontSize: 12, fontFamily: 'Inter', color: '#64748B', paddingTop: 4 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
