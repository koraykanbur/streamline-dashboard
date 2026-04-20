import { Order } from './sampleData.js'

// Use exact match only to avoid "profit rmb" colliding with "profit (%)"
const COLUMN_ALIASES: Record<string, string[]> = {
  orderId:  ['order id', 'order_id', 'orderid', 'id', 'order #', 'order number', '#'],
  date:     ['date', 'order date', 'purchase date', 'created at', 'created_at', 'timestamp', 'sale date'],
  customer: ['customer', 'customer name', 'client', 'client name', 'buyer', 'name', 'client name'],
  product:  ['product', 'product name', 'item', 'item name', 'sku name', 'sku', 'description'],
  revenue:  [
    'revenue', 'total', 'amount', 'sale price', 'price', 'total revenue', 'gross', 'sales',
    'sold price', 'sold price rmb', 'sold price usd', 'sold price aed', 'selling price',
    'selling price rmb', 'invoice amount',
  ],
  cost:     [
    'cost', 'cogs', 'cost of goods', 'unit cost', 'total cost', 'cost price',
    'total cost rmb', 'total cost usd', 'product cost rmb', 'product cost',
    'landed cost', 'purchase cost',
  ],
  // Pre-computed profit column in the sheet (use it directly instead of revenue - cost)
  preProfit: [
    'profit rmb', 'profit usd', 'profit aed', 'net profit', 'gross profit',
    'profit amount', 'margin amount',
  ],
  // Pre-computed margin % column
  preMargin: [
    'profit', 'margin', 'profit percent', 'margin percent', 'profit pct',
    'profit %', 'margin %', 'profit ratio',
  ],
  quantity: ['quantity', 'qty', 'units', 'count', 'volume', 'amount sold', 'pieces'],
  status:   ['status', 'order status', 'fulfillment status', 'state', 'completed', 'payment status'],
  channel:  ['channel', 'sales channel', 'source', 'platform', 'origin'],
}

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()
}

export function mapHeaders(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {}
  headers.forEach((h, i) => {
    const norm = normalize(h)
    for (const [canonical, aliases] of Object.entries(COLUMN_ALIASES)) {
      // Exact match only to prevent "profit rmb" matching "profit" alias
      if (aliases.some(a => normalize(a) === norm)) {
        if (!(canonical in map)) map[canonical] = i
      }
    }
  })
  return map
}

export function getMissingColumns(colMap: Record<string, number>): string[] {
  // Date is optional (many manual ledgers don't have it)
  const required = ['customer', 'product', 'revenue']
  return required.filter(c => !(c in colMap))
}

function parseDate(raw: string): string {
  if (!raw) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  const dmy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (dmy) {
    const d = parseInt(dmy[1]), m = parseInt(dmy[2])
    if (d > 12) return `${dmy[3]}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`
    return `${dmy[3]}-${dmy[1].padStart(2,'0')}-${dmy[2].padStart(2,'0')}`
  }
  const mdy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (mdy) return `${mdy[3]}-${mdy[1].padStart(2,'0')}-${mdy[2].padStart(2,'0')}`
  const parsed = new Date(raw)
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0]
  return raw
}

export function transformRows(
  rows: string[][],
  colMap: Record<string, number>,
): Order[] {
  const orders: Order[] = []
  let autoId = 1000
  const today = new Date().toISOString().split('T')[0]

  rows.forEach((row, rowIdx) => {
    if (row.every(cell => !cell?.trim())) return

    const get = (key: string) =>
      colMap[key] !== undefined ? (row[colMap[key]] || '').trim() : ''
    const getNum = (key: string) =>
      parseFloat(get(key).replace(/[$,،¥₹]/g, '')) || 0

    const customer = get('customer')
    const product = get('product')
    if (!customer && !product) return

    const revenue = getNum('revenue')
    const cost = getNum('cost')

    // Use pre-computed profit/margin if available, otherwise calculate
    const profit = colMap['preProfit'] !== undefined
      ? getNum('preProfit')
      : Math.round((revenue - cost) * 100) / 100

    const margin = colMap['preMargin'] !== undefined
      ? Math.round(getNum('preMargin') * 10) / 10
      : revenue > 0 ? Math.round((profit / revenue) * 1000) / 10 : 0

    const rawDate = get('date')
    const date = rawDate ? parseDate(rawDate) : today

    const rawStatus = get('status').toLowerCase()
    let status: 'Fulfilled' | 'Pending' | 'Cancelled' = 'Fulfilled'
    if (rawStatus.includes('pend') || rawStatus.includes('process')) status = 'Pending'
    else if (rawStatus.includes('cancel') || rawStatus.includes('refund') || rawStatus.includes('return')) status = 'Cancelled'

    orders.push({
      id: get('orderId') || `ORD-${autoId++}`,
      date,
      customer: customer || 'Unknown',
      customerId: customer || 'Unknown',
      product: product || 'Unknown',
      productId: product || 'Unknown',
      qty: getNum('quantity') || 1,
      revenue,
      cost,
      profit: Math.round(profit * 100) / 100,
      margin,
      status,
      channel: get('channel') || 'Direct',
    })
  })

  return orders.sort((a, b) => b.date.localeCompare(a.date))
}
