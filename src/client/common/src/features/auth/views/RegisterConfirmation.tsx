import { useEffect } from "react";
import { Link } from "../../../components/Link";
import constants from "$/constants";

const RegisterConfirmation = () => {
  useEffect(() => {
    document.title = "Registration Confirmation | " + constants.title;
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Registration successful
          </h2>
        </div>

        <div className="text-center">
          <p className="text-gray-600">
            Thank you for registering. Please check your email to confirm your account.
          </p>
          <p className="text-gray-600 mt-4">
            If you don't receive the confirmation email within a few minutes, please check your spam folder or{' '}
            <Link to="/resend-email-confirmation" variant="text">
              click here to resend
            </Link>
            .
          </p>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already confirmed your email?{' '}
            <Link to="/signin" variant="text">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterConfirmation;
