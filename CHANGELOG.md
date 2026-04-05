# Changelog

All notable changes to VendorPulse are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.0.0] - 2024-01-15

### Added
- Initial release of VendorPulse
- Vendor profiles with tier classification (strategic/preferred/approved/unapproved)
- AI-powered risk assessment using GPT-4o
- AI executive summaries using GPT-4o-mini
- Spend analytics with grouping by vendor, category, department, and period
- Vendor scorecards with 4-dimension rating (quality, delivery, communication, value)
- Contract tracking with expiry alerts and auto-renewal monitoring
- Risk flag management with severity classification and acknowledgement workflow
- CSV import for spend records (papaparse)
- Stripe billing integration (Starter/Pro/Enterprise)
- Supabase Auth with org-scoped Row Level Security
- Rate limiting via Upstash Redis
- Sentry error monitoring (client, server, edge)
- CI/CD pipeline via GitHub Actions
- End-to-end tests with Playwright
- Unit tests with Jest

## [Unreleased]

### Planned
- ERP integrations (NetSuite, SAP, QuickBooks)
- SSO / SAML authentication
- Custom report builder
- Vendor portal (self-service)
- Mobile app (React Native)
- Webhook outbound events