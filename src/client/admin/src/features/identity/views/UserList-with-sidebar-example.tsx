import { useEffect } from 'react'
import { useAppSidebar } from '$/features/frame/contexts/sidebar-context'

export default function UserListWithSidebarExample() {
  const sidebarHandle = useAppSidebar()

  // When this component mounts, select "Users" under "Models"
  useEffect(() => {
    // Select the main navigation item first
    sidebarHandle.actions.onNavItemSelect('models')

    // Then select the sub-item
    sidebarHandle.actions.onSubItemSelect('users', 'models')

    // Ensure the Models section is expanded
    sidebarHandle.actions.onToggleExpanded('models')
  }, [sidebarHandle.actions])

  // Get current selection state
  const currentNavItem = sidebarHandle.selection.activeNavItemId
  const currentSubItem = sidebarHandle.selection.activeSubItemId
  const isExpanded = sidebarHandle.isItemExpanded('models')
  const isActive = sidebarHandle.isItemActive('models', 'users')

  return (
    <div className="p-6">
      <h1>User List</h1>

      {/* Show current sidebar state */}
      <div className="mb-4 p-4 bg-gray-50 rounded">
        <h2>Current Sidebar State:</h2>
        <p><strong>Main Nav:</strong> {currentNavItem}</p>
        <p><strong>Sub Item:</strong> {currentSubItem}</p>
        <p><strong>Models Expanded:</strong> {isExpanded ? 'Yes' : 'No'}</p>
        <p><strong>Users Active:</strong> {isActive ? 'Yes' : 'No'}</p>
      </div>

      {/* Your user list content */}
      <div>
        <p>This is the Users page under Models in the sidebar.</p>
        <p>The sidebar should show "Models" as the active main item and "Users" as the active sub-item.</p>
      </div>
    </div>
  )
}
