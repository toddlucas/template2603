import type { AppConfig } from '$/routes/AppRegistry';
import { onboardingSidebarData } from './constants/sidebar-data';

export const onboardingApp: AppConfig = {
  id: 'onboarding',
  name: 'Onboarding',
  basePath: '/onboarding',
  startPath: '/onboarding',
  getSidebarData: () => onboardingSidebarData,
  loadRoutes: () => import('./routes').then((m) => m.onboardingRoutes),
};

export default onboardingApp;
