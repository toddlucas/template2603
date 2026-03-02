import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { postTwoFactor } from "../../api/authApi";
import { ErrorAlert } from "../../../../components/form/ErrorAlert";
import { SubmitButton } from "../../../../components/form/SubmitButton";
import constants from "$/constants";

const GenerateRecoveryCodes: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.title = "Generate Recovery Codes | " + constants.title;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await postTwoFactor({
        enable: true,
        resetSharedKey: false,
        resetRecoveryCodes: true,
        forgetMachine: false,
      });
      if (response.ok) {
        navigate("/account/show-recovery-codes");
      } else {
        setError("Failed to generate recovery codes");
      }
    } catch (_err) {
      setError("Failed to generate recovery codes");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Generate Recovery Codes
          </h2>
          <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative" role="alert">
            <p className="text-center">
              <strong>Warning:</strong> Put these codes in a safe place.
            </p>
            <p className="mt-2 text-center">
              If you lose your device and don't have the recovery codes you will lose access to your account.
            </p>
            <p className="mt-2 text-center">
              Generating new recovery codes does not change the keys used in authenticator apps. If you wish to change the key
              used in an authenticator app you should reset your authenticator keys instead.
            </p>
          </div>
        </div>

        <ErrorAlert message={error} />

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <SubmitButton
            isLoading={isLoading}
            text="Generate Recovery Codes"
            loadingText="Generating..."
          />
        </form>
      </div>
    </div>
  );
};

export default GenerateRecoveryCodes;
