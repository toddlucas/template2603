import type { SidebarHandle } from "$/features/frame/components/sidebar-types"

// Enhanced handle for OrganizationList that includes sidebar integration
export const organizationListHandle = {
  label: 'Organizations',
  icon: 'building',
  path: '/organization',

  // Sidebar configuration for this route
  sidebar: {
    // When this route is active, set these sidebar states
    selection: {
      activeNavItemId: 'models',
      activeSubItemId: 'organizations',
      expandedItems: ['models']
    },

    // Actions to perform when entering this route
    onEnter: (sidebarHandle: SidebarHandle) => {
      sidebarHandle.actions.onNavItemSelect('models')
      sidebarHandle.actions.onSubItemSelect('organizations', 'models')
    },

    // Actions to perform when leaving this route
    onExit: () => {
      // Optional: clear selection or perform cleanup
    }
  }
} as const

// Handle for organization detail view
export const organizationDetailHandle = {
  label: 'Organization Detail',
  icon: 'building',
  path: '/organization/:id',

  // Sidebar configuration for this route
  sidebar: {
    // When this route is active, set these sidebar states
    selection: {
      activeNavItemId: 'models',
      activeSubItemId: 'organizations',
      expandedItems: ['models']
    },

    // Actions to perform when entering this route
    onEnter: (sidebarHandle: SidebarHandle) => {
      sidebarHandle.actions.onNavItemSelect('models')
      sidebarHandle.actions.onSubItemSelect('organizations', 'models')
    },

    // Actions to perform when leaving this route
    onExit: () => {
      // Optional: clear selection or perform cleanup
    }
  }
} as const

// Handle for organization form view
export const organizationFormHandle = {
  label: 'Organization Form',
  icon: 'building',
  path: '/organization/new',

  // Sidebar configuration for this route
  sidebar: {
    // When this route is active, set these sidebar states
    selection: {
      activeNavItemId: 'models',
      activeSubItemId: 'organizations',
      expandedItems: ['models']
    },

    // Actions to perform when entering this route
    onEnter: (sidebarHandle: SidebarHandle) => {
      sidebarHandle.actions.onNavItemSelect('models')
      sidebarHandle.actions.onSubItemSelect('organizations', 'models')
    },

    // Actions to perform when leaving this route
    onExit: () => {
      // Optional: clear selection or perform cleanup
    }
  }
} as const
