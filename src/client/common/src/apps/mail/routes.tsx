import { type RouteObject } from 'react-router-dom';
import { lazy, Suspense } from 'react';

const MailOverview = lazy(() => import('#mail/features/domains/views/MailOverview'));
const DomainList = lazy(() => import('#mail/features/domains/views/DomainList'));
const WarmupDashboard = lazy(() => import('#mail/features/domains/views/WarmupDashboard'));

const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<div>Loading...</div>}>
    <Component />
  </Suspense>
);

export const mailRoutes: RouteObject[] = [
  {
    path: 'mail/overview',
    element: withSuspense(MailOverview),
  },
  {
    path: 'mail/domains',
    element: withSuspense(DomainList),
  },
  {
    path: 'mail/warmup',
    element: withSuspense(WarmupDashboard),
  },
  {
    path: 'mail/dns',
    element: <div>DNS Records (Coming Soon)</div>,
  },
];
