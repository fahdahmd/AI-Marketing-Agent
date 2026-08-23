import Link from "next/link";
import {
  Sparkles,
  Megaphone,
  Share2,
  Search,
  BarChart3,
  ShieldCheck,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PricingTable } from "@/components/marketing/pricing-table";

const HOW_IT_WORKS = [
  { title: "Tell it about your business", body: "Add your brand, products, and a marketing idea." },
  { title: "AI generates the campaign", body: "Platform-specific copy, creative direction, and a publishing strategy." },
  { title: "You review and approve", body: "Edit, regenerate, or approve — nothing publishes without your say-so." },
  { title: "Publish, learn, repeat", body: "Analytics roll in, and the AI recommends what to do next." },
];

const FEATURE_SECTIONS = [
  {
    icon: Megaphone,
    title: "AI campaigns",
    body: "Describe an idea and get a full campaign — concept, headline, CTA, and creative direction — built from your brand and product context.",
  },
  {
    icon: Share2,
    title: "Social media",
    body: "Platform-specific content for Instagram, Facebook, LinkedIn, and X, with realistic previews before anything goes live.",
  },
  {
    icon: Search,
    title: "SEO",
    body: "Keyword research and full SEO content — articles, product pages, FAQs — with an internal content score to guide edits.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    body: "One dashboard for reach, engagement, website traffic, and SEO performance — no more tab-switching between platforms.",
  },
  {
    icon: Lightbulb,
    title: "AI recommendations",
    body: "Rule-based analysis of your real performance data turns into plain-English recommendations you can act on in one click.",
  },
  {
    icon: ShieldCheck,
    title: "Human approval",
    body: "Every post is reviewed and approved by you before it publishes. The AI drafts; you stay in control.",
  },
];

const FAQ = [
  {
    q: "Do I need to connect real social accounts to try it?",
    a: "No — every feature works with simulated (mock) accounts and demo analytics so you can explore the full workflow before connecting anything real.",
  },
  {
    q: "Will content publish automatically?",
    a: "Never without your approval. Every piece of AI-generated content goes through a review step before it can be published or scheduled.",
  },
  {
    q: "Which AI provider do you use?",
    a: "Generation is built on a provider abstraction so it can run on OpenAI or other providers — it's not tied to a single vendor.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. You can cancel your subscription at any time from the Billing page, effective at the end of your current billing period.",
  },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="container flex flex-col items-center gap-6 py-24 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI-powered marketing, human-approved
          </span>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">Your AI Marketing Employee</h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Create campaigns, publish social content, improve your SEO, understand your marketing performance, and
            discover what to do next — all from one AI-powered platform.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/signup">
                Start Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#how-it-works">See How It Works</Link>
            </Button>
          </div>
        </section>

        <section id="how-it-works" className="border-t bg-muted/30 py-20">
          <div className="container">
            <h2 className="text-center text-3xl font-bold tracking-tight">How it works</h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {HOW_IT_WORKS.map((step, i) => (
                <div key={step.title} className="space-y-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {i + 1}
                  </div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container py-20">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURE_SECTIONS.map((f) => (
              <Card key={f.title}>
                <CardHeader>
                  <f.icon className="h-8 w-8 text-primary" />
                  <CardTitle className="pt-2">{f.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{f.body}</CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-t bg-muted/30 py-20">
          <div className="container">
            <h2 className="text-center text-3xl font-bold tracking-tight">Pricing</h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
              Start free. Upgrade as your marketing needs grow.
            </p>
            <div className="mt-12">
              <PricingTable />
            </div>
          </div>
        </section>

        <section id="faq" className="container py-20">
          <h2 className="text-center text-3xl font-bold tracking-tight">Frequently asked questions</h2>
          <div className="mx-auto mt-10 max-w-2xl space-y-6">
            {FAQ.map((item) => (
              <div key={item.q}>
                <h3 className="font-semibold">{item.q}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t py-20">
          <div className="container flex flex-col items-center gap-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Ready to let AI run your marketing loop?</h2>
            <p className="max-w-md text-muted-foreground">
              Start free — no credit card required. Every post still needs your approval before it goes live.
            </p>
            <Button size="lg" asChild>
              <Link href="/signup">
                Start Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
