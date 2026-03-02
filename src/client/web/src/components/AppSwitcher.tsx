import { ChevronsUpDown, Loader2 } from "lucide-react"
import { useApp } from "$/contexts/AppContext"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "$/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "$/components/ui/sidebar"

export function AppSwitcher() {
  const { isMobile } = useSidebar()
  const { currentApp, availableApps, switchApp, isLoadingLocales } = useApp()

  if (!currentApp) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg text-lg">
                {currentApp.icon || '📦'}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{currentApp.name}</span>
                <span className="truncate text-xs">Application</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Applications
            </DropdownMenuLabel>
            {isLoadingLocales && (
              <DropdownMenuItem disabled className="gap-2 p-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading translations...</span>
              </DropdownMenuItem>
            )}
            {availableApps.map((app) => (
              <DropdownMenuItem
                key={app.id}
                onClick={() => switchApp(app.id)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border text-sm">
                  {app.icon || '📦'}
                </div>
                {app.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2 text-muted-foreground" disabled>
              <div className="text-xs">
                More apps coming soon...
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
