import type { SidebarHandle } from "$/features/frame/components/sidebar-types"

// Enhanced handle for UserList that includes sidebar integration
export const userListHandle = {
  label: 'Users',
  icon: 'users',
  path: '/identity/users',

  // Sidebar configuration for this route
  sidebar: {
    // When this route is active, set these sidebar states
    selection: {
      activeNavItemId: 'models',
      activeSubItemId: 'users',
      expandedItems: ['models']
    },

    // Actions to perform when entering this route
    onEnter: (sidebarHandle: SidebarHandle) => {
      sidebarHandle.actions.onNavItemSelect('models')
      sidebarHandle.actions.onSubItemSelect('users', 'models')
    },

    // Actions to perform when leaving this route
    onExit: () => {
      // Optional: clear selection or perform cleanup
    }
  }
} as const
