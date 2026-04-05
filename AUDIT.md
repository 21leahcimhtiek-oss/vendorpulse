# VendorPulse — Audit & Compliance Guide

## Data Model Audit Trail

Every core entity records `created_at` and `updated_at` timestamps. The following actions are captured:

| Action | Table | Fields Captured |
|--------|-------|----------------|
| Vendor created | `vendors` | created_at, created by (via RLS user context) |
| Risk flag created | `risk_flags` | ai_detected, severity, created_at |
| Scorecard submitted | `vendor_scorecards` | all 4 dimension scores, created_by, period |
| Spend record imported | `spend_records` | amount, vendor, department, invoice_ref |
| Contract status change | `vendor_contracts` | status, start_date, end_date |

## Row-Level Security (RLS)

All tables enforce RLS policies scoped to `org_id`. Users can only access data belonging to their organization. Policies defined in `supabase/migrations/001_initial_schema.sql`.

## Compliance Mappings

### SOX (Sarbanes-Oxley)
- Spend records with invoice references support financial audit trails
- Vendor approval tiers (strategic/preferred/approved/unapproved) enforce procurement controls

### ISO 27001
- Risk flags with severity classification align with A.15 (Supplier Relationships)
- Vendor scorecards provide documented performance evaluation (A.15.2.1)

### GDPR
- Vendor contact data is org-scoped and deletable
- No personal data is shared with third parties except OpenAI (for AI features)
- OpenAI API calls use vendor business data, not personal data

## Security Controls

- **Authentication**: Supabase Auth (JWT-based)
- **Authorization**: Row-Level Security on all tables
- **Rate Limiting**: Upstash Redis, 10 req/min on AI endpoints, 100 req/min on API
- **Secrets**: Environment variables only, never committed to source
- **Observability**: Sentry error tracking with PII scrubbing enabled
- **Transport**: HTTPS enforced, HSTS headers via Vercel

## Incident Response

1. Sentry alert fires for any unhandled exception
2. Risk flags can be AI-detected or manually created
3. All `risk_flags` have `status` (open/acknowledged/resolved) with timestamp trail