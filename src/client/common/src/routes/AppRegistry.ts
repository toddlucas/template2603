import { type RouteObject } from 'react-router-dom';
import type { SidebarNavMainItem } from '../features/frame/components/sidebar-types';

export interface AppConfig {
  id: string;
  name: string;
  basePath: string;
  startPath: string;
  icon?: string;
  getSidebarData: () => SidebarNavMainItem[];
  loadRoutes: () => Promise<RouteObject[]>;
  loadLocales?: () => Promise<void>;  // Optional: Lazy-load app translations
}

// Import apps
//import { exampleApp } from '../apps/example';
import { mailApp } from '../apps/mail';
//import { workspaceApp } from '$/apps/workspace';
import { onboardingApp } from '$/apps/onboarding';

// Register all available apps
export const registeredApps: AppConfig[] = [
  //exampleApp,
  mailApp,
  //workspaceApp,
  onboardingApp,
];

// Helper to get app by ID
export const getAppById = (id: string): AppConfig | undefined => {
  return registeredApps.find(app => app.id === id);
};

// Helper to get app by path
export const getAppByPath = (path: string): AppConfig | undefined => {
  // Sort by basePath length (longest first) to match most specific first
  const sorted = [...registeredApps].sort((a, b) => b.basePath.length - a.basePath.length);
  return sorted.find(app => path.startsWith(app.basePath));
};

// Default app (Mail is the main app)
export const getDefaultApp = (): AppConfig => {
  return mailApp;
};
