import { Screen } from '../types'
import SvgIcon from './SvgIcon'

const NAV_ITEMS: Array<{ id: Screen; label: string; icon: string }> = [
  { id: 'overview',   label: 'Overview',   icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'orders',     label: 'Orders',     icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { id: 'products',   label: 'Products',   icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { id: 'customers',  label: 'Customers',  icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { id: 'trends',     label: 'Trends',     icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
]

interface Props {
  active: Screen
  onNav: (s: Screen) => void
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
  bgColor?: string
}

export default function Sidebar({ active, onNav, collapsed, onToggle, mobileOpen, onMobileClose, bgColor = '#00264E' }: Props) {
  const drawerWidth = mobileOpen ? 220 : (collapsed ? 64 : 220)

  return (
    <aside
      className={[
        'fixed inset-y-0 left-0 z-20 flex flex-col',
        'md:static md:translate-x-0',
        'transition-transform duration-[220ms] ease-in-out',
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      ].join(' ')}
      style={{
        width: drawerWidth,
        minWidth: drawerWidth,
        background: bgColor,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Logo row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: collapsed && !mobileOpen ? '20px 0' : '20px 20px',
        justifyContent: collapsed && !mobileOpen ? 'center' : 'flex-start',
        borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 8,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 7, flexShrink: 0,
          background: '#75AAE7', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14l3.5 3.5L10 14" />
          </svg>
        </div>
        {(!collapsed || mobileOpen) && (
          <span style={{ color: '#F8FAFC', fontWeight: 700, fontSize: 16, letterSpacing: '-0.3px', whiteSpace: 'nowrap', flex: 1 }}>
            Streamline
          </span>
        )}
        {/* Close button — mobile only */}
        <button
          onClick={onMobileClose}
          className="flex md:hidden items-center justify-center"
          style={{
            width: 28, height: 28, borderRadius: 6, border: 'none',
            background: 'rgba(255,255,255,0.1)', color: 'rgba(148,163,184,0.9)',
            cursor: 'pointer', flexShrink: 0,
          }}
          aria-label="Close menu"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '4px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map(item => {
          const isActive = active === item.id
          const showLabel = !collapsed || mobileOpen
          return (
            <button
              key={item.id}
              onClick={() => onNav(item.id)}
              style={{
                display: 'flex', alignItems: 'center',
                gap: 10, padding: showLabel ? '9px 12px' : '9px 0',
                justifyContent: showLabel ? 'flex-start' : 'center',
                borderRadius: 6, border: 'none', cursor: 'pointer',
                background: isActive ? '#75AAE7' : 'transparent',
                color: isActive ? '#ffffff' : 'rgba(148,163,184,0.9)',
                fontWeight: isActive ? 600 : 400, fontSize: 14,
                transition: 'background 0.15s, color 0.15s',
                whiteSpace: 'nowrap', width: '100%', fontFamily: 'inherit',
              }}
              title={!showLabel ? item.label : undefined}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(117,170,231,0.2)' }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <span style={{ flexShrink: 0 }}>
                <SvgIcon path={item.icon} size={16} stroke={isActive ? '#ffffff' : 'rgba(148,163,184,0.9)'} />
              </span>
              {showLabel && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Collapse toggle — desktop only */}
      <button
        onClick={onToggle}
        className="hidden md:flex items-center justify-center"
        style={{
          margin: '10px', padding: '9px', borderRadius: 6, border: 'none',
          background: 'rgba(255,255,255,0.05)', color: 'rgba(148,163,184,0.7)',
          cursor: 'pointer',
          transition: 'background 0.15s', fontFamily: 'inherit',
        }}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
      >
        <SvgIcon
          path={collapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'}
          size={14}
          stroke="currentColor"
          strokeWidth={2}
        />
      </button>
    </aside>
  )
}
