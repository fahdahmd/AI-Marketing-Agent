# AI Marketing Agent

**Your AI Marketing Employee.** Create campaigns, publish social content, improve your SEO, understand your marketing performance, and discover what to do next — all from one AI-powered platform.

Brand/Product → Marketing Idea → AI Campaign → Review → Approval → Publish → Analytics → AI Recommendations → Next Campaign.

Human approval is mandatory for everything that publishes externally — the AI drafts, you decide.

## Features

- **Brand & product management** — onboarding, brand voice, target audience, product catalog with image uploads
- **AI campaign generation** — one call decides the strategic core, a separate call per platform (Instagram/Facebook/LinkedIn/X) writes platform-adapted copy
- **Content review workflow** — edit, regenerate, approve, reject, publish now, or schedule; nothing goes out without approval
- **Social publishing** — provider abstraction with a fully working mock provider and real Instagram/Facebook/LinkedIn/X implementations that activate once OAuth credentials are configured
- **Content calendar** — month and list views across drafts/scheduled/published content
- **Analytics dashboard** — reach, engagement, website traffic, SEO performance, per-platform breakdown, best/worst posts
- **Marketing Score** — transparent, explainable internal scoring (not an industry benchmark)
- **AI recommendation engine** — deterministic rules scan real performance data; AI only writes the explanation, never invents the recommendation
- **SEO module** — keyword ideas, full SEO content generation (articles/product pages/landing pages/FAQs) with a deterministic internal SEO score
- **Paddle billing** — subscription checkout, webhooks, entitlements, usage-based limits, credit tracking
- **Multi-tenant workspaces** — Owner/Member roles, workspace isolation enforced at the service layer

## Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, React, Tailwind CSS, shadcn/ui-style components, Recharts
- **Backend:** Next.js Server Actions & Route Handlers, business logic in `src/server/services`
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** Auth.js (Credentials + JWT), Edge-safe middleware
- **AI:** Provider abstraction — OpenAI (structured outputs) or a schema-driven Mock provider (zero cost, zero credentials)
- **Billing:** Paddle Billing (`@paddle/paddle-node-sdk`, `@paddle/paddle-js`) or a Mock provider
- **Storage:** S3-compatible via `@aws-sdk/client-s3`, or local disk in development
- **Background jobs:** BullMQ/Redis when configured, with a DB-backed poller fallback so scheduled publishing works with or without Redis
- **Testing:** Vitest (30 tests across 8 files)

See [ARCHITECTURE.md](./ARCHITECTURE.md) for how these fit together.

## Local setup

See [SETUP.md](./SETUP.md) for full step-by-step instructions. Quick version:

```bash
npm install
cp .env.example .env          # edit DATABASE_URL etc.
npm run db:migrate
npm run db:seed               # optional — populates a demo account
npm run dev
```

The app runs fully in development **without any external credentials** — AI generation, image generation, social publishing, analytics, and billing all fall back to clearly-labeled mock providers.

Demo login after seeding: `demo@aimarketingagent.dev` / `demo1234`.

## Environment variables

See [`.env.example`](./.env.example) for the full list with comments. Nothing is required to run in development — every external integration has a mock fallback.

## Database

```bash
npm run db:migrate    # apply migrations (dev)
npm run db:studio     # browse data
npm run db:seed       # populate demo data
```

## Testing

```bash
npm test              # run once
npm run test:watch    # watch mode
```

30 tests across workspace isolation, entitlements/credits, content approval, social publishing, recommendation rules, SEO scoring, Paddle webhook idempotency, and user registration.

## Deployment

Build with `npm run build`, run with `npm run start`. Requires a reachable Postgres instance and, for production, real credentials for whichever providers you want to go live with (see `.env.example`). The app degrades gracefully — anything left unconfigured keeps using its mock provider rather than failing to boot.

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — system design, data model, provider abstractions, background jobs
- [SETUP.md](./SETUP.md) — exact local setup, Paddle sandbox setup, running tests
