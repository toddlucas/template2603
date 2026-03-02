import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { type SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import constants from "$/constants";
import { postInfo } from "../../api/authApi";
import type { InfoRequest } from "../../../../models/auth/info-request";
import { PasswordInput } from "../../../../components/form/PasswordInput";
import { ErrorAlert } from "../../../../components/form/ErrorAlert";
import { SubmitButton } from "../../../../components/form/SubmitButton";

const formSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required" }),
  newPassword: z.string()
    .min(6, { message: "Password must be at least 6 characters" })
    .max(100, { message: "Password must be less than 100 characters" }),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormSchema = z.infer<typeof formSchema>;

const ChangePassword: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit: SubmitHandler<FormSchema> = async (formData) => {
    try {
      setError(undefined);
      const request: InfoRequest = {
        oldPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      };
      await postInfo(request);
      setSuccess(true);
      setTimeout(() => navigate("/account"), 3000);
    } catch (_err) {
      setError("Failed to change password. Please try again.");
    }
  };

  useEffect(() => {
    document.title = "Change Password | " + constants.title;
  }, []);

  const errorMessage = error || errors.currentPassword?.message || errors.newPassword?.message || errors.confirmPassword?.message;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Change your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please enter your current password and choose a new password.
          </p>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">
              Password changed successfully...
            </span>
          </div>
        ) : (
          <>
            <ErrorAlert message={errorMessage} />

            <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="rounded-md shadow-sm -space-y-px">
                <PasswordInput
                  id="currentPassword"
                  register={register}
                  error={!!errors.currentPassword}
                  placeholder="Current Password"
                  autoComplete="current-password"
                />
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
                  placeholder="Confirm New Password"
                  autoComplete="new-password"
                />
              </div>

              <SubmitButton
                isLoading={isSubmitting}
                text="Change Password"
                loadingText="Changing..."
              />
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ChangePassword;
