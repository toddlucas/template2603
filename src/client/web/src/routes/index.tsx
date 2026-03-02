import { createBrowserRouter } from 'react-router-dom';
import { RootRedirect } from '../components/RootRedirect';

import AuthProtected from "$/features/auth/components/AuthProtected";
import App from '../App';
import Layout from '../layouts/Layout';
import FrameLayout from '../layouts/FrameLayout';
import Shell from '../Shell';
import RouteErrorBoundary from '../components/RouteErrorBoundary';

// Auth views
import SignIn from "$/features/auth/views/SignIn";
import Logout from "$/features/auth/views/Logout";
import SignUp from "$/features/auth/views/SignUp";
import ForgotPassword from "$/features/auth/views/ForgotPassword";
import AccessDenied from "$/features/auth/views/AccessDenied";
import ConfirmEmail from "$/features/auth/views/ConfirmEmail";
import ConfirmEmailChange from "$/features/auth/views/ConfirmEmailChange";
import ExternalLogin from "$/features/auth/views/ExternalLogin";
import ForgotPasswordConfirmation from "$/features/auth/views/ForgotPasswordConfirmation";
import Lockout from "$/features/auth/views/Lockout";
import LoginWith2fa from "$/features/auth/views/LoginWith2fa";
import LoginWithRecoveryCode from "$/features/auth/views/LoginWithRecoveryCode";
import RegisterConfirmation from "$/features/auth/views/RegisterConfirmation";
import ResendEmailConfirmation from "$/features/auth/views/ResendEmailConfirmation";
import ResetPassword from "$/features/auth/views/ResetPassword";
import ResetPasswordConfirmation from "$/features/auth/views/ResetPasswordConfirmation";

// Account management views
import AccountProfilePage from "../features/auth/views/account/AccountProfilePage";
import ChangePassword from "$/features/auth/views/account/ChangePassword";
import DeletePersonalData from "$/features/auth/views/account/DeletePersonalData";
import Disable2fa from "$/features/auth/views/account/Disable2fa";
import DownloadPersonalData from "$/features/auth/views/account/DownloadPersonalData";
import Email from "$/features/auth/views/account/Email";
import EnableAuthenticator from "$/features/auth/views/account/EnableAuthenticator";
import ExternalLogins from "$/features/auth/views/account/ExternalLogins";
import GenerateRecoveryCodes from "$/features/auth/views/account/GenerateRecoveryCodes";
import PersonalData from "$/features/auth/views/account/PersonalData";
import ResetAuthenticator from "$/features/auth/views/account/ResetAuthenticator";
import SetPassword from "$/features/auth/views/account/SetPassword";
import ShowRecoveryCodes from "$/features/auth/views/account/ShowRecoveryCodes";
import TwoFactorAuthentication from "$/features/auth/views/account/TwoFactorAuthentication";

// Feature test views
import AuthViewsIndex from "$/features/auth/views";
import AuthTestPage from "$/features/auth/views/AuthTestPage";

// Import app routes
//import { exampleRoutes } from '#example/routes';
import { mailRoutes } from '#mail/routes';
//import { workspaceRoutes } from '#workspace/routes';
import { onboardingRoutes } from '#onboarding/routes';

// Base path for router when served behind a proxy.
// Set VITE_BASE_PATH in environment when running behind the ASP.NET proxy.
const basePath = import.meta.env.VITE_BASE_PATH || "";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Shell />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: "",
        element: <Layout />,
        children: [
          // Test dashboard
          {
            index: true,
            element: <App />,
          },
          // Auth routes
          {
            path: "signin",
            element: <SignIn />,
          },
          {
            path: "signout",
            element: <Logout />,
          },
          {
            path: "signup",
            element: <SignUp />,
          },
          {
            path: "forgot-password",
            element: <ForgotPassword />,
          },
          {
            path: "access-denied",
            element: <AccessDenied />,
          },
          {
            path: "confirm-email",
            element: <ConfirmEmail />,
          },
          {
            path: "confirm-email-change",
            element: <ConfirmEmailChange />,
          },
          {
            path: "external-login",
            element: <ExternalLogin />,
          },
          {
            path: "forgot-password-confirmation",
            element: <ForgotPasswordConfirmation />,
          },
          {
            path: "lockout",
            element: <Lockout />,
          },
          {
            path: "login-with-2fa",
            element: <LoginWith2fa />,
          },
          {
            path: "login-with-recovery-code",
            element: <LoginWithRecoveryCode />,
          },
          {
            path: "register-confirmation",
            element: <RegisterConfirmation />,
          },
          {
            path: "resend-email-confirmation",
            element: <ResendEmailConfirmation />,
          },
          {
            path: "reset-password",
            element: <ResetPassword />,
          },
          {
            path: "reset-password-confirmation",
            element: <ResetPasswordConfirmation />,
          },
          // Test routes
          {
            path: "auth-test",
            element: <AuthViewsIndex />,
          },
          {
            path: "auth-system-test",
            element: <AuthTestPage />,
          },
        ],
      },
      // Routes that require authentication
      {
        path: "",
        element: <AuthProtected />,
        children: [
          // Root redirect: /onboarding for first-time users, /workspace for returning users
          {
            path: '',
            element: <RootRedirect />,
          },
          // Full-screen routes (no sidebar) — onboarding + workspace apps
          ...onboardingRoutes,
          //...workspaceRoutes,
          // Routes with FrameLayout (sidebar navigation)
          {
            path: "",
            element: <FrameLayout />,
            children: [
              // Dynamically loaded app routes
              //...exampleRoutes,
              ...mailRoutes,
              // Account management routes
              {
                path: "account/profile",
                element: <AccountProfilePage />,
              },
              {
                path: "account/change-password",
                element: <ChangePassword />,
              },
              {
                path: "account/delete-personal-data",
                element: <DeletePersonalData />,
              },
              {
                path: "account/disable-2fa",
                element: <Disable2fa />,
              },
              {
                path: "account/download-personal-data",
                element: <DownloadPersonalData />,
              },
              {
                path: "account/email",
                element: <Email />,
              },
              {
                path: "account/enable-authenticator",
                element: <EnableAuthenticator />,
              },
              {
                path: "account/external-logins",
                element: <ExternalLogins />,
              },
              {
                path: "account/generate-recovery-codes",
                element: <GenerateRecoveryCodes />,
              },
              {
                path: "account/personal-data",
                element: <PersonalData />,
              },
              {
                path: "account/reset-authenticator",
                element: <ResetAuthenticator />,
              },
              {
                path: "account/set-password",
                element: <SetPassword />,
              },
              {
                path: "account/show-recovery-codes",
                element: <ShowRecoveryCodes />,
              },
              {
                path: "account/two-factor-authentication",
                element: <TwoFactorAuthentication />,
              },
            ],
          },
        ],
      },
    ],
  },
], {
  basename: basePath || undefined,
});

export default router;
