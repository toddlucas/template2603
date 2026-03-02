import { useContainerResource } from './container';
import { ContainerProvider } from '$/platform/di/ContainerContext';
import { ThemeProvider } from '$/components';
import { Outlet } from 'react-router-dom';

function Shell() {
  const container = useContainerResource();
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <ContainerProvider container={container}>
        <Outlet />
      </ContainerProvider>
    </ThemeProvider>
  );
}

export default Shell;
