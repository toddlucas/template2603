import { useEffect } from "react";
import { Link } from "../../../components/Link";
import constants from "$/constants";

const ResetPasswordConfirmation = () => {
  useEffect(() => {
    document.title = "Password Reset Confirmation | " + constants.title;
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Password Reset Complete
          </h2>
        </div>

        <div className="text-center">
          <p className="text-gray-600">
            Your password has been reset successfully.
          </p>
          <p className="text-gray-600 mt-4">
            You can now{' '}
            <Link to="/signin" variant="text">
              sign in
            </Link>
            {' '}with your new password.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordConfirmation;
