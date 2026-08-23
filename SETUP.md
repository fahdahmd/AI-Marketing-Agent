# Setup

## Prerequisites

- Node.js 20+
- A PostgreSQL database (local via Docker, or a hosted instance)
- (Optional) Redis, for real background job queuing
- (Optional) Docker, to run Postgres locally

## 1. Install dependencies

```bash
npm install
```

## 2. Environment variables

```bash
cp .env.example .env
```

Open `.env` and set at minimum `DATABASE_URL` and `AUTH_SECRET`. Generate a secret with:

```bash
openssl rand -base64 32
```

Everything else can stay unset — the app automatically falls back to mock providers for AI, image generation, social publishing, analytics, billing, and object storage. You do not need any external API credentials to run the full application locally.

## 3. Database

### Option A — local Postgres via Docker

```bash
docker run -d --name ai-marketing-agent-db \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=ai_marketing_agent \
  -p 5432:5432 postgres:16-alpine
```

This matches the default `DATABASE_URL` in `.env.example`.

### Option B — hosted Postgres

Point `DATABASE_URL` at your instance (Neon, Supabase, RDS, etc.). Any Postgres 13+ works.

### Apply migrations

```bash
npm run db:migrate
```

### Seed demo data (optional but recommended)

```bash
npm run db:seed
```

Creates a fully populated demo workspace/brand/products/campaigns/analytics/SEO/recommendations. Login: `demo@aimarketingagent.dev` / `demo1234`.

## 4. Run the app

```bash
npm run dev
```

Visit `http://localhost:3000`. Sign up for a new account, or log in with the seeded demo account above.

## 5. Running tests

```bash
npm test          # run once
npm run test:watch
```

Tests connect to the same `DATABASE_URL` as the app (they create/clean up their own scoped rows — no separate test database is required, though using one is fine too).

## AI provider setup (optional)

By default `AI_PROVIDER=mock` — every generation feature works with zero-cost, clearly-labeled `[MOCK]` output. To use real OpenAI generation:

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini        # or another model that supports structured outputs
OPENAI_IMAGE_MODEL=dall-e-3
```

## Object storage setup (optional)

By default `STORAGE_PROVIDER=local` — uploads (product images, brand logos) are written to `public/uploads/` for local development. For production, use an S3-compatible bucket:

```bash
STORAGE_PROVIDER=s3
S3_ENDPOINT=https://...
S3_REGION=auto
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_BUCKET=...
S3_PUBLIC_URL=https://...        # public base URL for uploaded files
```

## Social platform setup (optional)

Each platform falls back to `MockSocialProvider` until its OAuth app credentials are set:

```bash
INSTAGRAM_CLIENT_ID= / INSTAGRAM_CLIENT_SECRET=
FACEBOOK_CLIENT_ID= / FACEBOOK_CLIENT_SECRET=
LINKEDIN_CLIENT_ID= / LINKEDIN_CLIENT_SECRET=
X_CLIENT_ID= / X_CLIENT_SECRET=
```

**Note:** the real provider classes (`src/social/providers/*.ts`) implement the actual publish/analytics API calls and build correct OAuth authorize URLs, but the token-exchange callback route is not implemented in this MVP — connecting a real account currently requires completing that exchange manually or extending `/api/social/[platform]/callback`. See ARCHITECTURE.md and the final report for details.

## Paddle billing setup (optional)

By default `BILLING_PROVIDER=mock` — upgrading/downgrading/canceling all work against your own database with simulated instant "checkout," no Paddle account needed.

To go live with real Paddle billing:

1. **Create a Paddle account** at [paddle.com](https://paddle.com) and switch to **Sandbox** mode for testing.
2. **Create products and prices** in the Paddle dashboard for Starter ($19/mo), Growth ($49/mo), Pro ($99/mo), and Agency ($199/mo). Copy each price ID (`pri_...`).
3. **Get your API credentials** from Paddle → Developer Tools:
   - API key → `PADDLE_API_KEY`
   - Client-side token → `PADDLE_CLIENT_TOKEN`
4. **Set environment variables:**

   ```bash
   BILLING_PROVIDER=paddle
   PADDLE_API_KEY=...
   PADDLE_CLIENT_TOKEN=...
   PADDLE_ENVIRONMENT=sandbox        # or "production" when you go live

   PADDLE_STARTER_PRICE_ID=pri_...
   PADDLE_GROWTH_PRICE_ID=pri_...
   PADDLE_PRO_PRICE_ID=pri_...
   PADDLE_AGENCY_PRICE_ID=pri_...
   ```

5. **Configure the webhook** in Paddle → Developer Tools → Notifications:
   - URL: `https://your-domain.com/api/billing/paddle/webhook` (use a tunnel like `ngrok` for local testing)
   - Subscribe to at least: `subscription.created`, `subscription.activated`, `subscription.updated`, `subscription.canceled`, `subscription.paused`, `subscription.resumed`, `transaction.completed`, `transaction.payment_failed`
   - Copy the webhook secret → `PADDLE_WEBHOOK_SECRET`
6. **Test a checkout** in sandbox using [Paddle's test card numbers](https://developer.paddle.com/concepts/payment-methods/credit-debit-card#test-cards). Confirm the webhook fires and `Subscription`/`PaddleEvent` rows update — check `npm run db:studio`.

Never commit real Paddle credentials. `.env` is gitignored.

## Google Analytics / Search Console setup (optional)

By default, analytics use `MockAnalyticsProvider` (clearly labeled demo data). Setting `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` enables the real provider *classes*, but the OAuth connection flow per brand is not implemented in this MVP — see ARCHITECTURE.md limitations.

## Troubleshooting

- **`prisma generate` / migrate fails with a connection error** — confirm Postgres is running and `DATABASE_URL` is correct (`docker ps` if using the Docker option above).
- **Dev server shows a webpack/module error after switching branches or running `npm run build`** — stop the dev server, delete `.next/`, and restart `npm run dev`. Running a production build while the dev server is live can corrupt its cache.
- **`npm install` fails with an "allow-scripts" warning** — this environment uses a script-execution allowlist; run `npm approve-scripts <package>` for the packages it lists, then `npm install` again.
