# Deploying VendorPulse to Vercel

## Prerequisites

- [Vercel account](https://vercel.com)
- Supabase project
- Stripe account with products created
- OpenAI API key
- Upstash Redis instance
- Sentry project

## Step 1: Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the migration: `supabase db push` or paste `supabase/migrations/001_initial_schema.sql` into the SQL editor
3. Enable Email Auth in Authentication > Providers
4. Copy your Project URL and anon key from Settings > API

## Step 2: Stripe Setup

1. Create products in Stripe Dashboard:
   - **Starter**: $89/month recurring
   - **Pro**: $229/month recurring
   - **Enterprise**: $549/month recurring
2. Copy the Price IDs
3. Set up a webhook pointing to `https://your-domain.com/api/billing/webhook`
4. Add these events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

## Step 3: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Or connect via Vercel Dashboard:
1. Import your GitHub repository
2. Set Framework Preset to **Next.js**
3. Add all environment variables (see below)

## Environment Variables

Add these in Vercel Dashboard > Settings > Environment Variables:

```
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...
OPENAI_API_KEY=sk-...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_ORG=your-org
SENTRY_PROJECT=vendorpulse
SENTRY_AUTH_TOKEN=sntrys_...
```

## Step 4: Configure Custom Domain

1. In Vercel Dashboard > Domains, add your custom domain
2. Update `NEXT_PUBLIC_APP_URL` to your custom domain
3. Update Stripe webhook URL to `https://yourdomain.com/api/billing/webhook`
4. Update Supabase Redirect URLs in Authentication > URL Configuration

## Step 5: Verify Deployment

1. Visit your domain — landing page should load
2. Create an account — check Supabase Auth dashboard
3. Add a vendor — verify data appears in Supabase table viewer
4. Test Stripe checkout with test mode cards

## Monitoring

- **Sentry**: Visit your Sentry project for error monitoring
- **Vercel Analytics**: Enable in Vercel Dashboard > Analytics
- **Supabase**: Monitor queries in Supabase Dashboard > Logs