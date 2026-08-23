# Architecture

## Application architecture

Next.js 14 App Router, server-first. Route handlers and Server Actions stay thin — business logic lives in `src/server/services/*.service.ts`, which is the only layer allowed to talk to Prisma for anything workspace-scoped. Every service function that touches tenant data starts by calling into `src/server/auth/authorize.ts` (`requireWorkspaceMembership`, `requireBrandAccess`, `requireCampaignAccess`, `requireContentAccess`, ...), which is the single choke point enforcing multi-tenant isolation. The UI never makes its own authorization decisions — it only reflects what the server returned.

```
User → Workspace → Brand → { Products, SocialAccounts, Campaigns, Content, Analytics, SEO, Recommendations }
```

A user can belong to multiple workspaces; a workspace can contain multiple brands (limited by plan). Two roles: **Owner** (billing, workspace settings, team, integrations) and **Member** (create/edit content, view analytics) — see `WorkspaceRole` in the schema and `assertRole`/`requireWorkspaceOwner` in `authorize.ts`.

### Directory layout

```
src/
  app/                    # routes (App Router)
    app/                  # everything behind auth — /app/*
    api/                  # route handlers (NextAuth, Paddle webhook)
  server/
    auth/                 # workspace/brand authorization helpers
    services/             # business logic — the only Prisma call site for tenant data
  ai/
    providers/            # AIProvider, ImageProvider + Mock/OpenAI implementations
    prompts/               # per-feature, per-platform prompt builders
    schemas/               # Zod schemas AI output is validated against
    services/              # orchestration: campaign/recommendation/SEO generation
  social/providers/        # SocialProvider + Mock/Instagram/Facebook/LinkedIn/X
  analytics/providers/     # AnalyticsProvider + Mock/Google implementations
  billing/providers/       # BillingProvider + Mock/Paddle implementations
  billing/plans.ts         # single source of truth for plan limits & credit costs
  storage/                 # StorageProvider + Local/S3 implementations
  jobs/                    # BullMQ queue wrapper + DB-backed scheduled-post poller
  components/              # ui/ (primitives), app-shell/, content/, dashboard/, marketing/, billing/
```

## The core loop

```
Brand + Product → Marketing idea → AI campaign generation
  → platform-specific content (READY_FOR_REVIEW)
  → human review (edit / regenerate / approve / reject)
  → publish now or schedule
  → analytics sync
  → rule engine finds opportunities → AI writes the explanation
  → recommendation → accept → pre-filled campaign builder → repeat
```

Everything in this loop is exercised by `tests/` and was verified end-to-end in a real browser during development (see commit messages).

## Database

PostgreSQL + Prisma (`prisma/schema.prisma`). Key model groups:

- **Tenancy:** `User`, `Workspace`, `WorkspaceMember` (role enum), `Brand`
- **Catalog:** `Product`, `ProductImage`
- **Campaign loop:** `Campaign`, `Content`, `ContentVariant` (regeneration history), `SocialAccount`, `ScheduledPost`, `PublishedPost`
- **SEO:** `SEOProject`, `SEOKeyword`, `SEOContent`
- **Analytics:** `AnalyticsSnapshot` (one row per brand/source/date — never fetched live from external APIs on page load)
- **Growth:** `Recommendation`, `AIUsage`
- **Platform:** `Notification`, `AuditLog`
- **Billing:** `Plan`, `Subscription`, `PaddleEvent` (webhook idempotency)

Enums are used throughout for status fields (`ContentStatus`, `CampaignStatus`, `SubscriptionStatus`, `RecommendationStatus`, ...) rather than free-text strings. `PaddleEvent.paddleEventId` is unique — this is what makes webhook processing idempotent.

## AI architecture

`AIProvider` (`src/ai/providers/ai-provider.ts`) exposes `generateText` and `generateStructured<T>(schema, prompt)`. Two implementations:

- **`OpenAIProvider`** — uses Chat Completions with `response_format: { type: "json_schema" }` (via `zod-to-json-schema`), so output is validated against the Zod schema before it's ever stored.
- **`MockAIProvider`** — walks the Zod schema recursively (`mock-data-generator.ts`) and generates plausible placeholder data for *any* schema, so new AI features never need a bespoke mock. Output is always prefixed `[MOCK]`.

Provider selection: `AI_PROVIDER=openai` + `OPENAI_API_KEY` set → OpenAI; otherwise → Mock. Same pattern for `ImageProvider` (`OpenAIImageProvider` using DALL·E, vs. `MockImageProvider` which renders a labeled SVG placeholder — no network call).

**Campaign generation is two-phase**, matching the spec's "don't use one generic prompt for every platform" requirement:

1. One call decides the strategic core (concept, main message, headline, CTA, creative direction, publishing strategy).
2. One call *per selected platform*, each with its own prompt (`src/ai/prompts/social/*.ts`) and its own Zod schema (`src/ai/schemas/content.schema.ts`) — Instagram gets hashtags and a hook, LinkedIn gets a professional tone and a longer body, X is capped at ~280 characters, Facebook skips hashtags entirely.

Recommendation generation follows the same "AI only writes the explanation" principle — see below.

Prompts and schemas are never inlined into route handlers or components; they live in `src/ai/prompts/` and `src/ai/schemas/` exclusively.

## AI usage & credits

Every AI call goes through `recordAIUsage` (`ai-usage.service.ts`), which stores tokens, estimated cost, and `creditsConsumed` (looked up from the single `CREDIT_COSTS` table in `billing/plans.ts` — text=1, image=3, SEO=5). `entitlement.service.ts` is the only place that decides whether a workspace *can* generate something: `assertCanGenerateText/Image/SEO` compare this month's usage against the workspace's plan limits and throw a `UsageLimitError` (which the UI renders as an upgrade prompt) before any AI call is made.

## Social provider architecture

`SocialProvider` (`connectAccount`, `disconnectAccount`, `refreshToken`, `publishPost`, `schedulePost`, `getPosts`, `getAnalytics`). `MockSocialProvider` is fully functional — connecting, publishing, and analytics all work with zero credentials, which is what the demo/dev experience uses. Real `InstagramProvider`/`FacebookProvider`/`LinkedInProvider`/`XProvider` implement the actual platform APIs (Graph API, LinkedIn API v2, X API v2) and activate automatically once that platform's `*_CLIENT_ID`/`*_CLIENT_SECRET` are set (`src/social/providers/index.ts`). OAuth authorize-URL construction is implemented; the token-exchange callback route is not — see **Remaining limitations** in the final report / README.

Publishing has two paths, both going through the same idempotent `processScheduledPost`:

- **Publish now** — `publishContentNow` calls the provider directly inside the request.
- **Schedule** — creates a `ScheduledPost` row (source of truth) and, if Redis is configured, also enqueues a delayed BullMQ job as a faster trigger. Either way, `src/jobs/scheduled-post-poller.ts` polls every 30s for due `PENDING`/`FAILED` rows (capped at 3 attempts) and processes them — so scheduling works correctly with or without Redis.

## Analytics architecture

`AnalyticsSnapshot` stores one row per brand/source/date. Nothing re-fetches from an external API on every dashboard load — a snapshot is synced (via `analytics-sync.service.ts`) and then read from the database. `SocialAnalyticsProvider`, `GoogleAnalyticsProvider`, and `SearchConsoleProvider` are separate small interfaces (different shapes of data) with Mock implementations that generate plausible trending numbers, clearly flagged via `AnalyticsSnapshot.isMock`. Real Google providers are stubbed pending a completed OAuth flow — see limitations.

## Recommendation engine

Two-stage by design (spec section 22): a deterministic rule engine (`src/recommendations/rules.ts`) scans real data — engagement outliers (1.5×+ the brand average → repurpose), products with no campaign in 30 days → promote, missing SEO content where keyword data exists → SEO opportunity — and produces structured `RuleFinding`s. Only then is the AI called, and only to translate one finding into a title/explanation/expected-impact (`recommendation-generation.service.ts`). The `action` button label ("Create Campaign" / "Create SEO Article" / "Repurpose") is deterministic per finding type, not AI-generated, so it's always correct. Findings dedupe against existing active recommendations of the same type+source within a 14-day window.

Accepting a recommendation redirects into the campaign builder (or SEO content form) pre-filled from the recommendation, and marks it `COMPLETED` once that campaign/content is created — this is what makes it "lead directly into an action" rather than a passive card.

## Billing architecture (Paddle)

`BillingProvider` wraps subscription management (`cancelSubscription`, `pauseSubscription`, `resumeSubscription`, `createCustomerPortalSession`). `PaddleBillingProvider` uses `@paddle/paddle-node-sdk`; every method signature was verified against the SDK's own `.d.ts` files and Paddle's current docs rather than assumed. `MockBillingProvider` no-ops those calls — mock "checkout" (`mockSubscribe` in `subscription.service.ts`) instead writes the Subscription row directly, simulating what a webhook would have done, so the whole upgrade/cancel loop is testable without credentials.

**Checkout** happens client-side via Paddle.js overlay checkout (`Paddle.Checkout.open({ items, customData: { workspaceId } })`) — this is Paddle's recommended flow and avoids a server round-trip just to start a purchase. `workspaceId` in `customData` is how the webhook maps a payment back to a tenant.

**Webhooks** (`/api/billing/paddle/webhook` → `paddle-webhook.service.ts`):

1. `paddle.webhooks.unmarshal(rawBody, secret, signature)` verifies the signature (raw body, read via `req.text()`, must never be re-serialized).
2. `PaddleEvent.paddleEventId` (unique) is upserted *before* dispatch; if `processedAt` is already set, the handler returns immediately — this is what makes a duplicate delivery a safe no-op (a webhook may be delivered more than once).
3. Only then does it dispatch on `event.eventType` — `subscription.created/activated/updated` upsert the local `Subscription` row (price ID → internal `Plan` via `getPlanByPaddlePriceId`), `subscription.canceled` downgrades to Free, `subscription.paused` flips status, `transaction.payment_failed` sets `PAST_DUE` and notifies the owner.

Idempotency and dispatch are split into `handleVerifiedPaddleEvent` specifically so they're unit-testable with a synthetic event, without needing real Paddle credentials to exercise signature verification (see `tests/paddle-webhook.test.ts`).

**Entitlements** (`entitlement.service.ts`) only honor a subscription's plan while its status is `ACTIVE`, `TRIALING`, or `PAST_DUE` (grace period) — `PAUSED`/`CANCELED`/`EXPIRED` fall back to Free automatically, everywhere, without each call site needing to remember to check status.

## Background jobs

`src/jobs/queue.ts` wraps BullMQ: when `REDIS_URL` is set, jobs run through a real queue/worker; when it's not, `enqueueOrRun` executes the handler inline for non-delayed jobs. AI generation runs synchronously inside the request (fast enough — seconds — that a queue would add complexity without real benefit for the MVP). Scheduled publishing is the one genuinely time-deferred job, and it doesn't depend on BullMQ being configured — the DB-backed poller (`scheduled-post-poller.ts`, started once via `instrumentation.ts`) is the actual source of truth; BullMQ is just a faster trigger on top of the same idempotent handler when available.

## Future AI agent architecture

The spec's longer-term vision is an agent with tools (`get_brand`, `get_products`, `get_social_analytics`, `create_campaign`, `generate_social_content`, `schedule_post`, ...). The current architecture is already shaped for this: every one of those "tools" already exists as a plain, typed service function in `src/server/services/*` and `src/ai/services/*` with a single clear responsibility and server-side authorization built in. Wrapping a subset of them as OpenAI/Anthropic tool-use functions for an actual conversational agent is additive — it does not require restructuring the service layer. External publishing must continue to require explicit human approval regardless of how the agent evolves; that constraint is enforced at the service layer (`publishContentNow`/`scheduleContent` both require `Content.status === "APPROVED"`), not just in the UI, so it can't be bypassed by a future agent calling services directly.
