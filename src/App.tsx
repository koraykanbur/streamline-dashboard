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
  const [aiOpen, setAiOpen] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    localStorage.setItem('streamline-state', JSON.stringify({ screen, collapsed }))
  }, [screen, collapsed])

  const screenProps = { dateRange, refreshKey }

  const currentScreen = {
    overview:  <OverviewScreen {...screenProps} />,
    orders:    <OrdersScreen {...screenProps} />,
    products:  <ProductsScreen {...screenProps} />,
    customers: <CustomersScreen {...screenProps} />,
    trends:    <TrendsScreen {...screenProps} />,
  }[screen]

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#F8FAFC' }}>
      <Sidebar
        active={screen}
        onNav={setScreen}
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <TopBar
          screen={screen}
          dateRange={dateRange}
          onDateRange={setDateRange}
          onAskAI={() => setAiOpen(o => !o)}
          onRefreshed={() => setRefreshKey(k => k + 1)}
        />
        <main style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
          {currentScreen}
        </main>
      </div>

      <AIDrawer open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  )
}
