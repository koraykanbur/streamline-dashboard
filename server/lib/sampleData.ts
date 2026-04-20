export interface Product {
  id: string
  name: string
  cost: number
  price: number
}

export interface Customer {
  id: string
  name: string
  type: 'new' | 'repeat'
}

export interface Order {
  id: string
  date: string
  customer: string
  customerId: string
  product: string
  productId: string
  qty: number
  revenue: number
  cost: number
  profit: number
  margin: number
  status: 'Fulfilled' | 'Pending' | 'Cancelled'
  channel: string
}

export interface TimeSeriesEntry {
  date: string
  revenue: number
  profit: number
  isAnomaly: boolean
  anomalyType: 'spike' | 'drop' | null
}

export const PRODUCTS: Product[] = [
  { id: 'P01', name: 'Matte Tumbler 500ml',  cost: 8.40,  price: 28.00 },
  { id: 'P02', name: 'Canvas Tote Bag',       cost: 4.20,  price: 18.00 },
  { id: 'P03', name: 'Bamboo Notebook',       cost: 5.80,  price: 22.00 },
  { id: 'P04', name: 'Linen Pouch Set',       cost: 6.10,  price: 24.00 },
  { id: 'P05', name: 'Ceramic Mug',           cost: 4.90,  price: 19.50 },
  { id: 'P06', name: 'Kraft Journal',         cost: 3.60,  price: 16.00 },
  { id: 'P07', name: 'Glass Water Bottle',    cost: 9.80,  price: 32.00 },
  { id: 'P08', name: 'Cork Coaster Set',      cost: 2.90,  price: 14.00 },
]

export const CUSTOMERS: Customer[] = [
  { id: 'C01', name: 'Hartwell & Co.',         type: 'repeat' },
  { id: 'C02', name: 'Mila Chen',              type: 'repeat' },
  { id: 'C03', name: 'Oaks Supply Group',      type: 'repeat' },
  { id: 'C04', name: 'Jamie Torres',           type: 'new'    },
  { id: 'C05', name: 'Birchwood Gifts',        type: 'repeat' },
  { id: 'C06', name: 'Sam Nguyen',             type: 'new'    },
  { id: 'C07', name: 'Priya Sharma',           type: 'repeat' },
  { id: 'C08', name: 'Atlas Retail Ltd.',      type: 'repeat' },
  { id: 'C09', name: 'Leo Müller',             type: 'new'    },
  { id: 'C10', name: 'Cove & Hearth',          type: 'repeat' },
  { id: 'C11', name: 'Nina Patel',             type: 'new'    },
  { id: 'C12', name: 'Terrace Goods Co.',      type: 'repeat' },
  { id: 'C13', name: 'Felix Andersen',         type: 'new'    },
  { id: 'C14', name: 'Rowan MacKay',           type: 'repeat' },
  { id: 'C15', name: 'Elara Designs',          type: 'new'    },
  { id: 'C16', name: 'Summit & Stone',         type: 'repeat' },
  { id: 'C17', name: 'Clara Hoffman',          type: 'new'    },
  { id: 'C18', name: 'Pacific Goods Inc.',     type: 'repeat' },
  { id: 'C19', name: 'Tobias Werner',          type: 'new'    },
  { id: 'C20', name: 'Poplar & Pine Co.',      type: 'repeat' },
  { id: 'C21', name: 'Ingrid Larsson',         type: 'repeat' },
  { id: 'C22', name: 'Coastal Provisions',     type: 'repeat' },
  { id: 'C23', name: 'Marcus Bell',            type: 'new'    },
  { id: 'C24', name: 'Fieldstone Market',      type: 'repeat' },
  { id: 'C25', name: 'Zoe Nakamura',           type: 'new'    },
  { id: 'C26', name: 'Nordic Trade AB',        type: 'repeat' },
  { id: 'C27', name: 'Aiden Walsh',            type: 'new'    },
  { id: 'C28', name: 'Harbour & Bay Ltd.',     type: 'repeat' },
  { id: 'C29', name: 'Sofia Reyes',            type: 'new'    },
  { id: 'C30', name: 'Ember & Oak',            type: 'repeat' },
  { id: 'C31', name: 'River Stone Co.',        type: 'repeat' },
  { id: 'C32', name: 'Lena Braun',             type: 'new'    },
  { id: 'C33', name: 'Solstice Supply',        type: 'repeat' },
  { id: 'C34', name: 'David Park',             type: 'new'    },
  { id: 'C35', name: 'Meadow & Co.',           type: 'repeat' },
  { id: 'C36', name: 'Amara Osei',             type: 'new'    },
  { id: 'C37', name: 'Timber & Thread',        type: 'repeat' },
  { id: 'C38', name: 'Ivan Petrov',            type: 'new'    },
  { id: 'C39', name: 'Bloom & Branch',         type: 'repeat' },
  { id: 'C40', name: 'Hannah Kim',             type: 'new'    },
  { id: 'C41', name: 'Quarry Stone Co.',       type: 'repeat' },
  { id: 'C42', name: 'Ethan Russell',          type: 'new'    },
  { id: 'C43', name: 'Pebble & Post',          type: 'repeat' },
  { id: 'C44', name: 'Nadia Volkov',           type: 'new'    },
  { id: 'C45', name: 'Verdant Supply',         type: 'repeat' },
]

const CHANNELS = ['Direct', 'Marketplace', 'Wholesale']
const STATUSES: Array<'Fulfilled' | 'Pending' | 'Cancelled'> = [
  'Fulfilled', 'Fulfilled', 'Fulfilled', 'Pending', 'Cancelled',
]

function seededRand(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0x100000000
  }
}

function rnd(r: () => number, min: number, max: number) {
  return r() * (max - min) + min
}

function pick<T>(r: () => number, arr: T[]): T {
  return arr[Math.floor(r() * arr.length)]
}

export function generateSampleData() {
  const rand = seededRand(42)

  // Generate 180 days of daily time series (6 months: Jan–Jun 2026)
  const timeSeries: TimeSeriesEntry[] = []
  const start = new Date('2025-10-20')
  let baseRev = 750
  const baseProfit = 280

  for (let i = 0; i < 182; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    const dow = d.getDay()
    const weekendBoost = dow === 0 || dow === 6 ? 1.35 : 1
    const trend = 1 + i * 0.0025
    let anomaly = 1
    // Predefined anomalies for realism
    if (i === 22) anomaly = 1.9
    if (i === 55) anomaly = 0.35
    if (i === 90) anomaly = 1.7
    if (i === 130) anomaly = 0.45
    if (i === 160) anomaly = 1.8

    const rev = Math.round(baseRev * trend * weekendBoost * anomaly * rnd(rand, 0.8, 1.2))
    const profit = Math.round(rev * rnd(rand, 0.33, 0.43))

    timeSeries.push({
      date: d.toISOString().split('T')[0],
      revenue: rev,
      profit,
      isAnomaly: anomaly !== 1,
      anomalyType: anomaly !== 1 ? (anomaly > 1 ? 'spike' : 'drop') : null,
    })
    baseRev = baseRev
  }

  // Generate 150+ orders distributed across all 182 days
  const orders: Order[] = []
  let orderId = 1000

  timeSeries.forEach((day, dayIdx) => {
    // ~1 order per day, biased to hit 150+ total across 182 days
    const count = Math.floor(rnd(rand, 0.2, 2.8))
    for (let j = 0; j < count; j++) {
      const product = pick(rand, PRODUCTS)
      const customer = pick(rand, CUSTOMERS)
      const qty = Math.max(1, Math.floor(rnd(rand, 1, 6)))
      const revenue = Math.round(product.price * qty * rnd(rand, 0.9, 1.05) * 100) / 100
      const cost = Math.round(product.cost * qty * 100) / 100
      const profit = Math.round((revenue - cost) * 100) / 100
      const margin = revenue > 0 ? Math.round((profit / revenue) * 1000) / 10 : 0
      const status = pick(rand, STATUSES)
      const channel = pick(rand, CHANNELS)

      orders.push({
        id: `ORD-${orderId++}`,
        date: day.date,
        customer: customer.name,
        customerId: customer.id,
        product: product.name,
        productId: product.id,
        qty,
        revenue,
        cost,
        profit,
        margin,
        status,
        channel,
      })
    }
  })

  orders.sort((a, b) => b.date.localeCompare(a.date))

  return { timeSeries, orders }
}

const _cached = generateSampleData()
export const SAMPLE_TIME_SERIES = _cached.timeSeries
export const SAMPLE_ORDERS = _cached.orders
