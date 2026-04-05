# Contributing to VendorPulse

Thank you for your interest in contributing!

## Development Setup

```bash
git clone https://github.com/21leahcimhtiek-oss/vendorpulse
cd vendorpulse
npm install
cp .env.example .env.local
npm run dev
```

## Branching Strategy

- `main` — production-ready code
- `develop` — integration branch
- `feat/*` — new features
- `fix/*` — bug fixes
- `chore/*` — maintenance

## Pull Request Process

1. Branch from `develop`
2. Write/update tests for your changes
3. Ensure `npm run lint` and `npm test` pass
4. Submit PR against `develop`
5. Require 1 approving review

## Code Standards

- TypeScript strict mode
- Zod for all API input validation
- RLS policies for any new database tables
- Rate limit any AI or expensive endpoints

## Commit Convention

```
feat: add vendor CSV export
fix: correct risk score calculation
chore: update dependencies
docs: add API endpoint documentation
```