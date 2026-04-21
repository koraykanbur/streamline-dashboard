import { useState, useEffect, useRef } from 'react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import AIDrawer from './components/AIDrawer'
import OverviewScreen from './screens/OverviewScreen'
import OrdersScreen from './screens/OrdersScreen'
import ProductsScreen from './screens/ProductsScreen'
import CustomersScreen from './screens/CustomersScreen'
import TrendsScreen from './screens/TrendsScreen'
import { Screen, DateRange } from './types'
import { api } from './lib/api'

function loadState() {
  try { return JSON.parse(localStorage.getItem('streamline-state') || '{}') } catch { return {} }
}

export default function App() {
  const saved = loadState()
  const [screen, setScreen] = useState<Screen>(saved.screen || 'overview')
  const [collapsed, setCollapsed] = useState<boolean>(saved.collapsed || false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const [refreshKey, setRefreshKey] = useState(0)

  // Pull-to-refresh
  const mainRef = useRef<HTMLElement>(null)
  const touchStartY = useRef(0)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const PULL_THRESHOLD = 72

  const handleTouchStart = (e: React.TouchEvent) => {
    if (mainRef.current && mainRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartY.current || isRefreshing) return
    const dist = e.touches[0].clientY - touchStartY.current
    if (dist > 0 && mainRef.current?.scrollTop === 0) {
      setPullDistance(Math.min(dist * 0.5, PULL_THRESHOLD * 1.2))
    }
  }

  const handleTouchEnd = async () => {
    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true)
      setPullDistance(0)
      try {
        await api.refresh()
        setRefreshKey(k => k + 1)
      } catch {}
      setIsRefreshing(false)
    } else {
      setPullDistance(0)
    }
    touchStartY.current = 0
  }

  useEffect(() => {
    localStorage.setItem('streamline-state', JSON.stringify({ screen, collapsed }))
  }, [screen, collapsed])

  const handleNav = (s: Screen) => {
    setScreen(s)
    setMobileOpen(false)
  }

  const screenProps = { dateRange, refreshKey }

  const currentScreen = {
    overview:  <OverviewScreen {...screenProps} />,
    orders:    <OrdersScreen {...screenProps} />,
    products:  <ProductsScreen {...screenProps} />,
    customers: <CustomersScreen {...screenProps} />,
    trends:    <TrendsScreen {...screenProps} />,
  }[screen]

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F8FAFC' }}>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-10 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        active={screen}
        onNav={handleNav}
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <TopBar
          screen={screen}
          dateRange={dateRange}
          onDateRange={setDateRange}
          onAskAI={() => setAiOpen(o => !o)}
          onRefreshed={() => setRefreshKey(k => k + 1)}
          onMenuToggle={() => setMobileOpen(o => !o)}
        />
        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto relative"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Pull-to-refresh indicator */}
          {(pullDistance > 0 || isRefreshing) && (
            <div
              className="flex items-center justify-center md:hidden"
              style={{
                height: isRefreshing ? 56 : pullDistance,
                overflow: 'hidden',
                transition: isRefreshing ? 'none' : 'height 0.1s',
                background: '#F8FAFC',
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                border: '2px solid #E2E8F0', borderTopColor: '#0D9488',
                animation: isRefreshing ? 'spin 0.7s linear infinite' : 'none',
                transform: !isRefreshing ? `rotate(${(pullDistance / PULL_THRESHOLD) * 360}deg)` : undefined,
                transition: isRefreshing ? 'none' : 'transform 0.05s',
              }} />
            </div>
          )}
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          {currentScreen}
        </main>
      </div>

      <AIDrawer open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  )
}
