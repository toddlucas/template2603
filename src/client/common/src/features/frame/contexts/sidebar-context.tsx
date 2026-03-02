import { createContext, useContext, type ReactNode } from 'react'
import type { SidebarHandle } from '../components/sidebar-types'

// Create the context
const SidebarContext = createContext<SidebarHandle | null>(null)

// Provider component
interface AppSidebarProviderProps {
  children: ReactNode
  sidebarHandle: SidebarHandle
}

export function AppSidebarProvider({ children, sidebarHandle }: AppSidebarProviderProps) {
  return (
    <SidebarContext.Provider value={sidebarHandle}>
      {children}
    </SidebarContext.Provider>
  )
}

// Hook to use the sidebar context
export function useAppSidebar(): SidebarHandle {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useAppSidebar must be used within an AppSidebarProvider')
  }
  return context
}

// Optional: Hook that returns null if no context (for optional usage)
export function useAppSidebarOptional(): SidebarHandle | null {
  return useContext(SidebarContext)
}
