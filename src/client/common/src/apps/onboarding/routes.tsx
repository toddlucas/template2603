import { type RouteObject } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

const OnboardingView = lazy(() => import('./views/OnboardingView'));

const withSuspense = (Component: React.ComponentType) => (
  <Suspense
    fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    }
  >
    <Component />
  </Suspense>
);

export const onboardingRoutes: RouteObject[] = [
  {
    path: 'onboarding',
    element: withSuspense(OnboardingView),
  },
];
