import { ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "$/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "$/components/ui/sidebar"
import { Badge } from "$/components/ui/badge"
import { useAppSidebar } from "../contexts/sidebar-context"
import { isExternalItem, isExpandOnlyItem, type SidebarNavMainItem } from "./sidebar-types"

type MainNavProps = {
  title: string,
  items: SidebarNavMainItem[]
}

export function NavMain({ title, items }: MainNavProps) {
  const sidebarHandle = useAppSidebar()
  const { t } = useTranslation('frame')

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t(title)}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const hasSubItems = item.items && item.items.length > 0
          const isExpanded = sidebarHandle.isItemExpanded(item.id)
          const isExpandOnly = isExpandOnlyItem(item)
          const isActive = isExpandOnly ? false : sidebarHandle.isItemActive(item.id)

          // Items without sub-items render as direct links
          if (!hasSubItems) {
            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isActive}
                >
                  {isExternalItem(item) ? (
                    <a
                      href={item.url}
                      target={item.target || '_self'}
                      onClick={() => sidebarHandle.actions.onNavItemSelect(item.id)}
                    >
                      {item.icon && <item.icon />}
                      <span>{t(item.title)}</span>
                    </a>
                  ) : 'path' in item ? (
                    <Link
                      to={item.path}
                      onClick={() => sidebarHandle.actions.onNavItemSelect(item.id)}
                    >
                      {item.icon && <item.icon />}
                      <span>{t(item.title)}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <Badge variant="destructive" className="ml-auto">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  ) : (
                    <span>
                      {item.icon && <item.icon />}
                      <span>{t(item.title)}</span>
                    </span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

          // Items with sub-items render as collapsible
          return (
            <Collapsible
              key={item.id}
              asChild
              open={isExpanded}
              onOpenChange={() => sidebarHandle.actions.onToggleExpanded(item.id)}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    onClick={() => {
                      if (!isExpandOnly) {
                        sidebarHandle.actions.onNavItemSelect(item.id)
                      }
                    }}
                    isActive={isActive}
                  >
                    {item.icon && <item.icon />}
                    <span>{t(item.title)}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {item.badge}
                      </Badge>
                    )}
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => {
                      const isSubItemActive = sidebarHandle.isItemActive(item.id, subItem.id)

                      return (
                        <SidebarMenuSubItem key={subItem.id}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isSubItemActive}
                          >
                            {isExternalItem(subItem) ? (
                              <a
                                href={subItem.url}
                                target={subItem.target || '_self'}
                                onClick={() => sidebarHandle.actions.onSubItemSelect(subItem.id, item.id)}
                              >
                                <span>{t(subItem.title)}</span>
                              </a>
                            ) : (
                              <Link
                                to={subItem.path}
                                state={subItem.state}
                                onClick={() => sidebarHandle.actions.onSubItemSelect(subItem.id, item.id)}
                              >
                                <span>{t(subItem.title)}</span>
                              </Link>
                            )}
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
