import { ReactNode, CSSProperties } from 'react'

export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E2E8F0',
      borderRadius: 8,
      ...style,
    }}>
      {children}
    </div>
  )
}

export function CardHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 20px', borderBottom: '1px solid #E2E8F0',
    }}>
      <span style={{ fontWeight: 600, fontSize: 14, color: '#0F172A' }}>{title}</span>
      {action}
    </div>
  )
}
