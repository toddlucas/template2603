import React from 'react';
import { Link } from 'react-router-dom';

const AuthViewsIndex: React.FC = () => {
  const publicRoutes = [
    { path: '/signin', name: 'Login' },
    { path: '/signout', name: 'Logout' },
    { path: '/signup', name: 'Register' },
    { path: '/forgot-password', name: 'Forgot Password' },
    { path: '/access-denied', name: 'Access Denied' },
    { path: '/confirm-email', name: 'Confirm Email' },
    { path: '/confirm-email-change', name: 'Confirm Email Change' },
    { path: '/external-login', name: 'External Login' },
    { path: '/forgot-password-confirmation', name: 'Forgot Password Confirmation' },
    { path: '/lockout', name: 'Lockout' },
    { path: '/login-with-2fa', name: 'Login with 2FA' },
    { path: '/login-with-recovery-code', name: 'Login with Recovery Code' },
    { path: '/register-confirmation', name: 'Register Confirmation' },
    { path: '/resend-email-confirmation', name: 'Resend Email Confirmation' },
    { path: '/reset-password', name: 'Reset Password' },
    { path: '/reset-password-confirmation', name: 'Reset Password Confirmation' },
  ];

  const accountRoutes = [
    { path: '/account/change-password', name: 'Change Password' },
    { path: '/account/delete-personal-data', name: 'Delete Personal Data' },
    { path: '/account/disable-2fa', name: 'Disable 2FA' },
    { path: '/account/download-personal-data', name: 'Download Personal Data' },
    { path: '/account/email', name: 'Email Settings' },
    { path: '/account/enable-authenticator', name: 'Enable Authenticator' },
    { path: '/account/external-logins', name: 'External Logins' },
    { path: '/account/generate-recovery-codes', name: 'Generate Recovery Codes' },
    { path: '/account/personal-data', name: 'Personal Data' },
    { path: '/account/reset-authenticator', name: 'Reset Authenticator' },
    { path: '/account/set-password', name: 'Set Password' },
    { path: '/account/show-recovery-codes', name: 'Show Recovery Codes' },
    { path: '/account/two-factor-authentication', name: 'Two Factor Authentication' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Auth Views Test Page</h1>

      {/* Special Auth System Test Card */}
      <div className="mb-12">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">🔐 Auth System Test</h2>
              <p className="text-blue-100 mb-4">
                Interactive JWT validation and authentication system testing
              </p>
              <ul className="text-sm text-blue-100 space-y-1 mb-4">
                <li>• Token validation and expiry testing</li>
                <li>• JWT payload inspection</li>
                <li>• Proactive validation checks</li>
                <li>• 401 error handling tests</li>
              </ul>
            </div>
            <div className="text-right">
              <Link
                to="/auth-system-test"
                className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-md"
              >
                Open Auth System Test →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Public Routes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {publicRoutes.map((route) => (
            <Link
              key={route.path}
              to={route.path}
              className="block p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <span className="text-blue-600 hover:text-blue-800">{route.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Account Management Routes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accountRoutes.map((route) => (
            <Link
              key={route.path}
              to={route.path}
              className="block p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <span className="text-blue-600 hover:text-blue-800">{route.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuthViewsIndex;
