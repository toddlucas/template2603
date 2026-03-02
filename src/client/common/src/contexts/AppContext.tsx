import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { AppConfig } from '../routes/AppRegistry';
import type { SidebarNavMainItem } from '$/features/frame/components/sidebar-types';
import { getAppById, getAppByPath, getDefaultApp } from '../routes/AppRegistry';

interface AppContextType {
  currentApp: AppConfig;
  sidebarData: SidebarNavMainItem[];
  switchApp: (appId: string) => void;
  availableApps: AppConfig[];
  isLoadingLocales: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
  availableApps: AppConfig[];
}

export const AppProvider: React.FC<AppProviderProps> = ({ children, availableApps }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine current app based on URL or default
  const [currentApp, setCurrentApp] = useState<AppConfig>(() => {
    return getAppByPath(location.pathname) || getDefaultApp();
  });

  const [isLoadingLocales, setIsLoadingLocales] = useState(false);
  const [loadedApps, setLoadedApps] = useState<Set<string>>(new Set());

  // Load locales for an app if not already loaded
  const loadAppLocalesIfNeeded = useCallback(async (app: AppConfig) => {
    if (loadedApps.has(app.id) || !app.loadLocales) {
      return; // Already loaded or no locales to load
    }

    setIsLoadingLocales(true);
    try {
      await app.loadLocales();
      setLoadedApps(prev => new Set(prev).add(app.id));
    } catch (error) {
      console.error(`Failed to load locales for ${app.id}:`, error); // eslint-disable-line no-console
    } finally {
      setIsLoadingLocales(false);
    }
  }, [loadedApps]);

  // Load locales for initial app on mount
  useEffect(() => {
    loadAppLocalesIfNeeded(currentApp);
  }, [currentApp, loadAppLocalesIfNeeded]);

  // Update current app when location changes
  useEffect(() => {
    const app = getAppByPath(location.pathname);
    if (app && app.id !== currentApp.id) {
      setCurrentApp(app);
      loadAppLocalesIfNeeded(app);
    }
  }, [location.pathname, currentApp.id, loadAppLocalesIfNeeded]);

  // Get sidebar data for current app
  const sidebarData = currentApp.getSidebarData();

  // Switch to a different app
  const switchApp = async (appId: string) => {
    const app = getAppById(appId);
    if (app) {
      setCurrentApp(app);
      await loadAppLocalesIfNeeded(app);
      // Navigate to the app's start path
      navigate(app.startPath);
    }
  };

  const value: AppContextType = {
    currentApp,
    sidebarData,
    switchApp,
    availableApps,
    isLoadingLocales,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
