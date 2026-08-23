import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Marketing Agent — Your AI Marketing Employee",
  description:
    "Create campaigns, publish social content, improve your SEO, understand your marketing performance, and discover what to do next — all from one AI-powered platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
