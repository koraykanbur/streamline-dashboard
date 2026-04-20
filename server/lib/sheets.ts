import axios from 'axios'
import { mapHeaders, getMissingColumns, transformRows } from './transform.js'
import { Order } from './sampleData.js'

interface SheetsResponse {
  values?: string[][]
}

interface SheetData {
  orders: Order[]
  missingColumns: string[]
  source: 'sheets' | 'sample'
  fetchedAt: number
}

let cache: SheetData | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function fetchSheetData(): Promise<SheetData> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) return cache

  const sheetId = process.env.GOOGLE_SHEET_ID
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY

  if (!sheetId || !apiKey) {
    throw new Error('GOOGLE_SHEET_ID and GOOGLE_SHEETS_API_KEY must be set')
  }

  const sheetName = encodeURIComponent(process.env.GOOGLE_SHEET_NAME || 'Sheet1')
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}?key=${apiKey}`
  const res = await axios.get<SheetsResponse>(url, { timeout: 10000 })
  const values = res.data.values || []

  if (values.length < 2) {
    return { orders: [], missingColumns: [], source: 'sheets', fetchedAt: Date.now() }
  }

  const headers = values[0]
  const colMap = mapHeaders(headers)
  const missingColumns = getMissingColumns(colMap)
  const orders = transformRows(values.slice(1), colMap)

  cache = { orders, missingColumns, source: 'sheets', fetchedAt: Date.now() }
  return cache
}

export function invalidateCache() {
  cache = null
}
