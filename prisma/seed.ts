import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const DEMO_EMAIL = "demo@aimarketingagent.dev";
const DEMO_PASSWORD = "demo1234";

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(9, 0, 0, 0);
  return d;
}

async function main() {
  console.log("Seeding demo data...");

  // --- Plans ---
  const planConfigs = [
    { key: "FREE" as const, name: "Free", priceMonthly: 0, aiPostsPerMonth: 10, aiImagesPerMonth: 5, seoGenPerMonth: 2, socialAccounts: 1, teamMembers: 1, brands: 1 },
    { key: "STARTER" as const, name: "Starter", priceMonthly: 1900, aiPostsPerMonth: 100, aiImagesPerMonth: 50, seoGenPerMonth: 10, socialAccounts: 3, teamMembers: 1, brands: 1, hasScheduling: true },
    { key: "GROWTH" as const, name: "Growth", priceMonthly: 4900, aiPostsPerMonth: 500, aiImagesPerMonth: 200, seoGenPerMonth: 50, socialAccounts: 10, teamMembers: 5, brands: 3, hasScheduling: true, hasAdvancedAnalytics: true, hasAIRecommendations: true, hasSEOAnalytics: true, hasApprovalWorkflows: true },
    { key: "PRO" as const, name: "Pro", priceMonthly: 9900, aiPostsPerMonth: 1000, aiImagesPerMonth: 500, seoGenPerMonth: 100, socialAccounts: 20, teamMembers: 10, brands: 10, hasScheduling: true, hasAdvancedAnalytics: true, hasAIRecommendations: true, hasSEOAnalytics: true, hasApprovalWorkflows: true, hasPrioritySupport: true },
    { key: "AGENCY" as const, name: "Agency", priceMonthly: 19900, aiPostsPerMonth: 2000, aiImagesPerMonth: 1000, seoGenPerMonth: 200, socialAccounts: 50, teamMembers: 999, brands: 999, hasScheduling: true, hasAdvancedAnalytics: true, hasAIRecommendations: true, hasSEOAnalytics: true, hasApprovalWorkflows: true, hasWhiteLabel: true, hasPrioritySupport: true },
  ];
  const plans: Record<string, { id: string }> = {};
  for (const cfg of planConfigs) {
    plans[cfg.key] = await db.plan.upsert({ where: { key: cfg.key }, create: cfg, update: cfg });
  }

  // --- User + Workspace ---
  await db.user.deleteMany({ where: { email: DEMO_EMAIL } });
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const user = await db.user.create({ data: { name: "Demo User", email: DEMO_EMAIL, passwordHash } });

  const workspace = await db.workspace.create({
    data: {
      name: "Pulse Hydration Co",
      slug: `demo-${Date.now()}`,
      members: { create: { userId: user.id, role: "OWNER" } },
      subscription: {
        create: {
          planId: plans.GROWTH.id,
          status: "ACTIVE",
          currentPeriodStart: daysAgo(15),
          currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  // --- Brand ---
  const brand = await db.brand.create({
    data: {
      workspaceId: workspace.id,
      name: "Pulse Hydration",
      website: "https://pulsehydration.example.com",
      industry: "Fitness & Outdoor Gear",
      description: "Pulse Hydration makes insulated, leakproof water bottles designed for athletes and daily adventurers.",
      targetAudience: "Active young professionals and fitness enthusiasts aged 22-40 who care about sustainability and performance gear.",
      voice: "BOLD",
      customVoiceNotes: "Energetic and confident, never preachy. Lean into movement and momentum imagery.",
      marketingGoals: ["Grow brand awareness", "Drive direct-to-consumer sales", "Build an engaged community"],
      competitors: ["HydroFlask", "Stanley", "Yeti"],
      primaryColor: "#4F46E5",
      secondaryColor: "#111827",
      onboardingCompletedAt: daysAgo(45),
    },
  });

  // --- Products ---
  const product1 = await db.product.create({
    data: {
      brandId: brand.id,
      name: "Pulse Cold Bottle 24H",
      description: "Vacuum-insulated 24oz bottle that keeps water ice-cold for 24 hours and hot drinks warm for 12.",
      price: 34.99,
      currency: "USD",
      productUrl: "https://pulsehydration.example.com/products/cold-bottle-24h",
      features: ["24-hour cold retention", "Leakproof flip lid", "Powder-coated grip", "BPA-free stainless steel"],
      benefits: ["Stays cold all day at the gym or trail", "No condensation ring on your desk", "Durable enough for daily drops"],
      targetAudience: "Gym-goers and hikers who need reliable all-day hydration",
      keywords: ["insulated water bottle", "cold water bottle", "24 hour cold bottle", "gym water bottle"],
      notes: "Best seller. Flagship product for most campaigns.",
    },
  });

  const product2 = await db.product.create({
    data: {
      brandId: brand.id,
      name: "Pulse Sport Cap Bottle",
      description: "Lightweight 20oz bottle with a one-handed sport cap, built for runs and rides.",
      price: 24.99,
      currency: "USD",
      productUrl: "https://pulsehydration.example.com/products/sport-cap",
      features: ["One-handed sport cap", "Lightweight 20oz design", "Non-slip silicone base"],
      benefits: ["Sip without breaking stride", "Fits most bike cage mounts"],
      targetAudience: "Runners and cyclists",
      keywords: ["running water bottle", "cycling water bottle", "sport cap bottle"],
      notes: "Secondary product, newer launch.",
    },
  });

  await db.product.create({
    data: {
      brandId: brand.id,
      name: "Pulse Half-Gallon Jug",
      description: "64oz motivational jug with time markers to hit your daily hydration goal.",
      price: 29.99,
      currency: "USD",
      features: ["Time-marked hydration tracker", "64oz capacity", "Wide mouth for ice"],
      benefits: ["Never lose track of daily water intake", "Great desk companion"],
      targetAudience: "Wellness and productivity-focused professionals",
      keywords: ["half gallon water bottle", "motivational water bottle", "hydration tracker bottle"],
    },
  });

  // --- Social accounts (mock) ---
  const igAccount = await db.socialAccount.create({
    data: {
      brandId: brand.id,
      platform: "INSTAGRAM",
      status: "CONNECTED",
      externalAccountId: "mock_instagram_pulse",
      displayName: "Pulse Hydration",
      handle: "@pulsehydration",
      isMock: true,
      accessTokenEnc: "mock-token-instagram",
    },
  });
  const fbAccount = await db.socialAccount.create({
    data: {
      brandId: brand.id,
      platform: "FACEBOOK",
      status: "CONNECTED",
      externalAccountId: "mock_facebook_pulse",
      displayName: "Pulse Hydration",
      handle: "Pulse Hydration",
      isMock: true,
      accessTokenEnc: "mock-token-facebook",
    },
  });

  // --- Campaigns + Content ---
  const campaignDefs = [
    {
      name: "24-Hour Cold Challenge Launch",
      productId: product1.id,
      objective: "SALES" as const,
      idea: "Create an energetic advertisement for our cold bottle. Emphasize that it keeps water cold for 24 hours.",
      status: "ACTIVE" as const,
      daysAgoCreated: 20,
      content: [
        {
          platform: "INSTAGRAM" as const,
          status: "PUBLISHED" as const,
          hook: "Still cold. 24 hours later.",
          caption: "We put the Pulse Cold Bottle to the test — filled it with ice water and checked back a full day later. Still ice cold. 🧊\n\nBuilt for the gym, the trail, and everywhere in between.",
          cta: "Shop the Cold Bottle",
          hashtags: ["hydration", "coldbottle", "fitnessgear", "pulsehydration", "staycold"],
          publishedDaysAgo: 18,
          engagementRate: 6.8,
        },
        {
          platform: "FACEBOOK" as const,
          status: "PUBLISHED" as const,
          caption: "24 hours. Still cold. That's the Pulse promise. Our vacuum-insulated bottle keeps your water ice cold from sunrise workout to sunset walk.",
          cta: "Shop Now",
          publishedDaysAgo: 17,
          engagementRate: 3.1,
        },
        {
          platform: "LINKEDIN" as const,
          status: "APPROVED" as const,
          hook: "Building gear that keeps up with you.",
          body: "At Pulse, we obsess over the small details — like exactly how long a bottle stays cold. Our 24-hour cold retention test isn't a marketing claim, it's a product spec our team verifies every batch.",
          cta: "Learn about our process",
        },
      ],
    },
    {
      name: "Sport Cap Runner Push",
      productId: product2.id,
      objective: "AWARENESS" as const,
      idea: "Promote the new sport cap bottle to runners and cyclists, emphasizing one-handed sipping.",
      status: "ACTIVE" as const,
      daysAgoCreated: 10,
      content: [
        {
          platform: "INSTAGRAM" as const,
          status: "PUBLISHED" as const,
          hook: "Sip without slowing down.",
          caption: "New: the Pulse Sport Cap Bottle. One-handed sipping so you never have to break your stride.\n\nBuilt for runners, cyclists, and everyone in between.",
          cta: "Meet the Sport Cap",
          hashtags: ["runningear", "cyclinglife", "pulsehydration", "newlaunch"],
          publishedDaysAgo: 8,
          engagementRate: 4.2,
        },
        {
          platform: "X" as const,
          status: "READY_FOR_REVIEW" as const,
          hook: "One hand. Zero slowdown.",
          caption: "The new Pulse Sport Cap Bottle is here — sip mid-run without missing a beat. 🏃",
          cta: "Shop now",
        },
      ],
    },
    {
      name: "Hydration Habit Awareness",
      productId: null,
      objective: "ENGAGEMENT" as const,
      idea: "Educational campaign about daily hydration habits, positioning Pulse as the hydration expert brand.",
      status: "DRAFT" as const,
      daysAgoCreated: 2,
      content: [
        {
          platform: "INSTAGRAM" as const,
          status: "GENERATING" as const,
          hook: null,
          caption: null,
          cta: null,
        },
      ],
    },
  ];

  for (const def of campaignDefs) {
    const campaign = await db.campaign.create({
      data: {
        brandId: brand.id,
        productId: def.productId,
        name: def.name,
        promotionType: def.productId ? "PRODUCT" : "BRAND",
        objective: def.objective,
        idea: def.idea,
        platforms: def.content.map((c) => c.platform),
        status: def.status,
        concept: `A campaign centered on ${def.name.toLowerCase()}.`,
        mainMessage: def.idea,
        headline: def.name,
        cta: "Shop Now",
        creativeDirection: "Bright, high-contrast product photography with an energetic color palette.",
        publishingStrategy: "Post to Instagram first, follow with Facebook and LinkedIn within 24-48 hours.",
        createdAt: daysAgo(def.daysAgoCreated),
      },
    });

    for (const c of def.content) {
      const content = await db.content.create({
        data: {
          campaignId: campaign.id,
          brandId: brand.id,
          platform: c.platform,
          status: c.status,
          hook: "hook" in c ? c.hook : null,
          caption: "caption" in c ? c.caption : null,
          body: "body" in c ? c.body : null,
          cta: "cta" in c ? c.cta : null,
          hashtags: "hashtags" in c ? c.hashtags ?? [] : [],
          approvedAt: c.status === "APPROVED" || c.status === "PUBLISHED" ? daysAgo(def.daysAgoCreated - 1) : null,
        },
      });

      if (c.status === "PUBLISHED" && "publishedDaysAgo" in c) {
        const account = c.platform === "INSTAGRAM" ? igAccount : fbAccount;
        const reach = 800 + Math.round(Math.random() * 2500);
        await db.publishedPost.create({
          data: {
            contentId: content.id,
            socialAccountId: account.id,
            externalPostId: `mock_post_${content.id}`,
            externalUrl: `https://mock.local/${c.platform.toLowerCase()}/pulsehydration/${content.id}`,
            publishedAt: daysAgo(c.publishedDaysAgo!),
            reach,
            impressions: Math.round(reach * 1.3),
            likes: Math.round(reach * (c.engagementRate! / 100) * 0.7),
            comments: Math.round(reach * (c.engagementRate! / 100) * 0.15),
            shares: Math.round(reach * (c.engagementRate! / 100) * 0.15),
            clicks: Math.round(reach * 0.03),
            engagementRate: c.engagementRate!,
          },
        });
      }
    }
  }

  // --- Analytics snapshots (last 30 days) ---
  for (let i = 30; i >= 0; i--) {
    const date = daysAgo(i);
    date.setHours(0, 0, 0, 0);
    const baseReach = 600 + Math.round(Math.random() * 900) + (30 - i) * 15; // slight upward trend
    const engagement = Math.round(baseReach * (0.03 + Math.random() * 0.05));

    await db.analyticsSnapshot.create({
      data: {
        brandId: brand.id,
        socialAccountId: igAccount.id,
        source: "social",
        date,
        reach: baseReach,
        impressions: Math.round(baseReach * 1.3),
        engagement,
        engagementRate: Number(((engagement / baseReach) * 100).toFixed(2)),
        followers: 4200 + (30 - i) * 6,
        isMock: true,
      },
    });

    const visits = 300 + Math.round(Math.random() * 400);
    const leads = Math.round(visits * 0.03);
    await db.analyticsSnapshot.create({
      data: {
        brandId: brand.id,
        source: "google_analytics",
        date,
        websiteVisits: visits,
        leads,
        conversions: Math.round(leads * 0.2),
        isMock: true,
      },
    });

    const impressions = 1200 + Math.round(Math.random() * 900);
    const ctr = Number((2 + Math.random() * 2.5).toFixed(2));
    await db.analyticsSnapshot.create({
      data: {
        brandId: brand.id,
        source: "search_console",
        date,
        organicImpressions: impressions,
        organicClicks: Math.round(impressions * (ctr / 100)),
        ctr,
        avgPosition: Number((10 + Math.random() * 12).toFixed(1)),
        isMock: true,
      },
    });
  }

  // --- SEO ---
  const seoProject = await db.sEOProject.create({ data: { brandId: brand.id, name: "Pulse Hydration SEO" } });

  await db.sEOKeyword.createMany({
    data: [
      { projectId: seoProject.id, keyword: "insulated water bottle", type: "related", searchIntent: "commercial", source: "AI_GENERATED" },
      { projectId: seoProject.id, keyword: "best water bottle for gym", type: "related", searchIntent: "commercial", source: "AI_GENERATED" },
      { projectId: seoProject.id, keyword: "how long does an insulated bottle stay cold", type: "long-tail", searchIntent: "informational", source: "AI_GENERATED" },
      { projectId: seoProject.id, keyword: "leakproof water bottle for gym bag", type: "long-tail", searchIntent: "commercial", source: "AI_GENERATED" },
    ],
  });

  await db.sEOContent.create({
    data: {
      projectId: seoProject.id,
      brandId: brand.id,
      type: "article",
      primaryKeyword: "insulated water bottle",
      secondaryKeywords: ["cold water bottle", "gym water bottle", "24 hour cold bottle"],
      searchIntent: "commercial",
      seoTitle: "Best Insulated Water Bottles for the Gym in 2026",
      metaTitle: "Best Insulated Water Bottles for the Gym (2026 Guide)",
      metaDescription: "Looking for the best insulated water bottle for the gym? See what to look for and why 24-hour cold retention matters for your workouts.",
      outline: ["Why insulation matters for gym-goers", "What to look for in a gym water bottle", "How Pulse Cold Bottle compares", "Care and maintenance tips", "FAQ"],
      article: "# Best Insulated Water Bottles for the Gym\n\nStaying hydrated during a workout is non-negotiable, and the right bottle makes all the difference...\n\n(Full article content generated by AI — 650+ words in production use.)",
      faq: [
        { question: "How long does an insulated bottle stay cold?", answer: "Quality vacuum-insulated bottles like the Pulse Cold Bottle keep water cold for up to 24 hours." },
        { question: "Are insulated bottles dishwasher safe?", answer: "Most brands recommend hand washing to preserve the vacuum seal — check your bottle's care instructions." },
      ],
      internalLinks: ["/products/cold-bottle-24h", "/blog/hydration-tips-for-athletes"],
      seoScore: 84,
    },
  });

  // --- Recommendations ---
  await db.recommendation.create({
    data: {
      brandId: brand.id,
      type: "REPURPOSE_CONTENT",
      title: "Repurpose your top Instagram post",
      explanation: "Your \"Still cold. 24 hours later.\" post is performing 2.2x above your average engagement rate.",
      evidence: { engagementRate: 6.8, averageEngagementRate: 3.1, multiplier: 2.2 },
      priority: "HIGH",
      expectedImpact: "Repurposing this angle for LinkedIn could meaningfully lift engagement there too.",
      action: "Repurpose",
      status: "NEW",
    },
  });

  await db.recommendation.create({
    data: {
      brandId: brand.id,
      type: "PROMOTE_PRODUCT",
      title: "Promote the Half-Gallon Jug",
      explanation: "This product has no campaign yet, despite having strong keyword data available.",
      evidence: { productName: "Pulse Half-Gallon Jug", reason: "never_promoted" },
      priority: "MEDIUM",
      expectedImpact: "A dedicated campaign could introduce this product to your existing audience.",
      action: "Create Campaign",
      status: "NEW",
    },
  });

  // --- Notifications ---
  await db.notification.createMany({
    data: [
      { workspaceId: workspace.id, userId: user.id, type: "campaign.ready_for_review", title: "Campaign ready for review", message: '"Sport Cap Runner Push" has new content ready for review.', href: "/app/content", readAt: null },
      { workspaceId: workspace.id, userId: user.id, type: "content.published", title: "Post published", message: "Your Instagram post was published successfully.", href: "/app/content", readAt: daysAgo(8) },
      { workspaceId: workspace.id, userId: user.id, type: "recommendation.new", title: "New AI recommendation", message: "Repurpose your top Instagram post", href: "/app/recommendations", readAt: null },
    ],
  });

  // --- Audit log ---
  await db.auditLog.createMany({
    data: [
      { workspaceId: workspace.id, userId: user.id, action: "workspace.created", entityType: "Workspace", entityId: workspace.id, createdAt: daysAgo(45) },
      { workspaceId: workspace.id, userId: user.id, action: "brand.created", entityType: "Brand", entityId: brand.id, createdAt: daysAgo(45) },
      { workspaceId: workspace.id, userId: user.id, action: "campaign.created", entityType: "Campaign", entityId: brand.id, createdAt: daysAgo(20) },
    ],
  });

  console.log("\nDemo account ready:");
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log(`  Workspace: ${workspace.name} (${workspace.id})`);
  console.log(`  Brand: ${brand.name} (${brand.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
