import { useLocation } from 'react-router-dom'
import type { SidebarData, SidebarSelection } from '../components/sidebar-types'
import { useCurrentRouteSelection } from './sidebar-utils'

export interface BreadcrumbItem {
  title: string
  url?: string
  isExternal?: boolean
  target?: string
}

interface UseBreadcrumbsProps {
  data: SidebarData
}

// Pure function to generate breadcrumbs from data + selection
export function generateBreadcrumbsFromSelection(data: SidebarData, selection: Partial<SidebarSelection>): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = []

  // Find active nav item by ID
  if (selection.activeNavItemId) {
    const activeNavItem = data.navMain.find(item => item.id === selection.activeNavItemId)
    if (activeNavItem) {
      // Use path for internal routes, url for external routes
      const itemUrl = activeNavItem.isExternal ? (activeNavItem as any).url : (activeNavItem as any).path
      breadcrumbs.push({
        title: activeNavItem.title,
        url: itemUrl || '#',
        isExternal: activeNavItem.isExternal
      })

      // Find active sub-item by ID
      if (selection.activeSubItemId) {
        const activeSubItem = activeNavItem.items.find(item => item.id === selection.activeSubItemId)
        if (activeSubItem) {
          const subItemUrl = activeSubItem.isExternal ? (activeSubItem as any).url : (activeSubItem as any).path
          breadcrumbs.push({
            title: activeSubItem.title,
            url: subItemUrl || '#',
            isExternal: activeSubItem.isExternal
          })
        }
      }
    }
  }

  // Find active project by ID
  if (selection.activeProjectId && data.projects) {
    const activeProject = data.projects.find(project => project.id === selection.activeProjectId)
    if (activeProject) {
      const projectUrl = activeProject.isExternal ? (activeProject as any).url : (activeProject as any).path
      breadcrumbs.push({
        title: activeProject.name,
        url: projectUrl || '#',
        isExternal: activeProject.isExternal
      })
    }
  }

  return breadcrumbs
}

export function useBreadcrumbs({ data }: UseBreadcrumbsProps) {
  const location = useLocation()
  const currentPathname = location.pathname
  const selection = useCurrentRouteSelection()

  // If selection is provided, use it for breadcrumb generation
  if (selection?.activeNavItemId) {
    return generateBreadcrumbsFromSelection(data, selection)
  }

  // Fallback to path-based detection for dashboard routes
  const isDashboardRoute = currentPathname.startsWith('/dashboard') ||
    currentPathname.startsWith('/identity') ||
    currentPathname.startsWith('/models') ||
    currentPathname.startsWith('/playground') ||
    currentPathname.startsWith('/settings') ||
    currentPathname.startsWith('/tools')

  if (isDashboardRoute) {
    // Determine selection from path
    let activeNavItemId = "models"
    let activeSubItemId: string | undefined

    if (currentPathname.startsWith('/identity')) {
      activeNavItemId = "models"
      activeSubItemId = "users"
    } else if (currentPathname.startsWith('/playground')) {
      activeNavItemId = "playground"
    } else if (currentPathname.startsWith('/settings')) {
      activeNavItemId = "settings"
    } else if (currentPathname.startsWith('/tools')) {
      activeNavItemId = "tools"
    } else if (currentPathname.startsWith('/dashboard')) {
      activeNavItemId = "dashboard"
    }

    // Use the pure function with path-derived selection
    return generateBreadcrumbsFromSelection(data, {
      activeTeamId: "acme-inc",
      activeNavItemId,
      activeSubItemId,
      expandedItems: [activeNavItemId]
    })
  }

  // For other routes, generate breadcrumbs from the path
  const pathSegments = currentPathname.split('/').filter(Boolean)

  const breadcrumbs: BreadcrumbItem[] = []
  let currentPath = ''

  pathSegments.forEach((segment) => {
    currentPath += `/${segment}`

    // Convert segment to title (capitalize and replace hyphens with spaces)
    const title = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

    breadcrumbs.push({
      title,
      url: currentPath,
      isExternal: false
    })
  })

  return breadcrumbs
}
