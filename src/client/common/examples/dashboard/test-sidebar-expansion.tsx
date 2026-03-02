import { useEffect } from 'react'
import { useAppSidebar } from '../contexts/sidebar-context'

export function TestSidebarExpansion() {
  const sidebarHandle = useAppSidebar()

  // Test the expansion on mount
  useEffect(() => {
    console.log('Initial sidebar state:', {
      selection: sidebarHandle.selection,
      expandedItems: sidebarHandle.selection.expandedItems,
      isModelsExpanded: sidebarHandle.isItemExpanded('models'),
      isUsersActive: sidebarHandle.isItemActive('models', 'users')
    })

    // Force expand models and select users
    sidebarHandle.actions.onNavItemSelect('models')
    sidebarHandle.actions.onSubItemSelect('users', 'models')
    sidebarHandle.actions.onToggleExpanded('models')

    console.log('After actions:', {
      expandedItems: sidebarHandle.selection.expandedItems,
      isModelsExpanded: sidebarHandle.isItemExpanded('models'),
      isUsersActive: sidebarHandle.isItemActive('models', 'users')
    })
  }, [sidebarHandle])

  return (
    <div className="p-4">
      <h2>Sidebar Expansion Test</h2>
      <div className="space-y-2">
        <p><strong>Models Expanded:</strong> {sidebarHandle.isItemExpanded('models') ? 'Yes' : 'No'}</p>
        <p><strong>Users Active:</strong> {sidebarHandle.isItemActive('models', 'users') ? 'Yes' : 'No'}</p>
        <p><strong>Expanded Items:</strong> {sidebarHandle.selection.expandedItems.join(', ')}</p>
        <p><strong>Active Nav Item:</strong> {sidebarHandle.selection.activeNavItemId}</p>
        <p><strong>Active Sub Item:</strong> {sidebarHandle.selection.activeSubItemId}</p>
      </div>

      <div className="mt-4 space-x-2">
        <button
          onClick={() => sidebarHandle.actions.onToggleExpanded('models')}
          className="px-3 py-1 bg-blue-500 text-white rounded"
        >
          Toggle Models
        </button>
        <button
          onClick={() => sidebarHandle.actions.onNavItemSelect('models')}
          className="px-3 py-1 bg-green-500 text-white rounded"
        >
          Select Models
        </button>
        <button
          onClick={() => sidebarHandle.actions.onSubItemSelect('users', 'models')}
          className="px-3 py-1 bg-purple-500 text-white rounded"
        >
          Select Users
        </button>
      </div>
    </div>
  )
}
