import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { postTwoFactor } from "../../api/authApi";
import { ErrorAlert } from "../../../../components/form/ErrorAlert";
import { SubmitButton } from "../../../../components/form/SubmitButton";
import constants from "$/constants";

const Disable2fa: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.title = "Disable Two-Factor Authentication | " + constants.title;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await postTwoFactor({
        enable: false,
        resetSharedKey: false,
        resetRecoveryCodes: false,
        forgetMachine: false,
      });
      if (response.ok) {
        navigate("/account/two-factor-authentication");
      } else {
        setError("Failed to disable two-factor authentication");
      }
    } catch (_err) {
      setError("Failed to disable two-factor authentication");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Disable Two-Factor Authentication
          </h2>
          <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative" role="alert">
            <p className="text-center">
              <strong>Warning:</strong> This action only disables 2FA. If you wish to change the key used in an authenticator app, you should reset your authenticator keys instead.
            </p>
          </div>
        </div>

        <ErrorAlert message={error} />

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <SubmitButton
            isLoading={isLoading}
            text="Disable 2FA"
            loadingText="Disabling..."
          />
        </form>
      </div>
    </div>
  );
};

export default Disable2fa;
