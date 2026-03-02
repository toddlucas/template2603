import { Navigate } from 'react-router-dom';
import { msalInstance } from '$/features/auth/providers/microsoftProvider';

/**
 * Decides where to send an authenticated user landing on `/`.
 *
 * - No Microsoft accounts in the MSAL cache → first-time user → /onboarding
 * - At least one account cached → returning user → /workspace
 *
 * This is a stub heuristic. Once a server-side "provider connections" entity
 * exists, the redirect logic should query that instead.
 */
export function RootRedirect() {
  const hasAccount = msalInstance.getAllAccounts().length > 0;
  return <Navigate to={hasAccount ? '/mail/overview' : '/onboarding'} replace />;
}
