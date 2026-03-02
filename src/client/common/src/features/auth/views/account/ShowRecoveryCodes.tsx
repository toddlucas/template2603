import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { postTwoFactor } from "../../api/authApi";
import type { TwoFactorResponse } from "../../../../models/auth/two-factor-response";
import { ErrorAlert } from "../../../../components/form/ErrorAlert";
import { Link } from "../../../../components/Link";
import constants from "$/constants";

const ShowRecoveryCodes: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>();
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRecoveryCodes = useCallback(async () => {
    try {
      const response = await postTwoFactor({
        enable: true,
        resetSharedKey: false,
        resetRecoveryCodes: false,
        forgetMachine: false,
      });
      if (response.ok) {
        const data: TwoFactorResponse = await response.json();
        if (data.recoveryCodes && data.recoveryCodes.length > 0) {
          setRecoveryCodes(data.recoveryCodes);
        } else {
          navigate("/account/two-factor-authentication");
        }
      } else {
        setError("Failed to load recovery codes");
      }
    } catch (_err) {
      setError("Failed to load recovery codes");
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    document.title = "Recovery Codes | " + constants.title;
    loadRecoveryCodes();
  }, [loadRecoveryCodes]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Loading recovery codes...
            </h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Recovery Codes
          </h2>
          <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative" role="alert">
            <p className="text-center">
              <strong>Warning:</strong> Put these codes in a safe place.
            </p>
            <p className="mt-2 text-center">
              If you lose your device and don't have the recovery codes you will lose access to your account.
            </p>
          </div>
        </div>

        <ErrorAlert message={error} />

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Your recovery codes
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Each code can be used only once.
            </p>
          </div>
          <div className="border-t border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-2 gap-4">
                {recoveryCodes.map((code, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 p-3 rounded-md text-center font-mono text-sm"
                  >
                    {code}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link
            to="/account/two-factor-authentication"
            variant="primary"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to two-factor authentication
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ShowRecoveryCodes;
