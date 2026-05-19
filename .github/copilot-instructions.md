# Copilot Instructions

## Build, test, and lint commands

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run test`
- `npm run test:e2e`

## High-level architecture

- Supabase assets live in-repo, so schema or auth changes should be coordinated with the `supabase/` directory.
- Deployment is Vercel-oriented; keep repo instructions aligned with the files and commands used for Vercel builds.

## Key conventions

- Thank you for your interest in contributing!
- cp .env.example .env.local
- Use `.env.example` as the source of truth for configurable services; notable variables include `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, ....

<!-- Generated from repo-local docs/config on 2026-05-18 for 21leahcimhtiek-oss/vendorpulse. -->
