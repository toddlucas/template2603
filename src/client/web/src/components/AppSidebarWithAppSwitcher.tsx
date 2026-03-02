import type { ComponentProps } from "react"
import { NavMain } from "$/features/frame/components/nav-main"
import { NavProjects } from "$/features/frame/components/nav-projects"
import { NavUser } from "$/features/frame/components/nav-user"
import { AppSwitcher } from "./AppSwitcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "$/components/ui/sidebar"
import type { SidebarHandle } from "$/features/frame/components/sidebar-types"

interface AppSidebarProps {
  navMainTitle: string,
  projectsTitle?: string,
  sidebarHandle: SidebarHandle
}

export function AppSidebarWithAppSwitcher({ navMainTitle, projectsTitle, sidebarHandle, ...props }: AppSidebarProps & ComponentProps<typeof Sidebar>) {
  if (!sidebarHandle) {
    return null;
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <AppSwitcher />
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
