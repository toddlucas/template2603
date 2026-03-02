import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { postTwoFactor } from "../../api/authApi";
import { ErrorAlert } from "../../../../components/form/ErrorAlert";
import { Link } from "../../../../components/Link";
import constants from "$/constants";

const ResetAuthenticator: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      const response = await postTwoFactor({
        enable: true,
        resetSharedKey: true,
        resetRecoveryCodes: true,
        forgetMachine: true,
      });

      if (response.ok) {
        navigate("/account/show-recovery-codes");
      } else {
        setError("Failed to reset authenticator");
      }
    } catch (_err) {
      setError("Failed to reset authenticator");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Reset Authenticator | " + constants.title;
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset Authenticator
          </h2>
          <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative" role="alert">
            <p className="text-center">
              <strong>Warning:</strong> This process will disable 2FA until you verify your authenticator app.
            </p>
            <p className="mt-2 text-center">
              If you do not complete your authenticator app configuration you may lose access to your account.
            </p>
          </div>
        </div>

        <ErrorAlert message={error} />

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Reset authenticator key
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              This process will:
            </p>
            <ul className="mt-2 list-disc list-inside text-sm text-gray-500">
              <li>Generate a new authenticator key</li>
              <li>Generate new recovery codes</li>
              <li>Forget all remembered devices</li>
            </ul>
          </div>
          <div className="border-t border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <button
                type="button"
                onClick={handleReset}
                disabled={isLoading}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Resetting..." : "Reset authenticator"}
              </button>
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

export default ResetAuthenticator;
