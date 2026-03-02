import type { AppConfig } from '$/routes/AppRegistry';
import { mailSidebarData } from './constants/sidebar-data';
import { loadAppLocales } from '$/utility/loadAppLocales';

export const mailApp: AppConfig = {
  id: 'mail',
  name: 'Mail Infrastructure',
  basePath: '/mail',
  startPath: '/mail/overview',
  icon: '📧',
  getSidebarData: () => mailSidebarData,
  loadRoutes: () => import('./routes').then(m => m.mailRoutes),
  loadLocales: async () => {
    const { mailLocales } = await import('./locales');
    await loadAppLocales('mail', mailLocales);
  },
};

export default mailApp;
