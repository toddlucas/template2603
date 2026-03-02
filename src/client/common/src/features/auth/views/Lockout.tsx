import { useEffect } from "react";
import { Link } from "react-router-dom";
import constants from "$/constants";

const Lockout = () => {
  useEffect(() => {
    document.title = "Account Locked | " + constants.title;
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Account Locked
          </h2>
        </div>

        <div className="text-center">
          <p className="text-gray-600">
            This account has been locked out due to too many failed login attempts.
          </p>
          <p className="text-gray-600 mt-4">
            Please try again later or{' '}
            <Link to="/forgot-password" className="text-indigo-600 hover:text-indigo-500">
              reset your password
            </Link>
            .
          </p>
        </div>

        <div className="text-center">
          <Link
            to="/signin"
            className="text-indigo-600 hover:text-indigo-500"
          >
            Return to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Lockout;
