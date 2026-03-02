import {
  Home,
  Users,
  BarChart3,
  Folder,
  Zap,
  Inbox,
} from "lucide-react"
import type { SidebarData } from "$/features/frame/components/sidebar-types"

// Web application sidebar configuration
export const data: SidebarData = {
  user: {
    name: "User",
    email: "user@example.com",
    avatar: "/avatars/user.jpg",
  },
  teams: [
    {
      id: "default-workspace",
      name: "My Workspace",
      logo: Folder,
      plan: "Pro",
    },
  ],
  navMain: [
    {
      id: "dashboard",
      title: "Dashboard",
      path: "/dashboard",
      icon: Home,
      items: [],
    },
    {
      id: "contacts",
      title: "Contacts",
      path: "/contacts",
      icon: Users,
      items: [
        {
          id: "all-contacts",
          title: "All Contacts",
          path: "/contacts",
        },
        {
          id: "import-contacts",
          title: "Import Contacts",
          path: "/contacts/import",
        },
        {
          id: "tags",
          title: "Tags",
          path: "/settings/tags",
        },
      ],
    },
    {
      id: "inbox",
      title: "Inbox",
      path: "/inbox",
      icon: Inbox,
      items: [
        {
          id: "all-replies",
          title: "All Replies",
          path: "/inbox",
        },
        {
          id: "interested",
          title: "Interested",
          path: "/inbox/interested",
        },
        {
          id: "needs-action",
          title: "Needs Action",
          path: "/inbox/needs-action",
        },
        {
          id: "archived",
          title: "Archived",
          path: "/inbox/archived",
        },
      ],
    },
    {
      id: "sequences",
      title: "Sequences",
      path: "/sequences",
      icon: Zap,
      items: [
        {
          id: "all-sequences",
          title: "All Sequences",
          path: "/sequences",
        },
        {
          id: "email-queue",
          title: "Email Queue",
          path: "/sequences/queue",
        },
        {
          id: "templates",
          title: "Templates",
          path: "/sequences/templates",
        },
      ],
    },
    {
      id: "analytics",
      title: "Analytics",
      path: "/analytics",
      icon: BarChart3,
      items: [
        {
          id: "analytics-dashboard",
          title: "Dashboard",
          path: "/analytics",
        },
        {
          id: "sequence-analytics",
          title: "Sequences",
          path: "/analytics/sequences",
        },
        {
          id: "contact-analytics",
          title: "Contacts",
          path: "/analytics/contacts",
        },
      ],
    },
  ],
  projects: [],
}
