import { useMemo } from "react"
import { Outlet } from "react-router-dom"
import { AppSidebarWithAppSwitcher } from "../components/AppSidebarWithAppSwitcher"
import { type SidebarHandle, type SidebarNavMainItem } from "$/features/frame/components/sidebar-types"
import { BreadcrumbNav } from "$/features/frame/components/breadcrumb-nav"
import { Separator } from "$/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "$/components/ui/sidebar"
import { useAppSidebarHandle } from '$/features/frame/hooks/use-sidebar-handle'
import { AppSidebarProvider } from '$/features/frame/contexts/sidebar-context'
import { data } from '../constants/sidebar-data'
import { LanguageSwitcher, ModeToggle } from "$/components"
import { availableLanguages } from "$/constants/languages"
//import { useInboxStore, selectUnreadCount } from '#mail/features/interaction/store/inbox'
import { useApp } from '$/contexts/AppContext'

export type FrameLayoutHandle = {
  sidebar: SidebarHandle;
}

export default function FrameLayout() {
  //const unreadCount = useInboxStore(selectUnreadCount)
  const { sidebarData: appSidebarData } = useApp()

  // Create dynamic sidebar data with unread count (for main app only)
  const sidebarData = useMemo(() => {
    // Merge app-specific sidebar data with default app data.
    // For POC: if we have app sidebar data, use it, otherwise use default.
    const baseSidebarData = appSidebarData.length > 0 ? {
      user: data.user,
      teams: data.teams,
      navMain: appSidebarData,
      projects: [],
    } : data;

    return {
      ...baseSidebarData,
      navMain: baseSidebarData.navMain.map((item: SidebarNavMainItem) =>
        item.id === 'inbox'
          ? item // { ...item, badge: unreadCount }
          : item
      ),
    };
  }, [appSidebarData])

  // The layout creates the sidebar handle instance
  const sidebarHandle = useAppSidebarHandle({
    initialData: sidebarData,
    initialSelection: {
      activeTeamId: "default-workspace",
      activeNavItemId: "dashboard",
      expandedItems: ["dashboard"]
    }
  })

  return (
    <SidebarProvider>
      <AppSidebarProvider sidebarHandle={sidebarHandle}>
        <AppSidebarWithAppSwitcher navMainTitle="App" sidebarHandle={sidebarHandle} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <BreadcrumbNav
                data={sidebarData}
              />
            </div>
            <div className="flex items-center gap-2">
              <ModeToggle />
              <LanguageSwitcher languages={availableLanguages} />
            </div>
          </header>
          <div className="flex flex-col flex-1 px-4 overflow-hidden">
            <Outlet />
          </div>
        </SidebarInset>
      </AppSidebarProvider>
    </SidebarProvider>
  )
}
