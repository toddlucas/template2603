import { useBreadcrumbs } from './use-breadcrumbs'
import type { SidebarData } from '../components/sidebar-types'

export default function BreadcrumbTest() {
  const breadcrumbs = useBreadcrumbs({ data: {} as SidebarData })

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Breadcrumb Test</h1>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">Current Breadcrumbs:</h2>
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify(breadcrumbs, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Test Routes:</h2>
          <div className="space-y-2">
            <a href="/identity/users" className="block text-blue-600 hover:underline">
              /identity/users (Dashboard route with custom breadcrumbs)
            </a>
            <a href="/account/change-password" className="block text-blue-600 hover:underline">
              /account/change-password (Account route with custom breadcrumbs)
            </a>
            <a href="/account/email" className="block text-blue-600 hover:underline">
              /account/email (Account route with custom breadcrumbs)
            </a>
            <a href="/dashboard" className="block text-blue-600 hover:underline">
              /dashboard (Auto-generated breadcrumbs)
            </a>
            <a href="/some/random/path" className="block text-blue-600 hover:underline">
              /some/random/path (Auto-generated breadcrumbs)
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
