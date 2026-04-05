# VendorPulse

> Manage every vendor relationship with precision.

VendorPulse is a production-ready enterprise SaaS platform for **vendor relationship management**, **spend analytics**, **risk monitoring**, and **contract tracking**.

## Features

- **Vendor Scorecards** — Rate vendors on quality, delivery, communication & value
- **Spend Analytics** — Track spend by vendor, category, department, and period with trend charts
- **AI Risk Monitoring** — GPT-4o powered risk assessment with automatic flag creation
- **Contract Tracking** — Monitor contract status, expiry dates, and auto-renewals
- **Real-time Alerts** — Configurable alerts for risk events, contract expirations, and spend anomalies
- **CSV Import** — Bulk import spend records from any ERP or accounting system

## Tech Stack

- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth), Next.js API Routes
- **AI**: OpenAI GPT-4o for risk assessment, GPT-4o-mini for summaries
- **Payments**: Stripe (Starter $89/mo · Pro $229/mo · Enterprise $549/mo)
- **Infrastructure**: Vercel, Upstash Redis (rate limiting), Sentry (observability)

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/21leahcimhtiek-oss/vendorpulse
cd vendorpulse && npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in your Supabase, Stripe, OpenAI, Upstash credentials

# 3. Apply database migrations
supabase db push

# 4. Run development server
npm run dev
```

## Pricing

| Plan | Price | Vendors |
|------|-------|---------|
| Starter | $89/mo | 25 |
| Pro | $229/mo | 200 + AI features |
| Enterprise | $549/mo | Unlimited + SSO |

## Deployment

See [`deploy/vercel-deploy.md`](deploy/vercel-deploy.md) for full deployment instructions.

## License

MIT © VendorPulse