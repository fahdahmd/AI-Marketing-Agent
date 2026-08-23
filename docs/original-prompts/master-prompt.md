# BUILD: AI MARKETING AGENT SaaS

You are an expert full-stack SaaS engineer, AI engineer, product architect, UI/UX designer, database architect, and DevOps engineer.

Build a production-quality MVP for an AI-powered SaaS platform called an **AI Marketing Agent**.

The product helps businesses manage their marketing from one platform:

**Brand/Product → Marketing Idea → AI Campaign → Review → Approval → Publish → Analytics → AI Recommendations → Next Campaign**

The long-term vision is:

> **An AI marketing employee that understands a business, creates marketing campaigns, publishes approved content, analyzes performance, and recommends what the business should do next.**

This is NOT simply an AI copywriting tool.

The application should combine:

- AI social media content generation
- AI advertising creative generation
- Social media publishing
- Content scheduling
- SEO assistance
- Marketing analytics
- AI-powered recommendations
- Campaign management
- Brand management
- Product management
- Subscription billing

Human approval must remain mandatory for external publishing in the MVP.

---

# 1. DEVELOPMENT PHILOSOPHY

Build a real SaaS application, not a static prototype.

Requirements:

- Production-quality architecture
- Clean TypeScript
- Modular services
- Secure authentication
- Multi-tenant architecture
- Proper database design
- API validation
- Error handling
- Loading states
- Empty states
- Responsive UI
- Background jobs where appropriate
- Provider abstractions for external integrations
- Test important business logic
- No hardcoded secrets
- No fake production integrations

If an external API cannot be configured during development, create a proper provider abstraction and a development/mock provider.

Do not block development because external API credentials are unavailable.

---

# 2. RECOMMENDED STACK

Use:

## Frontend

- Next.js
- TypeScript
- React
- Tailwind CSS
- shadcn/ui
- TanStack Query where useful

## Backend

Use Next.js server-side functionality/API routes/server actions where appropriate.

Keep business logic inside service modules rather than putting everything directly inside route handlers.

## Database

- PostgreSQL
- Prisma ORM

## Authentication

Use a modern authentication provider such as:

- Clerk

or

- Auth.js

Choose one and implement it cleanly.

Authentication should be abstract enough that it can be changed later.

## AI

Initially use OpenAI.

Create an abstraction:

```text
AIProvider
```

so another provider such as Anthropic can be added later.

## Billing

Use:

# Paddle

Do NOT use Stripe.

Paddle should be the billing provider and merchant of record.

## Storage

Use S3-compatible object storage for:

- Product images
- Brand logos
- Generated creatives
- Other user uploads

## Background jobs

Use a queue/background-job architecture where useful.

Redis/BullMQ is acceptable.

Use background processing for tasks such as:

- AI generation
- Scheduled publishing
- Analytics synchronization
- Long-running processing

Do not unnecessarily introduce infrastructure when a simpler implementation is sufficient.

---

# 3. PRODUCT CORE LOOP

The most important workflow in the application is:

```text
User creates account
        ↓
Creates workspace
        ↓
Creates brand
        ↓
Adds product
        ↓
Describes marketing idea
        ↓
AI understands brand + product + goal
        ↓
AI generates campaign
        ↓
AI generates platform-specific content
        ↓
AI generates advertising creative
        ↓
User reviews
        ↓
User edits/regenerates
        ↓
User approves
        ↓
Publish immediately OR schedule
        ↓
Analytics are collected
        ↓
AI analyzes performance
        ↓
AI generates recommendations
        ↓
User selects recommendation
        ↓
AI creates next campaign
```

This loop is the heart of the product.

Prioritize it above secondary features.

---

# 4. MULTI-TENANT ARCHITECTURE

This is a SaaS application.

Use this conceptual structure:

```text
User
 ↓
Workspace
 ↓
Brand
 ├── Products
 ├── Social Accounts
 ├── Campaigns
 ├── Content
 ├── Analytics
 ├── SEO
 └── Recommendations
```

A user can belong to one or more workspaces.

A workspace can contain multiple brands.

Every tenant-owned record must be associated with the correct workspace/brand.

Never allow one workspace to access another workspace's data.

Enforce authorization at the server/service layer, not only in the UI.

---

# 5. USER ROLES

Initially support:

## Owner

Full access including:

- Billing
- Workspace settings
- Team management
- Integrations

## Member

Can:

- Create campaigns
- Generate content
- Edit content
- View analytics
- Create recommendations/actions

Members cannot:

- Change billing
- Delete workspace
- Change ownership

Structure authorization so additional roles can be added later.

---

# 6. MAIN APPLICATION NAVIGATION

Create a polished SaaS dashboard with a sidebar:

```text
Dashboard
Campaigns
Content
Calendar
Products
SEO
Analytics
Recommendations
Integrations
Brand
Settings
Billing
```

Top bar:

- Workspace selector
- Brand selector
- Notifications
- User menu

---

# 7. BRAND ONBOARDING

Create a first-time onboarding flow.

Collect:

- Brand name
- Website
- Industry
- Description
- Target audience
- Brand voice
- Marketing goals
- Competitors (optional)
- Logo
- Brand colors

Brand voice options:

- Professional
- Friendly
- Bold
- Educational
- Funny
- Luxury
- Casual

Also allow custom brand instructions.

Store this information and include it in AI context.

---

# 8. PRODUCT MANAGEMENT

Users can create products/services.

Fields:

```text
Name
Description
Price
Currency
Product URL
Features
Benefits
Target audience
Keywords
Images
Additional notes
```

Allow image uploads.

Store images in object storage.

The AI should use product information when generating marketing campaigns.

---

# 9. CAMPAIGN CREATION

Create `/app/campaigns/new`.

Fields:

## What are you promoting?

- Product
- Service
- Brand
- Website
- Custom

## Objective

- Awareness
- Engagement
- Website traffic
- Leads
- Sales
- Product launch
- Promotion
- Retargeting

## Marketing idea

Large text input.

Example:

> Create an energetic advertisement for our new fitness bottle. Emphasize that it keeps water cold for 24 hours.

## Target audience

Optional override.

## Tone

Optional override.

## Platforms

Initially support:

- Instagram
- Facebook
- LinkedIn
- X

Prioritize Instagram/Facebook if platform integration complexity requires phased implementation.

---

# 10. AI CAMPAIGN GENERATION

When generating a campaign, provide the AI with structured context:

```text
Brand Context
Product Context
Campaign Objective
User Idea
Target Audience
Tone
Platform
Previous Performance
```

The AI should generate a campaign containing:

- Campaign concept
- Main message
- Headline
- CTA
- Platform-specific copy
- Hashtags where appropriate
- Creative direction
- Suggested publishing strategy

Do not use one generic prompt for every platform.

---

# 11. PLATFORM-SPECIFIC CONTENT

Generate platform-specific versions.

## Instagram

Generate:

- Caption
- Hook
- CTA
- Hashtags
- Creative concept

## Facebook

Generate:

- Post copy
- CTA
- Creative concept

## LinkedIn

Generate:

- Professional post
- Hook
- CTA

## X

Generate:

- Short-form post
- Hook
- CTA

The content should be adapted to the platform rather than simply copied.

---

# 12. AI IMAGE GENERATION

Create an image-generation abstraction.

Example:

```text
ImageProvider
```

The image generation system should use:

- Product information
- Product image
- Brand identity
- Campaign objective
- User's idea
- Target audience
- Platform

Allow users to:

- Generate
- Regenerate
- Modify prompt
- Choose a version

The generated creative should be stored.

Do not force image generation when the user only wants text content.

---

# 13. CONTENT REVIEW WORKFLOW

Human approval is mandatory.

Content statuses:

```text
DRAFT
GENERATING
READY_FOR_REVIEW
APPROVED
SCHEDULED
PUBLISHING
PUBLISHED
FAILED
REJECTED
```

Review screen:

- Platform preview
- Caption
- Creative
- CTA
- Hashtags
- Scheduling options

Actions:

```text
Edit
Regenerate
Approve
Reject
Publish Now
Schedule
```

Never publish automatically without explicit user approval.

---

# 14. SOCIAL MEDIA INTEGRATION ARCHITECTURE

Create a provider abstraction:

```text
SocialProvider
```

Capabilities:

```text
connectAccount()
disconnectAccount()
refreshToken()
publishPost()
schedulePost()
getPosts()
getAnalytics()
```

Providers:

```text
InstagramProvider
FacebookProvider
LinkedInProvider
XProvider
MockSocialProvider
```

Use OAuth where required.

Store tokens securely on the server.

Never expose access tokens to the browser.

If a platform requires approval or special permissions, use the mock provider during development.

---

# 15. CONTENT CALENDAR

Create a calendar with:

- Month view
- Week view
- List view

Show:

- Drafts
- Ready-for-review content
- Approved content
- Scheduled content
- Published content
- Failed posts

Allow:

- Open
- Edit
- Approve
- Reschedule
- Delete

Where practical, support drag-and-drop rescheduling.

---

# 16. SEO MODULE

Create `/app/seo`.

The SEO module should support:

## Keyword ideas

User enters a topic/keyword.

Generate:

- Related keywords
- Long-tail keywords
- Search intent
- Content ideas
- Keyword clusters

Do NOT invent search-volume numbers.

Clearly distinguish between:

```text
AI-generated keyword suggestions
```

and

```text
Verified SEO data
```

when a real SEO data source is connected.

---

# 17. SEO CONTENT GENERATION

Generate:

- SEO articles
- Product descriptions
- Landing-page copy
- Meta titles
- Meta descriptions
- FAQs
- Content briefs
- Internal linking suggestions

For an article generate:

```text
Primary keyword
Secondary keywords
Search intent
SEO title
Meta title
Meta description
Outline
Full article
FAQ section
Internal link suggestions
```

Provide an internal SEO content score.

Example:

```text
SEO Score: 82/100
```

Evaluate:

- Keyword placement
- Title
- Meta description
- Headings
- Readability
- Search intent
- Content completeness
- Internal linking opportunities

Clearly state that this score is an internal AI/content score and does NOT guarantee search rankings.

---

# 18. SEO ANALYTICS

Design the architecture to support:

- Google Search Console
- Google Analytics

Eventually show:

- Organic clicks
- Impressions
- CTR
- Average position
- Organic traffic
- Top pages
- Top queries
- Traffic trends

If external credentials are unavailable, use a clearly labeled mock/demo provider.

Never mix fake data with production data without labeling it.

---

# 19. ANALYTICS DASHBOARD

Create `/app/analytics`.

Display:

## Overview

- Reach
- Impressions
- Engagement
- Engagement rate
- Followers
- Website visits
- Leads
- Conversions

## Social performance

Break down performance by platform.

## Content performance

Show:

- Best posts
- Worst posts
- Reach
- Engagement
- Clicks
- Conversions where available

## SEO

Show:

- Organic traffic
- Impressions
- Clicks
- CTR
- Position trends

Date filters:

```text
7 days
30 days
90 days
```

Use polished charts.

---

# 20. MARKETING SCORE

Create:

```text
Marketing Score: 78/100
```

Break it into:

```text
Social Media
Content
SEO
Engagement
Conversion
```

The scoring system should be transparent and configurable.

Make it clear that this is an internal product metric, not an official industry score.

---

# 21. AI RECOMMENDATION ENGINE

This is one of the most important features.

Create an AI recommendation engine that analyzes:

- Social analytics
- SEO analytics
- Previous campaigns
- Products
- Published content
- Engagement
- Website traffic
- Content performance

Generate actionable recommendations.

Example:

> **Promote Product X again**

Reason:

> Posts featuring Product X generated 42% higher engagement than your average posts.

CTA:

**Create Campaign**

Another:

> **Create content targeting "CRM software for small businesses"**

Reason:

> Your website has no dedicated content for this topic.

CTA:

**Create SEO Article**

Another:

> **Repurpose your LinkedIn post**

Reason:

> This post is performing 2.8× above your average engagement.

CTA:

**Repurpose**

Each recommendation should contain:

```text
Type
Title
Explanation
Evidence
Priority
Expected impact
Action
Status
```

Statuses:

```text
NEW
VIEWED
ACCEPTED
DISMISSED
COMPLETED
```

---

# 22. RULE + AI RECOMMENDATION ARCHITECTURE

Do not rely entirely on an LLM to discover every recommendation.

Initially combine deterministic rules with AI.

Examples:

```text
IF engagement_rate > average * 1.5
THEN recommend_replication

IF product has no recent promotion
THEN recommend_product_campaign

IF organic traffic is low
AND keyword opportunity exists
THEN recommend_seo_content

IF a post significantly outperforms average
THEN recommend_repurpose
```

Then pass the structured findings to the AI to generate:

- Human-readable explanation
- Priority
- Suggested action
- Campaign idea

This makes the recommendation engine more reliable.

---

# 23. AI MARKETING AGENT FOUNDATION

Create an agent architecture that can eventually use tools.

Potential tools:

```text
get_brand()
get_products()
get_social_analytics()
get_seo_analytics()
get_top_posts()
get_recent_campaigns()

create_campaign()
generate_social_content()
generate_seo_content()
generate_image()

schedule_post()
```

The MVP agent should primarily:

- Analyze
- Recommend
- Generate

External publishing must still require explicit user approval.

Do not build unrestricted autonomous actions.

---

# 24. AI PROVIDER ARCHITECTURE

Create:

```text
AIProvider
```

Possible implementation:

```text
OpenAIProvider
MockAIProvider
```

Structure:

```text
ai/
  providers/
  prompts/
    campaigns/
    social/
    seo/
    recommendations/
    image/
  services/
  schemas/
```

Do not scatter AI prompts throughout the codebase.

Use structured outputs/JSON wherever practical.

Validate AI responses before storing them.

---

# 25. AI USAGE TRACKING

Track AI usage by workspace.

Track:

- Text generations
- Image generations
- SEO generations
- Tokens where available
- Estimated cost
- Credits consumed

Create:

```text
AIUsageService
```

This will be important for controlling SaaS margins.

---

# 26. CREDIT SYSTEM

Create a configurable credit system.

Example:

```text
Text generation = 1 credit
Image generation = 3 credits
SEO article = 5 credits
AI video = 10 credits
```

Do NOT scatter these values throughout the application.

Create a configuration/service layer.

The billing system should be able to determine:

```text
plan → monthly credits → usage → remaining credits
```

---

# 27. PRICING PLANS

Implement the following initial pricing structure.

## FREE

$0/month

- 1 social account
- 10 AI posts/month
- 5 AI images/month
- 2 SEO generations/month
- Basic dashboard
- 1 brand

## STARTER

$19/month

- 3 social accounts
- 100 AI posts/month
- 50 AI images/month
- 10 SEO generations/month
- Scheduling
- Brand voice
- Content calendar
- Basic analytics
- 1 brand

## GROWTH

$49/month

- 10 social accounts
- 500 AI posts/month
- 200 AI images/month
- 50 SEO generations/month
- Advanced analytics
- AI recommendations
- SEO analytics
- Approval workflows
- 5 team members
- Multiple brands

## PRO

$99/month

- 20 social accounts
- 1,000 AI posts/month
- 500 AI images/month
- 100 SEO generations/month
- Advanced AI recommendations
- Advanced analytics
- Multiple brands
- 10 team members
- Priority AI generation

## AGENCY

$199/month

- 50 social accounts
- 2,000 AI posts/month
- 1,000 AI images/month
- 200 SEO generations/month
- Unlimited team members
- Multiple brands
- Client management
- White-label capabilities
- Priority support

Do not hardcode these values throughout the application.

Store plan configuration centrally.

---

# 28. PADDLE BILLING — IMPORTANT

Use **Paddle**, NOT Stripe.

Paddle should handle subscription billing and act as the merchant of record.

Build a dedicated billing abstraction:

```text
BillingProvider
```

Initial implementation:

```text
PaddleBillingProvider
MockBillingProvider
```

The application should not tightly couple business logic directly to Paddle API calls.

---

# 29. PADDLE PRODUCT/PRICE ARCHITECTURE

Create Paddle products/prices for:

```text
Starter
Growth
Pro
Agency
```

The Free plan does not require a paid Paddle subscription.

Do not hardcode Paddle price IDs directly throughout the application.

Use environment variables/configuration such as:

```text
PADDLE_STARTER_PRICE_ID=
PADDLE_GROWTH_PRICE_ID=
PADDLE_PRO_PRICE_ID=
PADDLE_AGENCY_PRICE_ID=
```

The database should store the relationship between internal plans and Paddle price IDs.

---

# 30. PADDLE ENVIRONMENT

Support Paddle's appropriate environment configuration.

Use environment variables for:

```text
PADDLE_API_KEY=
PADDLE_CLIENT_TOKEN=
PADDLE_WEBHOOK_SECRET=
PADDLE_ENVIRONMENT=
```

The application must support development/sandbox mode separately from production.

Never commit Paddle credentials.

---

# 31. PADDLE CHECKOUT

Implement a pricing page.

When the user selects a paid plan:

```text
User selects plan
       ↓
Application creates/initializes Paddle checkout
       ↓
User completes payment
       ↓
Paddle processes transaction
       ↓
Paddle sends webhook
       ↓
Application verifies webhook
       ↓
Subscription is created/updated
       ↓
Workspace entitlements are updated
```

Do not grant permanent access based solely on a frontend checkout success callback.

The server-side subscription state must ultimately be synchronized using Paddle's server-side events/webhooks.

---

# 32. PADDLE WEBHOOKS

Create a secure Paddle webhook endpoint.

Example:

```text
/api/billing/paddle/webhook
```

Verify webhook authenticity/signatures according to Paddle's current API/webhook requirements.

Handle relevant subscription/transaction lifecycle events.

At minimum, design for:

```text
subscription created
subscription activated
subscription updated
subscription canceled
subscription paused
subscription resumed
transaction completed
transaction/payment-related failure
```

Use Paddle's current official event names and payload schemas when implementing the integration.

Do not guess Paddle webhook schemas.

Make the webhook handler idempotent.

A webhook may be delivered more than once.

Store event IDs and prevent duplicate processing.

---

# 33. SUBSCRIPTION DATABASE

Create a subscription model containing information such as:

```text
Workspace
Internal plan
Paddle customer ID
Paddle subscription ID
Paddle price ID
Status
Current period start
Current period end
Cancel at period end
Created at
Updated at
```

Use enums for subscription status.

Do not depend exclusively on Paddle data at request time.

Maintain a synchronized local entitlement/subscription state.

---

# 34. ENTITLEMENT SYSTEM

Create an entitlement service:

```text
EntitlementService
```

It should answer:

```text
Can this workspace generate an AI post?
Can this workspace generate an image?
Can this workspace create SEO content?
How many social accounts are allowed?
How many team members are allowed?
How many brands are allowed?
Does this plan have advanced analytics?
Does this plan have AI recommendations?
```

Example:

```text
workspace.plan
       ↓
entitlements
       ↓
feature access
       ↓
usage limits
```

This should be the single source of truth for application feature access.

---

# 35. BILLING PAGE

Create:

```text
/app/billing
```

Display:

- Current plan
- Subscription status
- Monthly usage
- Credits remaining
- Renewal date
- Upgrade
- Downgrade
- Cancel
- Billing management

Where appropriate, use Paddle's customer/subscription management functionality rather than unnecessarily rebuilding billing management.

---

# 36. USAGE LIMITS

When a user reaches a limit:

Show something like:

> You've used all 100 AI post generations included in your Starter plan.

CTA:

**Upgrade Plan**

Do not simply return a generic server error.

Enforce limits server-side.

The frontend should also display usage.

---

# 37. PADDLE SECURITY REQUIREMENTS

Never:

- Put Paddle secret keys in client code.
- Trust client-provided subscription status.
- Grant paid access solely because the checkout UI reports success.
- Process unverified webhooks.
- Assume webhook events arrive exactly once.
- Store sensitive payment details yourself.

Paddle should handle payment information.

Your application should primarily store Paddle identifiers and subscription/entitlement state.

---

# 38. DATABASE MODELS

Create appropriate Prisma models.

At minimum consider:

```text
User
Workspace
WorkspaceMember
Brand
Product
ProductImage
SocialAccount

Campaign
Content
ContentVariant
ScheduledPost
PublishedPost

SEOProject
SEOKeyword
SEOContent

AnalyticsSnapshot
Recommendation

AIUsage
Notification
AuditLog

Subscription
Plan
Entitlement
PaddleEvent
```

Use:

- Proper relationships
- Indexes
- Enums
- Created/updated timestamps
- Unique constraints where appropriate

Store Paddle event IDs uniquely to support webhook idempotency.

---

# 39. SOCIAL ANALYTICS

Create an analytics provider abstraction.

```text
AnalyticsProvider
```

Possible providers:

```text
SocialAnalyticsProvider
GoogleAnalyticsProvider
SearchConsoleProvider
MockAnalyticsProvider
```

Synchronize analytics periodically using background jobs.

Store snapshots rather than requesting every metric from external APIs every time the dashboard loads.

---

# 40. DASHBOARD

The main dashboard should show:

## Marketing Score

```text
78/100
```

## Overview metrics

- Reach
- Engagement
- Website traffic
- Followers
- SEO traffic
- Leads
- Conversions

## Top content

Show the best-performing recent posts.

## AI Recommended Actions

Show actionable recommendations.

Example:

> **Double down on Product X**

> Your Product X posts are outperforming your average engagement by 42%.

Button:

**Create Campaign**

---

# 41. RECOMMENDATION EXPERIENCE

Recommendations should not be passive cards.

A recommendation should lead directly into an action.

Example:

```text
Recommendation
      ↓
View explanation
      ↓
Accept
      ↓
Campaign Builder opens
      ↓
AI pre-fills campaign
      ↓
User reviews
      ↓
Generate
      ↓
Approve
      ↓
Publish
```

This should make the AI feel like an actual marketing assistant.

---

# 42. CONTENT EDITOR

Users must be able to edit AI-generated output.

Editable:

- Headline
- Caption
- CTA
- Hashtags
- SEO title
- Meta description
- Article
- Image prompt

Actions:

```text
Save
Regenerate
Undo where practical
Approve
```

Never lock users into AI output.

---

# 43. SOCIAL PREVIEWS

Create realistic previews.

Example:

```text
Instagram Preview
┌─────────────────────┐
│ Brand               │
│                     │
│      [IMAGE]        │
│                     │
│ ❤️  💬  ↗           │
│                     │
│ Caption...          │
│ #hashtags           │
└─────────────────────┘
```

Create platform-specific previews where practical.

---

# 44. NOTIFICATIONS

Build notification infrastructure.

Examples:

```text
Your campaign is ready for review.

Your post was published successfully.

Your scheduled post failed.

You have a new AI recommendation.

Your subscription was updated.
```

Support read/unread status.

---

# 45. AUDIT LOG

Create an audit log.

Track:

```text
Campaign created
AI content generated
Content edited
Content approved
Content rejected
Content published
Content scheduled
Social account connected
Social account disconnected
Subscription changed
Plan changed
Recommendation accepted
Recommendation dismissed
```

This is important for trust and debugging.

---

# 46. SECURITY

Implement:

- Authentication
- Authorization
- Workspace isolation
- Input validation
- Rate limiting where appropriate
- Secure OAuth storage
- Server-only secrets
- Secure file uploads
- File size/type validation
- CSRF protection where applicable
- Audit logging

Do not trust frontend authorization.

All important authorization decisions must happen server-side.

---

# 47. ERROR HANDLING

Gracefully handle:

- AI provider failures
- Image generation failures
- Social API failures
- OAuth expiration
- API rate limits
- Publishing failures
- Analytics failures
- Paddle webhook failures
- Database errors
- Invalid input

Show useful user-facing messages.

Never expose stack traces to users.

---

# 48. DEVELOPMENT/DEMO PROVIDERS

Create:

```text
MockAIProvider
MockImageProvider
MockSocialProvider
MockAnalyticsProvider
MockBillingProvider
```

The entire application should be usable in development without external credentials.

However:

- Mock data must be clearly labeled.
- Mock providers must be replaceable.
- Production code must not accidentally use mock providers.

---

# 49. LANDING PAGE

Create a premium SaaS landing page.

Hero:

> **Your AI Marketing Employee**

Supporting text:

> Create campaigns, publish social content, improve your SEO, understand your marketing performance, and discover what to do next — all from one AI-powered platform.

CTA:

**Start Free**

Secondary:

**See How It Works**

Sections:

- How it works
- AI campaigns
- Social media
- SEO
- Analytics
- AI recommendations
- Human approval
- Pricing
- FAQ
- Final CTA

Do not make claims such as:

- Guaranteed Google rankings
- Guaranteed sales
- Guaranteed viral content

---

# 50. APPLICATION ROUTES

Create:

```text
/
 /pricing
 /login
 /signup

/app
 /app/dashboard

 /app/campaigns
 /app/campaigns/new
 /app/campaigns/[id]

 /app/content
 /app/calendar

 /app/products
 /app/products/new
 /app/products/[id]

 /app/seo
 /app/seo/keywords
 /app/seo/content

 /app/analytics
 /app/recommendations

 /app/integrations
 /app/brand
 /app/settings
 /app/billing
```

Protect `/app/*`.

---

# 51. API ARCHITECTURE

Create clean API boundaries such as:

```text
/api/brands
/api/products
/api/campaigns
/api/content
/api/social
/api/analytics
/api/seo
/api/recommendations
/api/ai
/api/billing
/api/billing/paddle/webhook
```

Use:

- Authentication
- Authorization
- Request validation
- Consistent errors
- Appropriate HTTP status codes

Keep business logic out of route handlers when possible.

---

# 52. BACKGROUND JOBS

Create jobs for:

```text
generateCampaign
generateImage
publishScheduledPost
syncSocialAnalytics
syncGoogleAnalytics
syncSearchConsole
generateRecommendations
processPaddleEvents
```

Do not make the browser wait for long-running tasks.

Provide progress/status updates.

---

# 53. TESTING

Write tests for critical business logic.

At minimum test:

- Authentication
- Authorization
- Workspace isolation
- Campaign creation
- AI orchestration
- Content approval
- Credit deduction
- Usage limits
- Recommendation generation
- Subscription entitlements
- Paddle webhook verification/processing
- Webhook idempotency
- Plan upgrades/downgrades
- Social publishing service

Add integration tests for important API routes.

Do not chase meaningless 100% coverage.

---

# 54. SEED DATA

Create realistic development seed data:

- Demo workspace
- Demo brand
- 2–3 products
- Campaigns
- Posts
- Analytics
- SEO data
- Recommendations

The dashboard should look populated immediately in development/demo mode.

---

# 55. ONBOARDING FLOW

First-time user:

```text
Create account
      ↓
Create workspace
      ↓
Create brand
      ↓
Add product
      ↓
Connect social account
OR
Use demo mode
      ↓
Generate first campaign
      ↓
Review
      ↓
Approve
      ↓
Publish/schedule
      ↓
View dashboard
```

Keep onboarding fast.

---

# 56. PERFORMANCE

Optimize:

- Initial page load
- Database queries
- Dashboard queries
- Image loading
- API calls
- Background jobs

Use:

- Pagination
- Database indexes
- Caching where useful
- Server-side fetching where appropriate
- Image optimization
- Lazy loading

Do not over-engineer caching before it is needed.

---

# 57. MVP PRIORITY

If scope becomes too large, follow this priority order.

## P0

1. Authentication
2. Workspace
3. Brand
4. Product
5. Campaign creation
6. AI social generation
7. Review/edit/approve
8. Social provider architecture
9. Dashboard
10. Analytics
11. Recommendations
12. Paddle billing

## P1

13. Scheduling
14. Content calendar
15. SEO generation
16. SEO analytics
17. Multiple social platforms
18. Team members

## P2

19. AI images
20. Advanced recommendations
21. Agent tools
22. Advanced analytics
23. Multiple brands
24. Agency features
25. White-labeling

If necessary, use mock providers for P0 integrations while building the rest of the application.

---

# 58. DO NOT BUILD YET

Do not spend excessive time on:

- Fully autonomous publishing
- AI video generation
- Complex competitor intelligence
- Advanced A/B testing
- Full SEO crawler
- Enterprise SSO
- Complex CRM integrations
- Dozens of social networks

The core loop is more important.

---

# 59. ENVIRONMENT VARIABLES

Create `.env.example`.

Include:

```text
DATABASE_URL=

AUTH_SECRET=

OPENAI_API_KEY=

PADDLE_API_KEY=
PADDLE_CLIENT_TOKEN=
PADDLE_WEBHOOK_SECRET=
PADDLE_ENVIRONMENT=

PADDLE_STARTER_PRICE_ID=
PADDLE_GROWTH_PRICE_ID=
PADDLE_PRO_PRICE_ID=
PADDLE_AGENCY_PRICE_ID=

S3_ENDPOINT=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_BUCKET=

INSTAGRAM_CLIENT_ID=
INSTAGRAM_CLIENT_SECRET=

FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=

LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=

X_CLIENT_ID=
X_CLIENT_SECRET=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

REDIS_URL=
```

Never commit actual secrets.

---

# 60. GITHUB

Initialize Git if necessary.

Create meaningful commits throughout development.

Example:

```text
feat: initialize SaaS architecture
feat: add authentication and workspaces
feat: add brand management
feat: add product management
feat: add AI campaign generation
feat: add content review workflow
feat: add social provider architecture
feat: add analytics dashboard
feat: add AI recommendations
feat: add SEO module
feat: add Paddle billing
test: add core business logic tests
fix: resolve publishing workflow issues
```

Do not make one giant commit.

If a GitHub remote already exists, inspect it first.

Provided repository:

```text
https://github.com/Fahad28may/AI-CRM-Agent.git
```

IMPORTANT:

The repository name suggests another project.

Before pushing:

1. Inspect the existing repository.
2. Determine whether it is actually intended for this application.
3. Do not overwrite an unrelated repository.
4. If confirmed as the target repository, configure the remote.

Use:

```bash
git remote add origin https://github.com/Fahad28may/AI-CRM-Agent.git
git branch -M main
git push -u origin main
```

If `origin` already exists, inspect it instead of adding it again.

Push meaningful commits throughout development.

---

# 61. DOCUMENTATION

Create:

```text
README.md
ARCHITECTURE.md
SETUP.md
```

README:

- Product description
- Features
- Stack
- Local setup
- Environment variables
- Database setup
- Testing
- Deployment

ARCHITECTURE:

- Application architecture
- Database architecture
- AI architecture
- Social provider architecture
- Analytics architecture
- Recommendation engine
- Billing architecture
- Paddle integration
- Background jobs
- Future AI agent architecture

SETUP:

- Exact local installation steps
- Database setup
- Environment setup
- Paddle sandbox setup
- AI provider setup
- Social integrations
- Running tests
- Running development server

---

# 62. PADDLE IMPLEMENTATION DETAILS

When implementing Paddle:

- Use Paddle's current official API/documentation.
- Do not guess API endpoints.
- Do not guess webhook event names or payload fields.
- Verify webhook signatures according to Paddle's current documentation.
- Make webhook processing idempotent.
- Maintain local subscription state.
- Map Paddle prices to internal plans.
- Separate sandbox/development configuration from production.
- Never expose secret credentials to the client.
- Use Paddle's hosted/customer management capabilities where appropriate.
- Do not store payment card information.
- Keep billing logic behind `BillingProvider`.

If Paddle's current SDK/API has changed from assumptions in this prompt, use the current official implementation rather than blindly following an outdated example.

---

# 63. FINAL QUALITY CHECK

Before declaring the project complete:

Run the actual application.

Verify:

1. Authentication
2. Workspace creation
3. Brand creation
4. Product creation
5. Campaign creation
6. AI generation
7. Content editing
8. Approval workflow
9. Mock publishing
10. Analytics dashboard
11. Recommendations
12. SEO generation
13. Usage tracking
14. Credit limits
15. Pricing page
16. Paddle integration
17. Paddle webhook handling
18. Subscription synchronization
19. Entitlement enforcement
20. Upgrade/downgrade flow
21. Cancellation flow
22. Responsive UI
23. Loading states
24. Error states
25. Empty states
26. Tests
27. TypeScript
28. Lint
29. Database migrations

Fix problems you discover.

Do not simply report that something should work.

Actually run and verify it.

---

# 64. FINAL OUTPUT

When development is complete, report:

## Built

List major completed features.

## Working

List features verified locally.

## Mocked

List integrations currently using mock providers.

## External credentials required

List required credentials.

## Paddle setup

Explain:

- Products/prices needed
- Webhook URL
- Environment variables
- Sandbox testing
- How subscription synchronization works

## Tests

Report actual test results.

## Git

Report:

- Branch
- Commit count
- Latest commits
- Push status

## Remaining limitations

Clearly list anything that is intentionally incomplete.

---

# FINAL PRODUCT STANDARD

The finished application should feel like a **real, modern SaaS product**.

The user should be able to go from:

> "I have a product and here's the idea for my advertisement."

to:

> **AI generates the campaign → user reviews it → user approves it → campaign is published → analytics are collected → AI explains the results → AI recommends the next marketing action.**

That complete feedback loop is the most important thing to build.

Build the foundation so that the product can eventually evolve from an AI content generator into a true **AI Marketing Agent**.