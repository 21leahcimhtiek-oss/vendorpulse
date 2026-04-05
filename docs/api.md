# VendorPulse API Reference

All API endpoints require authentication. Include your session cookie (set automatically by the browser) or a valid Bearer token.

Base URL: `https://your-domain.com/api`

## Vendors

### List Vendors
```
GET /api/vendors
```
Query params: `tier`, `status`, `limit` (max 100)

Response:
```json
{ "data": [{ "id": "...", "name": "Acme Corp", "tier": "preferred", "risk_score": 42, "spend_ytd_usd": 50000 }] }
```

### Create Vendor
```
POST /api/vendors
Content-Type: application/json

{ "name": "Acme Corp", "tier": "approved", "category": "IT Services" }
```

### Get Vendor Detail
```
GET /api/vendors/:id
```
Returns full vendor with contacts, spend records, scorecards, risk flags, and contracts.

### Update Vendor
```
PATCH /api/vendors/:id
Content-Type: application/json

{ "tier": "strategic", "status": "active" }
```

### Delete Vendor
```
DELETE /api/vendors/:id
```

### Run AI Risk Assessment
```
POST /api/vendors/:id/assess
```
Requires Pro or Enterprise plan. Returns risk_score, risk_factors, mitigation_recommendations, and creates risk_flags.

---

## Spend Records

### Get Spend Analytics
```
GET /api/spend?groupBy=vendor|category|department|period
```
Optional: `vendor_id`, `from` (YYYY-MM-DD), `to` (YYYY-MM-DD)

### Import Spend Records
```
POST /api/spend
Content-Type: multipart/form-data

file: <csv file>
```
CSV columns: `vendor_id, amount_usd, category, department, period_start, period_end, invoice_ref`

---

## Risk Flags

### List Risk Flags
```
GET /api/risk?severity=critical|high|medium|low&status=open|acknowledged|resolved&vendor_id=...
```

### Create Manual Risk Flag
```
POST /api/risk
Content-Type: application/json

{
  "vendor_id": "...",
  "type": "financial|compliance|operational|reputational",
  "severity": "low|medium|high|critical",
  "description": "Description of the risk..."
}
```

### Update Risk Flag Status
```
PATCH /api/risk/:id
Content-Type: application/json

{ "status": "acknowledged|resolved" }
```

---

## Scorecards

### List Scorecards
```
GET /api/scorecards?vendor_id=...
```

### Create Scorecard
```
POST /api/scorecards
Content-Type: application/json

{
  "vendor_id": "...",
  "period": "2024-Q2",
  "quality_score": 8,
  "delivery_score": 7,
  "communication_score": 9,
  "value_score": 7,
  "notes": "Optional notes"
}
```
`overall_score` is calculated automatically as the average of the 4 dimensions.

---

## Billing

### Create Checkout Session
```
POST /api/billing/create-checkout
Content-Type: application/json

{ "plan": "starter|pro|enterprise" }
```
Returns `{ "url": "https://checkout.stripe.com/..." }` — redirect user to this URL.

### Open Billing Portal
```
POST /api/billing/portal
```
Redirects to Stripe Customer Portal.

---

## Auth

### Invite Team Member
```
POST /api/auth/invite
Content-Type: application/json

{ "email": "colleague@company.com", "role": "admin|member" }
```
Requires owner or admin role.