import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getConfirmEmail } from "../api/authApi";
import { ErrorAlert } from "../../../components/form/ErrorAlert";
import constants from "$/constants";

const ConfirmEmailChange = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const confirmEmailChange = async () => {
      const userId = searchParams.get("userId");
      const code = searchParams.get("code");
      const changedEmail = searchParams.get("changedEmail");

      if (!userId || !code || !changedEmail) {
        setError("Invalid confirmation link");
        setIsLoading(false);
        return;
      }

      try {
        const response = await getConfirmEmail(userId, code, changedEmail);
        if (!response.ok) {
          throw new Error("Failed to confirm email change.");
        }

        // Redirect to account page after successful confirmation
        // navigate("/account/email", { state: { message: "Email changed successfully." } });
        // setTimeout(() => navigate("/account/email"), 3000);
      } catch (_err) {
        setError("Failed to confirm email change. The link may have expired or is invalid.");
      } finally {
        setIsLoading(false);
      }
    };

    confirmEmailChange();
  }, [searchParams, navigate]);

  useEffect(() => {
    document.title = "Confirm Email Change | " + constants.title;
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Confirm Email Change
          </h2>
        </div>

        <ErrorAlert message={error} />

        {isLoading ? (
          <div className="text-center">
            <p className="text-gray-600">Confirming your email change...</p>
          </div>
        ) : !error ? (
          <div className="text-center">
            <p className="text-gray-600">Thank you for confirming your email change.</p>
            <p className="text-gray-600 mt-4">
              You can now <a href="/account/email" className="text-indigo-600 hover:text-indigo-500">view your email settings</a>.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ConfirmEmailChange;
