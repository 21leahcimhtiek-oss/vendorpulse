# VendorPulse Architecture

## Overview

VendorPulse is a Next.js 14 App Router application deployed on Vercel, using Supabase for data persistence and authentication, and OpenAI for AI features.

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Next.js)                     │
│  Landing · Auth · Dashboard · Vendors · Risk · Spend    │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────┐
│                  Vercel Edge Network                      │
│  • Next.js Middleware (auth guard)                       │
│  • Edge Rate Limiting (Upstash)                          │
│  • Static asset CDN                                      │
└──────────┬────────────────────┬────────────────────────-┘
           │                    │
┌──────────▼──────┐   ┌─────────▼─────────────────────────┐
│  Next.js API    │   │         Supabase                   │
│  Route Handlers │   │  • PostgreSQL (9 tables)           │
│  /api/vendors   │   │  • Row Level Security              │
│  /api/spend     │◄──►  • Supabase Auth (JWT)             │
│  /api/risk      │   │  • Realtime subscriptions          │
│  /api/scorecards│   └────────────────────────────────────┘
│  /api/billing   │
└──────────┬──────┘
           │
┌──────────▼──────┐   ┌────────────────┐   ┌─────────────┐
│   OpenAI API    │   │  Stripe API    │   │   Sentry    │
│  • GPT-4o       │   │  • Checkout    │   │  • Errors   │
│  • GPT-4o-mini  │   │  • Portal      │   │  • Traces   │
│  • Risk assess  │   │  • Webhooks    │   │  • Replays  │
└─────────────────┘   └────────────────┘   └─────────────┘
```

## Key Design Decisions

### Multi-tenancy
All data is scoped by `org_id`. Row Level Security policies enforce isolation at the database level using a helper function `is_org_member(org_id)`.

### Authentication Flow
1. User signs up/logs in via Supabase Auth
2. JWT token stored in HTTP-only cookie via `@supabase/ssr`
3. Middleware validates session on every protected route
4. Server components use `createClient()` from server context

### AI Integration
- **Risk Assessment** (`GPT-4o`): Analyzes vendor profile, spend history, existing flags, and scorecard data. Returns structured JSON with risk_score (0-100), risk factors, and mitigation recommendations.
- **Vendor Summary** (`GPT-4o-mini`): Generates executive prose summaries for procurement managers.
- Both endpoints are rate-limited to 10 calls/minute/user via Upstash Redis.
- AI features are gated to Pro/Enterprise plans.

### Stripe Billing
- Checkout sessions created server-side, redirect to Stripe
- Webhook handler processes `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Plan stored on `orgs.plan` column, enforced in API middleware

## Performance Considerations

- Server Components fetch data in parallel via `Promise.all()`
- Database indexes on high-cardinality query patterns (org_id, tier, risk_score)
- Recharts charts rendered client-side with `"use client"` directive
- API responses capped at reasonable limits (50-100 records)

## Security

- All API routes authenticate via Supabase JWT
- Zod validation on all API inputs
- Rate limiting on all endpoints (100 req/min general, 10 req/min AI)
- Stripe webhooks verified via signature
- No secrets in client-side code