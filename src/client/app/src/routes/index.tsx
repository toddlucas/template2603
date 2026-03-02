import { createHashRouter } from 'react-router-dom';
import Shell from '../Shell';
import AuthProtected from '$/features/auth/components/AuthProtected';
import SignIn from '$/features/auth/views/SignIn';
import SignUp from '$/features/auth/views/SignUp';
import ForgotPassword from '$/features/auth/views/ForgotPassword';
import { RootRedirect } from '../components/RootRedirect';
import { onboardingRoutes } from '#onboarding/routes';

export const router = createHashRouter([
  {
    path: '/',
    element: <Shell />,
    children: [
      // Public auth routes
      { path: 'signin', element: <SignIn /> },
      { path: 'signup', element: <SignUp /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      // Protected routes
      {
        path: '',
        element: <AuthProtected />,
        children: [
          // Root redirect: /onboarding for first-time users, /workspace for returning users
          { index: true, element: <RootRedirect /> },
          ...onboardingRoutes,
        ],
      },
    ],
  },
]);

export default router;
