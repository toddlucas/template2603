import { useState } from 'react';
import { useTokenValidation } from '../../../hooks/useTokenValidation';
import {
  validateCurrentToken,
  getCurrentToken,
  getTimeUntilExpiry,
  getTokenExpiry,
  decodeJWT
} from '../../../services/auth/authService';
import { get } from '../../../api';

const AuthTestPage = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [tokenInfo, setTokenInfo] = useState<any>(null);

  const { validateToken } = useTokenValidation({
    checkOnMount: false,
    enableBackgroundCheck: false
  });

  const testTokenValidation = () => {
    const isValid = validateToken();
    setTestResult(`Token validation result: ${isValid ? 'VALID' : 'INVALID/EXPIRED'}`);
  };

  const testManualValidation = () => {
    const isValid = validateCurrentToken();
    setTestResult(`Manual validation result: ${isValid ? 'VALID' : 'INVALID/EXPIRED'}`);
  };

  const showTokenInfo = () => {
    const token = getCurrentToken();
    if (!token) {
      setTokenInfo({ error: 'No token found' });
      return;
    }

    const payload = decodeJWT(token);
    const expiry = getTokenExpiry(token);
    const timeUntilExpiry = getTimeUntilExpiry(token);

    setTokenInfo({
      token: token.substring(0, 50) + '...',
      payload,
      expiry: expiry?.toISOString(),
      timeUntilExpiry: `${Math.round(timeUntilExpiry / 1000)} seconds`,
      isValid: timeUntilExpiry > 0
    });
  };

  const test401Error = async () => {
    try {
      // Try to access a protected endpoint that should return 401
      const response = await get('/api/test-protected-endpoint');
      setTestResult(`Unexpected success: ${response.status}`);
    } catch (error) {
      setTestResult(`Expected error caught: ${error}`);
    }
  };

  const testProactiveValidation = () => {
    const token = getCurrentToken();
    if (!token) {
      setTestResult('No token found - cannot test proactive validation');
      return;
    }

    const isValid = validateCurrentToken();
    const timeUntilExpiry = getTimeUntilExpiry(token);
    const expiry = getTokenExpiry(token);

    setTestResult(`Proactive Validation Results:
- Token Valid: ${isValid}
- Time Until Expiry: ${Math.round(timeUntilExpiry / 1000)} seconds
- Expiry Time: ${expiry?.toISOString()}
- Should Logout: ${!isValid}`);
  };

  const clearResults = () => {
    setTestResult('');
    setTokenInfo(null);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Auth System Test Page</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Token Validation Tests</h2>

          <button
            onClick={testTokenValidation}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Token Validation (Hook)
          </button>

          <button
            onClick={testManualValidation}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Test Manual Validation
          </button>

          <button
            onClick={showTokenInfo}
            className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Show Token Info
          </button>

          <button
            onClick={testProactiveValidation}
            className="w-full px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Test Proactive JWT Validation
          </button>

          <button
            onClick={test401Error}
            className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Test 401 Error (Protected Endpoint)
          </button>

          <button
            onClick={clearResults}
            className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Clear Results
          </button>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Results</h2>

          {testResult && (
            <div className="p-4 bg-gray-100 rounded">
              <h3 className="font-semibold mb-2">Test Result:</h3>
              <pre className="text-sm">{testResult}</pre>
            </div>
          )}

          {tokenInfo && (
            <div className="p-4 bg-gray-100 rounded">
              <h3 className="font-semibold mb-2">Token Information:</h3>
              <pre className="text-sm whitespace-pre-wrap">
                {JSON.stringify(tokenInfo, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-100 rounded">
        <h3 className="font-semibold mb-2">Testing Client-Side JWT Validation (401 Handling Disabled):</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Use "Show Token Info" to see your current JWT details and expiry</li>
          <li>Use "Test Proactive JWT Validation" to check if client detects expired tokens</li>
          <li>Use "Test Token Validation (Hook)" to test the React hook validation</li>
          <li>Use "Test Manual Validation" to test direct validation function</li>
          <li>Use "Test 401 Error" to see server 401 responses (automatic logout disabled)</li>
          <li>Check the browser console for validation messages</li>
          <li><strong>Note:</strong> Automatic 401 logout is temporarily disabled for testing</li>
        </ul>
      </div>
    </div>
  );
};

export default AuthTestPage;
