"use client"

import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  Folder,
  Forward,
  MoreHorizontal,
  Trash2,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "$/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "$/components/ui/sidebar"
import { useAppSidebar } from "../contexts/sidebar-context"
import { isExternalItem, type SidebarProject } from "./sidebar-types"

type ProjectsNavProps = {
  title: string,
  projects: SidebarProject[]
}

export function NavProjects({ title, projects }: ProjectsNavProps) {
  const sidebarHandle = useAppSidebar()  // For selection state and actions
  const { isMobile } = useSidebar()     // For UI state (mobile detection)
  const { t } = useTranslation('frame')

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{t(title)}</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => {
          const isActive = sidebarHandle.selection.activeProjectId === item.id

          return (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                onClick={() => sidebarHandle.actions.onProjectSelect(item.id)}
              >
                {isExternalItem(item) ? (
                  <a href={item.url} target={item.target || '_self'}>
                    <item.icon />
                    <span>{t(item.name)}</span>
                  </a>
                ) : (
                  <Link to={item.path} state={item.state}>
                    <item.icon />
                    <span>{t(item.name)}</span>
                  </Link>
                )}
              </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <MoreHorizontal />
                  <span className="sr-only">t('More')</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem>
                  <Folder className="text-muted-foreground" />
                  <span>{t("View Project")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Forward className="text-muted-foreground" />
                  <span>{t("Share Project")}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Trash2 className="text-muted-foreground" />
                  <span>{t("Delete Project")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
          )
        })}
        <SidebarMenuItem>
          <SidebarMenuButton className="text-sidebar-foreground/70">
            <MoreHorizontal className="text-sidebar-foreground/70" />
            <span>{t("More")}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
