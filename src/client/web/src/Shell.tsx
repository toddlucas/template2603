import { Outlet } from 'react-router-dom';
import { ContainerProvider } from '$/platform/di/ContainerContext';
import { ThemeProvider } from '$/components';
import { Toaster } from '$/components/ui/sonner';
import { registeredApps } from '$/routes/AppRegistry';
import { useContainerResource } from './container';
import { AppProvider } from '$/contexts/AppContext';

function Shell() {
  const container = useContainerResource();
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <ContainerProvider container={container}>
        <AppProvider availableApps={registeredApps}>
          <Outlet />
          <Toaster />
        </AppProvider>
      </ContainerProvider>
    </ThemeProvider>
  );
}

export default Shell;
