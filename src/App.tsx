import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import AIDrawer from './components/AIDrawer'
import OverviewScreen from './screens/OverviewScreen'
import OrdersScreen from './screens/OrdersScreen'
import ProductsScreen from './screens/ProductsScreen'
import CustomersScreen from './screens/CustomersScreen'
import TrendsScreen from './screens/TrendsScreen'
import { Screen, DateRange } from './types'

function loadState() {
  try { return JSON.parse(localStorage.getItem('streamline-state') || '{}') } catch { return {} }
}

export default function App() {
  const saved = loadState()
  const [screen, setScreen] = useState<Screen>(saved.screen || 'overview')
  const [collapsed, setCollapsed] = useState<boolean>(saved.collapsed || false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    localStorage.setItem('streamline-state', JSON.stringify({ screen, collapsed }))
  }, [screen, collapsed])

  const handleNav = (s: Screen) => {
    setScreen(s)
    setMobileOpen(false)
  }

  const screenProps = { dateRange: 'all' as const, refreshKey }

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
          onAskAI={() => setAiOpen(o => !o)}
          onRefreshed={() => setRefreshKey(k => k + 1)}
          onMenuToggle={() => setMobileOpen(o => !o)}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative" style={{ overscrollBehavior: 'contain none', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' } as React.CSSProperties}>
          {currentScreen}
        </main>
      </div>

      <AIDrawer open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  )
}
