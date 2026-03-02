import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react"
import type { SidebarData } from "$/features/frame/components/sidebar-types"

// This is sample data.
export const data: SidebarData = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      id: "acme-inc",
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      id: "acme-corp",
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      id: "evil-corp",
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      id: "playground",
      title: "Playground",
      path: "/playground",
      icon: SquareTerminal,
      //isActive: true,
      items: [
        {
          id: "history",
          title: "History",
          path: "/playground/history",
        },
        {
          id: "starred",
          title: "Starred",
          path: "/playground/starred",
        },
        {
          id: "playground-settings",
          title: "Settings",
          path: "/playground/settings",
        },
      ],
    },
    {
      id: "models",
      title: "Models",
      path: "/models",
      icon: Bot,
      items: [
        {
          id: "genesis",
          title: "Genesis",
          path: "/models/genesis",
        },
        {
          id: "users",
          title: "Users",
          path: "/identity/users",
        },
        {
          id: "organizations",
          title: "Organizations",
          path: "/organization",
        },
        {
          id: "explorer",
          title: "Explorer",
          path: "/models/explorer",
        },
        {
          id: "quantum",
          title: "Quantum",
          path: "/models/quantum",
        },
      ],
    },
    {
      id: "documentation",
      title: "Documentation",
      isExternal: true,
      url: "https://docs.example.com",
      target: "_blank",
      icon: BookOpen,
      items: [
        {
          id: "introduction",
          title: "Introduction",
          isExternal: true,
          url: "https://docs.example.com/intro",
          target: "_blank",
        },
        {
          id: "get-started",
          title: "Get Started",
          isExternal: true,
          url: "https://docs.example.com/get-started",
          target: "_blank",
        },
        {
          id: "tutorials",
          title: "Tutorials",
          isExternal: true,
          url: "https://docs.example.com/tutorials",
          target: "_blank",
        },
        {
          id: "changelog",
          title: "Changelog",
          isExternal: true,
          url: "https://docs.example.com/changelog",
          target: "_blank",
        },
      ],
    },
    {
      id: "settings",
      title: "Settings",
      path: "/settings",
      icon: Settings2,
      items: [
        {
          id: "general",
          title: "General",
          path: "/settings/general",
        },
        {
          id: "team",
          title: "Team",
          path: "/settings/team",
        },
        {
          id: "billing",
          title: "Billing",
          path: "/settings/billing",
        },
        {
          id: "limits",
          title: "Limits",
          path: "/settings/limits",
        },
      ],
    },
    {
      id: "tools",
      title: "Tools",
      icon: Command,
      expandOnly: true,  // This item only expands/collapses, doesn't navigate
      items: [
        {
          id: "calculator",
          title: "Calculator",
          path: "/tools/calculator",
        },
        {
          id: "converter",
          title: "Unit Converter",
          path: "/tools/converter",
        },
        {
          id: "generator",
          title: "Code Generator",
          path: "/tools/generator",
        },
      ],
    },
  ],
  projects: [
    {
      id: "design-engineering",
      name: "Design Engineering",
      path: "/projects/design-engineering",
      icon: Frame,
    },
    {
      id: "sales-marketing",
      name: "Sales & Marketing",
      path: "/projects/sales-marketing",
      icon: PieChart,
    },
    {
      id: "travel",
      name: "Travel",
      isExternal: true,
      url: "https://travel.example.com",
      target: "_blank",
      icon: Map,
    },
  ],
}
