import type { LucideIcon } from "lucide-react"

//------------------------------
// Base types for discriminated unions
//------------------------------

// Base interface for all sidebar items
export interface BaseSidebarItem {
  id: string
  isExternal?: boolean
}

// Internal route properties
export interface InternalRoute {
  isExternal?: false
  path: string
  state?: any
}

// External URL properties
export interface ExternalRoute {
  isExternal: true
  url: string
  target?: '_blank' | '_self'
}

//------------------------------
// Type definitions for the sidebar data structure
//------------------------------

export interface SidebarUser {
  name: string
  email: string
  avatar: string
}

export interface SidebarTeam {
  id: string
  name: string
  logo: LucideIcon
  plan: string
}

// Navigation item with base types
export type SidebarNavItem = BaseSidebarItem & {
  title: string
} & (InternalRoute | ExternalRoute)

// Main navigation item with base types
export type SidebarNavMainItem = BaseSidebarItem & {
  title: string
  icon: LucideIcon
  isActive?: boolean
  badge?: number  // Optional badge count to display
  items: SidebarNavItem[]
  expandOnly?: boolean  // If true, item only expands/collapses, doesn't navigate or become active
} & (InternalRoute | ExternalRoute | { expandOnly: true })

// Project with base types
export type SidebarProject = BaseSidebarItem & {
  name: string
  icon: LucideIcon
} & (InternalRoute | ExternalRoute)

export interface SidebarData {
  user: SidebarUser
  teams: SidebarTeam[]
  navMain: SidebarNavMainItem[]
  projects?: SidebarProject[]
}

//------------------------------
// Sidebar selection state types
//------------------------------

export interface SidebarSelection {
  activeTeamId?: string
  activeNavItemId?: string
  activeSubItemId?: string
  activeProjectId?: string
  expandedItems: string[]
}

// Sidebar state management
export interface SidebarState {
  isCollapsed: boolean
  isMobile: boolean
  isOpen: boolean
}

// Sidebar actions/callbacks
export interface SidebarActions {
  onTeamSelect: (teamId: string) => void
  onNavItemSelect: (itemId: string) => void
  onSubItemSelect: (itemId: string, parentId: string) => void
  onProjectSelect: (projectId: string) => void
  onToggleExpanded: (itemId: string) => void
  onToggleCollapse: () => void
  onToggleMobile: () => void
}

// Main sidebar handle type for React Router
export interface SidebarHandle {
  // Selection state
  selection: SidebarSelection

  // Current state
  state: SidebarState

  // Actions
  actions: SidebarActions

  // Data
  data: SidebarData

  // Utility methods
  isItemActive: (itemId: string, subItemId?: string) => boolean
  isItemExpanded: (itemId: string) => boolean
  getActiveBreadcrumbs: () => Array<{ title: string; url: string }>
}

//------------------------------
// Generic type guards that work with any sidebar item
//------------------------------

export function isExternalItem<T extends BaseSidebarItem>(item: T): item is T & ExternalRoute {
  return item.isExternal === true
}

export function isInternalItem<T extends BaseSidebarItem>(item: T): item is T & InternalRoute {
  return !item.isExternal
}

export function isExpandOnlyItem<T extends BaseSidebarItem & { expandOnly?: boolean }>(item: T): item is T & { expandOnly: true } {
  return item.expandOnly === true
}
