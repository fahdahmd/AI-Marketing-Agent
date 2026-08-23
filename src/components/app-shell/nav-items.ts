import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Megaphone,
  FileText,
  CalendarDays,
  Package,
  Search,
  BarChart3,
  Sparkles,
  Plug,
  Palette,
  Settings,
  CreditCard,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
  { label: "Campaigns", href: "/app/campaigns", icon: Megaphone },
  { label: "Content", href: "/app/content", icon: FileText },
  { label: "Calendar", href: "/app/calendar", icon: CalendarDays },
  { label: "Products", href: "/app/products", icon: Package },
  { label: "SEO", href: "/app/seo", icon: Search },
  { label: "Analytics", href: "/app/analytics", icon: BarChart3 },
  { label: "Recommendations", href: "/app/recommendations", icon: Sparkles },
  { label: "Integrations", href: "/app/integrations", icon: Plug },
  { label: "Brand", href: "/app/brand", icon: Palette },
  { label: "Settings", href: "/app/settings", icon: Settings },
  { label: "Billing", href: "/app/billing", icon: CreditCard },
];
