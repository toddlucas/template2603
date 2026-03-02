import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getConfirmEmail } from "../api/authApi";
import { ErrorAlert } from "../../../components/form/ErrorAlert";
import constants from "$/constants";

const ConfirmEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const confirmEmail = async () => {
      const userId = searchParams.get("userId");
      const code = searchParams.get("code");
      const changedEmail = searchParams.get("changedEmail"); // Optional

      if (!userId || !code) {
        setError("Invalid confirmation link");
        setIsLoading(false);
        return;
      }

      try {
        const response = await getConfirmEmail(userId, code, changedEmail || "");
        if (!response.ok) {
          throw new Error("Failed to confirm email.");
        }

        // Redirect to login page after successful confirmation
        // navigate("/signin", { state: { message: "Email confirmed successfully. Please log in." } });
        // setTimeout(() => navigate("/signin"), 3000);
      } catch (_err) {
        setError("Failed to confirm email. The link may have expired or is invalid.");
      } finally {
        setIsLoading(false);
      }
    };

    confirmEmail();
  }, [searchParams, navigate]);

  useEffect(() => {
    document.title = "Confirm Email | " + constants.title;
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Confirm Email
          </h2>
        </div>

        <ErrorAlert message={error} />

        {isLoading ? (
          <div className="text-center">
            <p className="text-gray-600">Confirming your email...</p>
          </div>
        ) : !error ? (
          <div className="text-center">
            <p className="text-gray-600">Thank you for confirming your email.</p>
            <p className="text-gray-600 mt-4">
              You can now <a href="/signin" className="text-indigo-600 hover:text-indigo-500">sign in</a> to your account.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ConfirmEmail;
