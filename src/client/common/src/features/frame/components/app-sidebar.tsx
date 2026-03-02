import type { ComponentProps } from "react"
import { NavMain } from "./nav-main"
import { NavProjects } from "./nav-projects"
import { NavUser } from "./nav-user"
import { TeamSwitcher } from "./team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "$/components/ui/sidebar"
import type { SidebarHandle } from "./sidebar-types"

interface AppSidebarProps {
  navMainTitle: string,
  projectsTitle?: string,
  sidebarHandle: SidebarHandle
}

export function AppSidebar({ navMainTitle, projectsTitle, sidebarHandle, ...props }: AppSidebarProps & ComponentProps<typeof Sidebar>) {
  if (!sidebarHandle) {
    return null;
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarHandle.data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain title={navMainTitle} items={sidebarHandle.data.navMain} />
        {sidebarHandle.data.projects && sidebarHandle.data.projects.length > 0 && projectsTitle && (
          <NavProjects title={projectsTitle} projects={sidebarHandle.data.projects} />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarHandle.data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
