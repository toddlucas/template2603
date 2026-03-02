```tsx
import React from 'react'
import { useAppSidebarHandle } from '$/features/frame/hooks/use-sidebar-handle'
import { data } from '../../constants/sidebar-data'
import type { SidebarHandle } from '$/features/frame/components/sidebar-types'
import UserListWithSidebarExample from '../../features/identity/views/UserList-with-sidebar-example'

//------------------------------
// 1. LAYOUT LEVEL - FrameLayout.tsx
//------------------------------
// The layout provides the sidebar context and manages the overall structure

export function FrameLayoutExample() {
  // The layout creates the sidebar handle instance
  const sidebarHandle = useAppSidebarHandle({
    initialData: data,
    initialSelection: {
      activeTeamId: "acme-inc",
      activeNavItemId: "identity", // This would be set based on current route
      expandedItems: ["identity"]
    }
  })

  return (
    <div className="flex h-screen">
      {/* Sidebar gets the handle as props */}
      <AppSidebarExample sidebarHandle={sidebarHandle} />

      {/* Main content area */}
      <div className="flex-1">
        <header>
          {/* Breadcrumbs generated from sidebar state */}
          <nav>
            {sidebarHandle.getActiveBreadcrumbs().map((crumb, index) => (
              <span key={index}>
                {index > 0 && ' > '}
                <a href={crumb.url}>{crumb.title}</a>
              </span>
            ))}
          </nav>
        </header>

        {/* Route content gets the handle via context or props */}
        <UserListExample sidebarHandle={sidebarHandle} />
      </div>
    </div>
  )
}

//------------------------------
// 2. SIDEBAR COMPONENT - AppSidebar.tsx
//------------------------------
// The sidebar component receives the handle and uses it for rendering and interactions

interface AppSidebarProps {
  sidebarHandle: SidebarHandle
}

export function AppSidebarExample({ sidebarHandle }: AppSidebarProps) {
  return (
    <aside className="w-64 bg-gray-100 p-4">
      <h2>Sidebar</h2>

      {/* Team Switcher */}
      <div className="mb-4">
        <h3>Teams</h3>
        {sidebarHandle.data.teams.map(team => (
          <button
            key={team.name}
            onClick={() => sidebarHandle.actions.onTeamSelect(team.name)}
            className={`block w-full text-left p-2 rounded ${
              sidebarHandle.selection.activeTeamId === team.name
                ? 'bg-blue-200'
                : 'hover:bg-gray-200'
            }`}
          >
            {team.name}
          </button>
        ))}
      </div>

      {/* Navigation Items */}
      <div className="mb-4">
        <h3>Navigation</h3>
        {sidebarHandle.data.navMain.map(navItem => (
          <div key={navItem.title}>
            <button
              onClick={() => sidebarHandle.actions.onNavItemSelect(navItem.title)}
              className={`block w-full text-left p-2 rounded ${
                sidebarHandle.isItemActive(navItem.title)
                  ? 'bg-blue-200'
                  : 'hover:bg-gray-200'
              }`}
            >
              {navItem.title}
            </button>

            {/* Sub-items */}
            {sidebarHandle.isItemExpanded(navItem.title) && (
              <div className="ml-4">
                {navItem.items.map(subItem => (
                  <button
                    key={subItem.title}
                    onClick={() => sidebarHandle.actions.onSubItemSelect(subItem.title, navItem.title)}
                    className={`block w-full text-left p-2 rounded text-sm ${
                      sidebarHandle.isItemActive(navItem.title, subItem.title)
                        ? 'bg-blue-100'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {subItem.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Projects */}
      <div>
        <h3>Projects</h3>
        {sidebarHandle.data.projects.map(project => (
          <button
            key={project.name}
            onClick={() => sidebarHandle.actions.onProjectSelect(project.name)}
            className={`block w-full text-left p-2 rounded ${
              sidebarHandle.selection.activeProjectId === project.name
                ? 'bg-blue-200'
                : 'hover:bg-gray-200'
            }`}
          >
            {project.name}
          </button>
        ))}
      </div>
    </aside>
  )
}

//------------------------------
// 3. PAGE COMPONENT - UserList.tsx
//------------------------------
// The page component receives the handle and uses it for page-specific logic

interface UserListProps {
  sidebarHandle: SidebarHandle
}

export function UserListExample({ sidebarHandle }: UserListProps) {
  // The page component can use the sidebar handle for:

  // 1. Reading current selection state
  const currentTeam = sidebarHandle.selection.activeTeamId
  const currentNavItem = sidebarHandle.selection.activeNavItemId

  // 2. Updating sidebar state based on page actions
  const handleUserSelect = (userId: string) => {
    // When a user is selected, you might want to update the sidebar
    sidebarHandle.actions.onSubItemSelect(`user-${userId}`, 'identity')
  }

  // 3. Getting breadcrumbs for the current context
  const breadcrumbs = sidebarHandle.getActiveBreadcrumbs()

  return (
    <div className="p-6">
      <h1>User List</h1>

      {/* Show current context */}
      <div className="mb-4 p-4 bg-gray-50 rounded">
        <p><strong>Current Team:</strong> {currentTeam}</p>
        <p><strong>Current Section:</strong> {currentNavItem}</p>
        <p><strong>Breadcrumbs:</strong> {breadcrumbs.map(b => b.title).join(' > ')}</p>
      </div>

      {/* Simulated user list */}
      <div className="space-y-2">
        {['user1', 'user2', 'user3'].map(userId => (
          <div
            key={userId}
            className="p-3 border rounded cursor-pointer hover:bg-gray-50"
            onClick={() => handleUserSelect(userId)}
          >
            User {userId}
          </div>
        ))}
      </div>
    </div>
  )
}

//------------------------------
// 4. ROUTE CONFIGURATION
//------------------------------
// How to set up routes with sidebar handles

export const routeConfig = {
  path: '/identity/users',
  element: <UserListWithSidebarExample />,
  handle: {
    sidebar: {
      // This would be the sidebar handle for this specific route
      // You can customize the sidebar behavior per route
      selection: {
        activeNavItemId: 'identity',
        activeSubItemId: 'users',
        expandedItems: ['identity']
      },
      // Route-specific actions
      onEnter: (sidebarHandle: SidebarHandle) => {
        // When entering this route, update sidebar state
        sidebarHandle.actions.onNavItemSelect('identity')
        sidebarHandle.actions.onSubItemSelect('users', 'identity')
      }
    }
  }
}

//------------------------------
// 5. CONTEXT PROVIDER (Alternative Pattern)
//------------------------------
// You could also use React Context to share the sidebar handle

import { createContext, useContext } from 'react'

const SidebarContext = createContext<SidebarHandle | null>(null)

export function SidebarProvider({ children, sidebarHandle }: {
  children: React.ReactNode
  sidebarHandle: SidebarHandle
}) {
  return (
    <SidebarContext.Provider value={sidebarHandle}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}

// Then in any component:
export function AnyComponent() {
  // Example: const sidebarHandle = useSidebar() // Get the handle from context
  // Use sidebarHandle as needed
  return <div>...</div>
}
```
