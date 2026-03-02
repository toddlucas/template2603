import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { postTwoFactor } from "../../api/authApi";
import type { TwoFactorResponse } from "../../../../models/auth/two-factor-response";
import { ErrorAlert } from "../../../../components/form/ErrorAlert";
import { SubmitButton } from "../../../../components/form/SubmitButton";
import { TextInput } from "../../../../components/form/TextInput";
import { Link } from "../../../../components/Link";
import constants from "$/constants";

const formSchema = z.object({
  code: z.string().min(1, { message: "Verification code is required" }),
});

type FormSchema = z.infer<typeof formSchema>;

// const AuthenticatorUriFormat = "otpauth://totp/{0}:{1}?secret={2}&issuer={0}&digits=6";

/*
const GenerateQrCodeUri = (email: string, unformattedKey: string) => {
  const issuer = encodeURIComponent("Microsoft.AspNetCore.Identity.UI");
  const mail = encodeURIComponent(email);
  const key = unformattedKey;

  return `otpauth://totp/${issuer}:${mail}?secret=${key}&issuer=${issuer}&digits=6`;
}
*/

const EnableAuthenticator = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [twoFactorInfo /*, setTwoFactorInfo */] = useState<TwoFactorResponse>();

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: { code: "" },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  useEffect(() => {
    document.title = "Configure Authenticator App | " + constants.title;
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
    } catch (err) {
      setError("Failed to load authenticator information");
    }
    */
  };

  const onSubmit = async (formData: FormSchema) => {
    setIsLoading(true);
    try {
      const response = await postTwoFactor({
        enable: true,
        twoFactorCode: formData.code,
        resetSharedKey: false,
        resetRecoveryCodes: false,
        forgetMachine: false,
      });
      if (response.ok) {
        navigate("/account/show-recovery-codes");
      } else {
        setError("Invalid verification code");
      }
    } catch (_err) {
      setError("Failed to enable authenticator");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Enable Authenticator | " + constants.title;
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Configure Authenticator App
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>To use an authenticator app go through the following steps:</p>
            </div>

            <ErrorAlert message={error} />

            <ol className="mt-4 space-y-4">
              <li>
                <p className="text-sm text-gray-600">
                  Download a two-factor authenticator app like Microsoft Authenticator for{" "}
                  <a
                    href="https://go.microsoft.com/fwlink/?Linkid=825072"
                    className="text-indigo-600 hover:text-indigo-500"
                  >
                    Android
                  </a>{" "}
                  and{" "}
                  <a
                    href="https://go.microsoft.com/fwlink/?Linkid=825073"
                    className="text-indigo-600 hover:text-indigo-500"
                  >
                    iOS
                  </a>{" "}
                  or Google Authenticator for{" "}
                  <a
                    href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2"
                    className="text-indigo-600 hover:text-indigo-500"
                  >
                    Android
                  </a>{" "}
                  and{" "}
                  <a
                    href="https://itunes.apple.com/us/app/google-authenticator/id388497605"
                    className="text-indigo-600 hover:text-indigo-500"
                  >
                    iOS
                  </a>
                  .
                </p>
              </li>

              <li>
                <p className="text-sm text-gray-600">
                  Scan the QR Code or enter this key{" "}
                  <kbd className="px-2 py-1 text-sm font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                    {twoFactorInfo?.sharedKey}
                  </kbd>{" "}
                  into your two factor authenticator app. Spaces and casing do not matter.
                </p>
                <div className="mt-2 p-4 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-700">
                    Learn how to{" "}
                    <a
                      href="https://go.microsoft.com/fwlink/?Linkid=852423"
                      className="text-blue-600 hover:text-blue-500"
                    >
                      enable QR code generation
                    </a>
                    .
                  </p>
                </div>
                {/* BUGBUG: This isn't part of the API.
                {twoFactorInfo?.authenticatorUri && (
                  <div className="mt-4">
                    <div id="qrCode" className="flex justify-center"></div>
                    <div id="qrCodeData" data-url={twoFactorInfo.authenticatorUri} className="hidden"></div>
                  </div>
                )}
                */}
              </li>

              <li>
                <p className="text-sm text-gray-600">
                  Once you have scanned the QR code or input the key above, your two factor
                  authentication app will provide you with a unique code. Enter the code in
                  the confirmation box below.
                </p>
                <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
                  <div className="space-y-4">
                    <TextInput
                      id="code"
                      type="text"
                      placeholder="Enter verification code"
                      register={register}
                      error={!!errors.code}
                    />
                    <SubmitButton
                      isLoading={isLoading}
                      text="Verify"
                      loadingText="Verifying..."
                    />
                  </div>
                </form>
              </li>
            </ol>
          </div>
          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
            <Link
              to="/account/two-factor-authentication"
              variant="secondary"
            >
              Back to Two-Factor Authentication
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnableAuthenticator;
