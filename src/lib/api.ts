import { ChatMessage, DataContext } from '../types'

const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api'

async function fetchJson<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, opts)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error?: string }).error || res.statusText)
  }
  return res.json()
}

export const api = {
  summary: (range: string) =>
    fetchJson<Record<string, unknown>>(`${BASE}/summary?range=${encodeURIComponent(range)}`),

  orders: (params: Record<string, string>) => {
    const q = new URLSearchParams(params).toString()
    return fetchJson<Record<string, unknown>>(`${BASE}/orders?${q}`)
  },

  products: (range: string) =>
    fetchJson<Record<string, unknown>>(`${BASE}/products?range=${encodeURIComponent(range)}`),

  customers: (range: string) =>
    fetchJson<Record<string, unknown>>(`${BASE}/customers?range=${encodeURIComponent(range)}`),

  trends: (view: string) =>
    fetchJson<Record<string, unknown>>(`${BASE}/trends?view=${encodeURIComponent(view)}`),

  insights: () =>
    fetchJson<{ insights: string[] }>(`${BASE}/insights`),

  chat: (messages: ChatMessage[], dataContext?: DataContext) =>
    fetchJson<{ reply: string }>(`${BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, dataContext }),
    }),

  refresh: () =>
    fetchJson<{ ok: boolean }>(`${BASE}/refresh`, { method: 'POST' }),
}
