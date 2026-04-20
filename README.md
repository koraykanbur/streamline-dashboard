# Streamline Dashboard

A fully functional business intelligence dashboard with Google Sheets integration and Claude AI assistant.

## Quick Start

```bash
cp .env.example .env
# Fill in your API keys in .env
npm install
npm run dev
```

The app runs at **http://localhost:5173** with the API at **http://localhost:3001**.

If no Google Sheet is configured, the app automatically uses built-in sample data (134 orders, 8 products, 45 customers, 6 months of data).

---

## Setup

### 1. Google Sheets API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable the **Google Sheets API**
4. Go to **APIs & Services → Credentials → Create Credentials → API Key**
5. (Optional) Restrict the key to "Google Sheets API" and your domain

### 2. Google Sheet Format

Your sheet's first row must contain column headers. The app uses fuzzy matching, so exact names aren't required — it looks for these fields:

| Field | Accepted column names |
|---|---|
| Order ID | `order id`, `id`, `order #`, `orderid` |
| Date | `date`, `order date`, `purchase date` |
| Customer | `customer`, `client`, `buyer` |
| Product | `product`, `item`, `sku name` |
| Revenue | `revenue`, `total`, `amount`, `price` |
| Cost | `cost`, `cogs`, `unit cost` |
| Quantity | `quantity`, `qty`, `units` |
| Status | `status`, `order status` |
| Channel | `channel`, `source`, `platform` |

**Recommended column layout:**
```
Order ID | Date       | Customer   | Product | Revenue | Cost  | Quantity | Status    | Channel
ORD-001  | 2026-01-15 | Acme Corp  | Widget  | 120.00  | 45.00 | 2        | Fulfilled | Direct
```

Supported date formats: `YYYY-MM-DD`, `DD/MM/YYYY`, `MM/DD/YYYY`, ISO 8601.

---

## Environment Variables

```env
GOOGLE_SHEET_ID=          # The ID from your Sheet URL
GOOGLE_SHEETS_API_KEY=    # Your Google Sheets API key
ANTHROPIC_API_KEY=        # Your Anthropic API key
PORT=3001                 # Backend port (optional)
USE_SAMPLE_DATA=false     # Force sample data even if Sheet is configured
```

---

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/summary?range=30` | KPIs (revenue, profit, margin, orders, AOV + deltas) |
| `GET /api/orders?range=30&search=&status=&product=&page=1` | Paginated, filterable orders |
| `GET /api/products?range=all` | Product-level aggregates |
| `GET /api/customers?range=all` | Customer rankings + order history |
| `GET /api/trends?view=daily` | Time-series (daily/weekly/monthly) + forecast + anomalies |
| `GET /api/insights` | AI-generated bullet insights (calls Claude) |
| `POST /api/chat` | Multi-turn AI chat `{ messages: [...], dataContext?: {...} }` |
| `GET /api/sample` | 134 built-in mock orders |
| `POST /api/refresh` | Invalidates Google Sheets cache |

---

## Deploy to Vercel

1. Push this repo to GitHub
2. Connect to [Vercel](https://vercel.com)
3. Set environment variables in Vercel dashboard
4. Deploy — Vite frontend is served statically, API runs as serverless function

**Note for Vercel:** The Express server needs to be wrapped as a serverless function. For a simpler Vercel deploy, consider migrating the backend to Next.js API routes or Vercel's `@vercel/node` adapter.

## Deploy to Railway

1. Create a new Railway project
2. Connect your GitHub repo
3. Add environment variables in Railway dashboard
4. Railway auto-detects Node.js and runs `npm start`

Add this to `package.json` scripts:
```json
"start": "concurrently \"node dist-server/index.js\" \"vite preview --port 8080\""
```

Then run `npm run build && npm run build:server` before deploy.

---

## Project Structure

```
streamline-dashboard/
├── server/              Express backend
│   ├── index.ts         All API routes
│   └── lib/
│       ├── sampleData.ts  Mock data generator (seeded random)
│       ├── sheets.ts      Google Sheets fetcher + cache
│       ├── transform.ts   Fuzzy column mapping + row transformation
│       └── claude.ts      Anthropic SDK (insights + chat)
└── src/                 React + TypeScript frontend
    ├── screens/         One file per page (Overview, Orders, Products, Customers, Trends)
    ├── components/      Sidebar, TopBar, KpiCard, AIDrawer, StatusPill, Card
    ├── components/charts/ Recharts wrappers (Line, HBar, Donut, Scatter, StackedBar)
    └── lib/             api.ts (fetch helpers), utils.ts (formatters)
```
