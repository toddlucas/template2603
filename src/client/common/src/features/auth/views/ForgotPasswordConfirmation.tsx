import { useEffect } from "react";
import { Link } from "react-router-dom";
import constants from "$/constants";

const ForgotPasswordConfirmation = () => {
  useEffect(() => {
    document.title = "Forgot Password Confirmation | " + constants.title;
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Check your email
          </h2>
        </div>

        <div className="text-center">
          <p className="text-gray-600">
            Please check your email to reset your password.
          </p>
          <p className="text-gray-600 mt-4">
            If you don't receive an email within a few minutes, please check your spam folder or{' '}
            <Link to="/forgot-password" className="text-indigo-600 hover:text-indigo-500">
              try again
            </Link>
            .
          </p>
        </div>

        <div className="text-center">
          <Link
            to="/signin"
            className="text-indigo-600 hover:text-indigo-500"
          >
            Return to sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordConfirmation;
