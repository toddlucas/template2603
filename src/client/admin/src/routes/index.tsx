import { createBrowserRouter } from 'react-router-dom';

import AuthProtected from "$/features/auth/components/AuthProtected";
import Layout from '../layouts/Layout';
import FrameLayout from '../layouts/FrameLayout';
import Shell from '../Shell';

import App from '../App';

// Auth views
import Login from "$/features/auth/views/Login";
import Logout from "$/features/auth/views/Logout";
import Register from "$/features/auth/views/Register";
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

// Dashboard views
import Dashboard from "$/features/dashboard/views/Dashboard";

// Identity views
import { userListHandle } from "../features/identity/views";
import UserList from "../features/identity/views/UserList";

// Organization views
import {
  OrganizationList,
  OrganizationDetail,
  OrganizationForm,
} from "../features/organization/views";
import {
  organizationListHandle,
  organizationDetailHandle,
  organizationFormHandle
} from "../features/organization/views/Organization.handle";

import ThemeView from "$/features/theme/views/ThemeView";

// Base path for router when served behind a proxy (e.g., /admin).
// Set VITE_BASE_PATH=/admin/ in environment when running behind the ASP.NET proxy.
const basePath = import.meta.env.VITE_BASE_PATH || "";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Shell />,
    children: [
      {
        path: "",
        element: <Layout />,
        children: [
          {
            path: "",
            element: <App />,
          },
          // Auth routes
          {
            path: "signin",
            element: <Login />,
          },
          {
            path: "signout",
            element: <Logout />,
          },
          {
            path: "signup",
            element: <Register />,
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
          {
            path: "theme-test",
            element: <ThemeView />,
          },
        ],
      },
      // Routes that require authentication
      {
        path: "",
        element: <AuthProtected />,
        children: [
          {
            path: "",
            element: <Layout />,
            children: [
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
              {
                path: "identity/user/list",
                element: <UserList />,
              },
              // Dashboard routes
              {
                path: "dashboard",
                element: <Dashboard />,
              },
            ],
          },
          {
            path: "",
            element: <FrameLayout />,
            children: [
              {
                path: "identity/users",
                element: <UserList />,
                handle: userListHandle,
              },
              // Organization routes
              {
                path: "organization",
                element: <OrganizationList />,
                handle: organizationListHandle,
              },
              {
                path: "organization/new",
                element: <OrganizationForm />,
                handle: organizationFormHandle,
              },
              {
                path: "organization/:id",
                element: <OrganizationDetail />,
                handle: organizationDetailHandle,
              },
              {
                path: "organization/:id/edit",
                element: <OrganizationForm />,
                handle: organizationFormHandle,
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
