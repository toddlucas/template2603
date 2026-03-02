import { useState, useCallback, useMemo, useEffect } from "react"
import type {
  SidebarHandle,
  SidebarSelection,
  SidebarState,
  SidebarActions,
  SidebarData
} from "../components/sidebar-types"
import { generateBreadcrumbsFromSelection } from "./use-breadcrumbs"
import { useCurrentRouteSelection } from "./sidebar-utils"

interface useAppSidebarHandleProps {
  initialData: SidebarData
  initialSelection?: Partial<SidebarSelection>
  initialState?: Partial<SidebarState>
}

export function useAppSidebarHandle({
  initialData,
  initialSelection = {},
  initialState = {}
}: useAppSidebarHandleProps): SidebarHandle {
  const currentRouteSelection = useCurrentRouteSelection()

  // Selection state
  const [selection, setSelection] = useState<SidebarSelection>(() => {
    // Get initial selection from route matches
    if (currentRouteSelection.activeNavItemId) {
      return {
        activeTeamId: currentRouteSelection.activeTeamId,
        activeNavItemId: currentRouteSelection.activeNavItemId,
        activeSubItemId: currentRouteSelection.activeSubItemId,
        activeProjectId: currentRouteSelection.activeProjectId,
        expandedItems: currentRouteSelection.expandedItems || [],
      }
    }

    // Fallback to initial selection if no route provides sidebar data
    return {
      activeTeamId: initialSelection.activeTeamId,
      activeNavItemId: initialSelection.activeNavItemId,
      activeSubItemId: initialSelection.activeSubItemId,
      activeProjectId: initialSelection.activeProjectId,
      expandedItems: initialSelection.expandedItems || [],
    }
  })

  // Update selection when route changes
  useEffect(() => {
    if (currentRouteSelection.activeNavItemId) {
      setSelection(prev => ({
        ...prev,
        activeTeamId: currentRouteSelection.activeTeamId ?? prev.activeTeamId,
        activeNavItemId: currentRouteSelection.activeNavItemId ?? prev.activeNavItemId,
        activeSubItemId: currentRouteSelection.activeSubItemId ?? prev.activeSubItemId,
        activeProjectId: currentRouteSelection.activeProjectId ?? prev.activeProjectId,
        expandedItems: currentRouteSelection.expandedItems ?? prev.expandedItems,
      }))
    }
    // If no route provides sidebar data, keep current selection (don't reset to initial)
  }, [currentRouteSelection])

  // UI state
  const [state, setState] = useState<SidebarState>({
    isCollapsed: initialState.isCollapsed || false,
    isMobile: initialState.isMobile || false,
    isOpen: initialState.isOpen || true,
  })

  // Actions - define each callback separately
  const onTeamSelect = useCallback((teamId: string) => {
    setSelection(prev => ({ ...prev, activeTeamId: teamId }))
  }, [])

  const onNavItemSelect = useCallback((itemId: string) => {
    setSelection(prev => ({
      ...prev,
      activeNavItemId: itemId,
      activeSubItemId: undefined // Clear sub-item when selecting main item
    }))
  }, [])

  const onSubItemSelect = useCallback((itemId: string, parentId: string) => {
    setSelection(prev => ({
      ...prev,
      activeNavItemId: parentId,
      activeSubItemId: itemId
    }))
  }, [])

  const onProjectSelect = useCallback((projectId: string) => {
    setSelection(prev => ({ ...prev, activeProjectId: projectId }))
  }, [])

  const onToggleExpanded = useCallback((itemId: string) => {
    setSelection(prev => ({
      ...prev,
      expandedItems: prev.expandedItems.includes(itemId)
        ? prev.expandedItems.filter(id => id !== itemId)
        : [...prev.expandedItems, itemId]
    }))
  }, [])

  const onToggleCollapse = useCallback(() => {
    setState(prev => ({ ...prev, isCollapsed: !prev.isCollapsed }))
  }, [])

  const onToggleMobile = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: !prev.isOpen }))
  }, [])

  // Create actions object
  const actions: SidebarActions = useMemo(() => ({
    onTeamSelect,
    onNavItemSelect,
    onSubItemSelect,
    onProjectSelect,
    onToggleExpanded,
    onToggleCollapse,
    onToggleMobile,
  }), [
    onTeamSelect,
    onNavItemSelect,
    onSubItemSelect,
    onProjectSelect,
    onToggleExpanded,
    onToggleCollapse,
    onToggleMobile,
  ])

  // Utility methods
  const isItemActive = useCallback((itemId: string, subItemId?: string) => {
    if (subItemId) {
      return selection.activeNavItemId === itemId && selection.activeSubItemId === subItemId
    }
    return selection.activeNavItemId === itemId
  }, [selection])

  const isItemExpanded = useCallback((itemId: string) => {
    return selection.expandedItems.includes(itemId)
  }, [selection])

  const getActiveBreadcrumbs = useCallback(() => {
    // Use the shared breadcrumb generation function
    const breadcrumbItems = generateBreadcrumbsFromSelection(initialData, selection)

    // Convert to the format expected by the sidebar handle
    return breadcrumbItems.map(item => ({
      title: item.title,
      url: item.url || '#'
    }))
  }, [selection, initialData])

  return {
    selection,
    state,
    actions,
    data: initialData,
    isItemActive,
    isItemExpanded,
    getActiveBreadcrumbs,
  }
}
