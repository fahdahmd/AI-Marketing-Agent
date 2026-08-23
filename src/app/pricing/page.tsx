import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PricingTable } from "@/components/marketing/pricing-table";

export const metadata: Metadata = {
  title: "Pricing — AI Marketing Agent",
};

export default function PricingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="container py-16 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Simple, transparent pricing</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Start free. Upgrade as your marketing needs grow. Cancel anytime.
          </p>
        </section>
        <section className="container pb-20">
          <PricingTable />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
