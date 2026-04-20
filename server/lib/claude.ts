import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const MODEL = 'claude-sonnet-4-5'

export interface DataContext {
  totalRevenue: number
  totalProfit: number
  avgMargin: number
  topProducts: Array<{ name: string; revenue: number; margin: number }>
  topCustomers: Array<{ name: string; revenue: number; orders: number }>
  recentTrend: 'up' | 'down' | 'flat'
  dateRange: string
  orderCount: number
  anomalies: Array<{ date: string; type: 'spike' | 'drop' }>
}

const SYSTEM_PROMPT = `You are Streamline AI, a business intelligence assistant for a small e-commerce company. You have access to the current business data context provided with every message. Your role is to:

- Answer questions in plain, direct English
- Show calculations when relevant (e.g. "Revenue of $12,400 ÷ 87 orders = $142.5 AOV")
- Reference actual product and customer names from the data
- Be concise: 2-5 sentences per answer, no fluff
- End every answer with a one-line italicized source note like: *Source: Orders data, last 30 days.*
- Use **bold** for key metrics and product/customer names
- Flag anomalies or concerns proactively when relevant
- Be actionable — suggest what the user should do, not just describe the data`

export async function generateInsights(context: DataContext): Promise<string[]> {
  const prompt = `Based on the following business data, generate 4-5 concise, actionable insight bullet points for the executive dashboard. Each bullet should be 1-2 sentences and reference specific numbers/names.

Data context:
- Total Revenue: $${context.totalRevenue.toLocaleString()}
- Total Profit: $${context.totalProfit.toLocaleString()}
- Avg Margin: ${context.avgMargin}%
- Orders: ${context.orderCount}
- Date Range: ${context.dateRange}
- Recent Trend: ${context.recentTrend}
- Top Products: ${context.topProducts.map(p => `${p.name} ($${p.revenue.toLocaleString()}, ${p.margin}% margin)`).join(', ')}
- Top Customers: ${context.topCustomers.map(c => `${c.name} ($${c.revenue.toLocaleString()}, ${c.orders} orders)`).join(', ')}
- Anomalies: ${context.anomalies.length ? context.anomalies.map(a => `${a.type} on ${a.date}`).join(', ') : 'none'}

Return ONLY a JSON array of strings, each string being one insight bullet point. Example format:
["Insight 1...", "Insight 2...", ...]`

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
    system: SYSTEM_PROMPT,
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
  } catch {}

  // Fallback: split by newlines
  return text.split('\n').filter(l => l.trim().length > 0).slice(0, 5)
}

export async function chat(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  context: DataContext,
): Promise<string> {
  const contextStr = `Current data context:
- Revenue: $${context.totalRevenue.toLocaleString()} | Profit: $${context.totalProfit.toLocaleString()} | Margin: ${context.avgMargin}%
- Orders: ${context.orderCount} | Date Range: ${context.dateRange}
- Top products: ${context.topProducts.map(p => `${p.name} ($${p.revenue.toLocaleString()}, ${p.margin}%)`).join('; ')}
- Top customers: ${context.topCustomers.map(c => `${c.name} ($${c.revenue.toLocaleString()})`).join('; ')}
- Trend: ${context.recentTrend} | Anomalies: ${context.anomalies.length ? context.anomalies.map(a => `${a.type} on ${a.date}`).join(', ') : 'none'}`

  const systemWithContext = `${SYSTEM_PROMPT}\n\n${contextStr}`

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: systemWithContext,
    messages,
  })

  return response.content[0].type === 'text' ? response.content[0].text : 'Unable to generate response.'
}
