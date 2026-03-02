import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { type SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { postInfo } from "../../api/authApi";
import { ErrorAlert } from "../../../../components/form/ErrorAlert";
import { Link } from "../../../../components/Link";
import { PasswordInput } from "../../../../components/form/PasswordInput";
import { SubmitButton } from "../../../../components/form/SubmitButton";
import constants from "$/constants";

const passwordSchema = z.object({
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

const SetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>();
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit: SubmitHandler<PasswordFormData> = async (data) => {
    setError(undefined);
    setIsSuccess(false);

    try {
      const response = await postInfo({
        newPassword: data.newPassword,
        oldPassword: "", // Not required for setting initial password
      });

      if (response.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          navigate("/account");
        }, 2000);
      } else {
        setError("Failed to set password");
      }
    } catch (_err) {
      setError("Failed to set password");
    }
  };

  useEffect(() => {
    document.title = "Set Password | " + constants.title;
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Set Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Set a new password for your account
          </p>
        </div>

        <ErrorAlert message={error} />

        {isSuccess && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
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
                  Password has been set successfully. Redirecting...
                </p>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <PasswordInput
              id="newPassword"
              register={register}
              error={!!errors.newPassword}
              placeholder="New Password"
              autoComplete="new-password"
            />
            <PasswordInput
              id="confirmPassword"
              register={register}
              error={!!errors.confirmPassword}
              placeholder="Confirm Password"
              autoComplete="new-password"
            />
          </div>

          <SubmitButton
            isLoading={isSubmitting}
            text="Set Password"
            loadingText="Setting password..."
          />
        </form>

        <div className="text-center">
          <Link
            to="/account"
            variant="primary"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SetPassword;
