import { useAppSidebarHandle } from '$/features/frame/hooks/use-sidebar-handle'
import { data } from '../../constants/sidebar-data'

// Example of how to use the sidebar handle in a route component
export function ExampleRouteWithSidebar() {
  const sidebarHandle = useAppSidebarHandle({
    initialData: data,
    initialSelection: {
      activeTeamId: "acme-inc",
      activeNavItemId: "playground",
      expandedItems: ["playground"]
    },
    initialState: {
      isCollapsed: false,
      isMobile: false,
      isOpen: true
    }
  })

  // Example usage of the sidebar handle
  const handleNavClick = (itemId: string) => {
    sidebarHandle.actions.onNavItemSelect(itemId)
  }

  const handleSubNavClick = (itemId: string, parentId: string) => {
    sidebarHandle.actions.onSubItemSelect(itemId, parentId)
  }

  const handleTeamSwitch = (teamId: string) => {
    sidebarHandle.actions.onTeamSelect(teamId)
  }

  // Get breadcrumbs for the current selection
  const breadcrumbs = sidebarHandle.getActiveBreadcrumbs()

  return (
    <div>
      <h1>Example Route with Sidebar Handle</h1>

      {/* Example of using selection state */}
      <div>
        <h2>Current Selection:</h2>
        <p>Active Team: {sidebarHandle.selection.activeTeamId || 'None'}</p>
        <p>Active Nav Item: {sidebarHandle.selection.activeNavItemId || 'None'}</p>
        <p>Active Sub Item: {sidebarHandle.selection.activeSubItemId || 'None'}</p>
        <p>Active Project: {sidebarHandle.selection.activeProjectId || 'None'}</p>
      </div>

      {/* Example of using state */}
      <div>
        <h2>Current State:</h2>
        <p>Collapsed: {sidebarHandle.state.isCollapsed ? 'Yes' : 'No'}</p>
        <p>Mobile: {sidebarHandle.state.isMobile ? 'Yes' : 'No'}</p>
        <p>Open: {sidebarHandle.state.isOpen ? 'Yes' : 'No'}</p>
      </div>

      {/* Example of using breadcrumbs */}
      <div>
        <h2>Breadcrumbs:</h2>
        <nav>
          {breadcrumbs.map((crumb, index) => (
            <span key={index}>
              {index > 0 && ' > '}
              <a href={crumb.url}>{crumb.title}</a>
            </span>
          ))}
        </nav>
      </div>

      {/* Example action buttons */}
      <div>
        <h2>Actions:</h2>
        <button onClick={() => handleNavClick('models')}>
          Select Models
        </button>
        <button onClick={() => handleSubNavClick('genesis', 'models')}>
          Select Genesis (under Models)
        </button>
        <button onClick={() => handleTeamSwitch('acme-corp')}>
          Switch to Acme Corp
        </button>
        <button onClick={sidebarHandle.actions.onToggleCollapse}>
          Toggle Collapse
        </button>
      </div>
    </div>
  )
}
