import { useMatches } from 'react-router-dom'
import type { SidebarSelection } from '../components/sidebar-types'

export interface RouteBreadcrumbHandle {
  breadcrumbs?: {
    title: string
    url?: string
    isExternal?: boolean
    target?: string
  }[]
  breadcrumbTitle?: string
  sidebar?: {
    selection?: Partial<SidebarSelection>
  }
}

/**
 * Hook to get the current sidebar selection from route matches.
 * Looks for sidebar selection in route handles from most specific to least specific.
 *
 * @returns The current sidebar selection from route handles, or empty object if none found
 */
export function useCurrentRouteSelection(): Partial<SidebarSelection> {
  const matches = useMatches()

  // Look for sidebar selection in route handles (from most specific to least specific)
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i]
    const handle = match.handle as RouteBreadcrumbHandle | undefined

    if (handle?.sidebar?.selection) {
      return handle.sidebar.selection
    }
  }

  return {}
}

/**
 * Pure function to get sidebar selection from route matches.
 * This can be used in non-hook contexts or for testing.
 *
 * @param matches - Array of route matches from React Router
 * @returns The sidebar selection from route handles, or empty object if none found
 */
export function getCurrentRouteSelection(matches: any[]): Partial<SidebarSelection> {
  // Look for sidebar selection in route handles (from most specific to least specific)
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i]
    const handle = match.handle as RouteBreadcrumbHandle | undefined

    if (handle?.sidebar?.selection) {
      return handle.sidebar.selection
    }
  }

  return {}
}
