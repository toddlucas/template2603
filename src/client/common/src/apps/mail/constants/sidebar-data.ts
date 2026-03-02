import { Globe, TrendingUp, Server, Mail } from "lucide-react";
import type { SidebarNavMainItem } from "$/features/frame/components/sidebar-types";

export const mailSidebarData: SidebarNavMainItem[] = [
  {
    id: "mail-overview",
    title: "Overview",
    path: "/mail/overview",
    icon: Mail,
    items: [],
  },
  {
    id: "mail-domains",
    title: "Domains",
    path: "/mail/domains",
    icon: Globe,
    items: [],
  },
  {
    id: "mail-warmup",
    title: "Warmup",
    path: "/mail/warmup",
    icon: TrendingUp,
    items: [],
  },
  {
    id: "mail-dns",
    title: "DNS Records",
    path: "/mail/dns",
    icon: Server,
    items: [],
  },
];
