import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
//import { useAppDispatch, useAppSelector } from "@/hooks";
import { postTwoFactor } from "../../api/authApi";
import type { TwoFactorResponse } from "../../../../models/auth/two-factor-response";
import { ErrorAlert } from "../../../../components/form/ErrorAlert";
//import { SubmitButton } from "../../../../components/form/SubmitButton";
import { Link } from "../../../../components/Link";
import constants from "$/constants";

const TwoFactorAuthentication = () => {
  const navigate = useNavigate();
  //const dispatch = useAppDispatch();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [twoFactorInfo /*, setTwoFactorInfo */] = useState<TwoFactorResponse>();

  useEffect(() => {
    document.title = "Two-Factor Authentication | " + constants.title;
    loadTwoFactorInfo();
  }, []);

  const loadTwoFactorInfo = async () => {
    /*
    try {
      const response = await getTwoFactor();
      if (response.ok) {
        const data = await response.json();
        setTwoFactorInfo(data);
      }
    } catch (_err) {
      setError("Failed to load two-factor authentication settings");
    }
    */
  };

  const handleDisable2fa = async () => {
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

  const handleForgetBrowser = async () => {
    setIsLoading(true);
    try {
      const response = await postTwoFactor({
        enable: true,
        resetSharedKey: false,
        resetRecoveryCodes: false,
        forgetMachine: true,
      });
      if (response.ok) {
        navigate("/account/two-factor-authentication");
      } else {
        setError("Failed to forget browser");
      }
    } catch (_err) {
      setError("Failed to forget browser");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Two-Factor Authentication
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>
                Two-factor authentication adds an extra layer of security to your account.
                When enabled, you'll need to enter a code from your authenticator app
                when signing in.
              </p>
            </div>

            <ErrorAlert message={error} />

            {twoFactorInfo && (
              <div className="mt-5">
                {twoFactorInfo.isTwoFactorEnabled ? (
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-green-400"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">
                          Two-factor authentication is enabled
                        </p>
                      </div>
                    </div>

                    {twoFactorInfo.recoveryCodesLeft <= 3 && (
                      <div className="rounded-md bg-yellow-50 p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg
                              className="h-5 w-5 text-yellow-400"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                              Recovery codes remaining: {twoFactorInfo.recoveryCodesLeft}
                            </h3>
                            <div className="mt-2 text-sm text-yellow-700">
                              <p>
                                You should generate new recovery codes. If you lose your device and
                                don't have the recovery codes you will lose access to your account.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-4">
                      <Link
                        to="/account/generate-recovery-codes"
                        variant="primary"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Generate Recovery Codes
                      </Link>
                      <Link
                        to="/account/reset-authenticator"
                        variant="primary"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Reset Authenticator
                      </Link>
                      {twoFactorInfo.isMachineRemembered && (
                        <button
                          type="button"
                          onClick={handleForgetBrowser}
                          disabled={isLoading}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Forget Browser
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleDisable2fa}
                        disabled={isLoading}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Disable 2FA
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-gray-400"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-800">
                          Two-factor authentication is disabled
                        </p>
                      </div>
                    </div>

                    <Link
                      to="/account/enable-authenticator"
                      variant="primary"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Enable 2FA
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Link
              to="/account/manage"
              variant="secondary"
              className="mr-2"
            >
              Back to Account
            </Link>
            <Link
              to="/account/manage/2fa/authenticator"
              variant="primary"
              className="mr-2"
            >
              Set up authenticator app
            </Link>
            <Link
              to="/account/manage/2fa/recovery-codes"
              variant="primary"
            >
              Generate recovery codes
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorAuthentication;
