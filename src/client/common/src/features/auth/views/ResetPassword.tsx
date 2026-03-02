import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { postResetPassword } from "../api/authApi";
import { ErrorAlert } from "../../../components/form/ErrorAlert";
import { SubmitButton } from "../../../components/form/SubmitButton";
import { PasswordInput } from "../../../components/form/PasswordInput";
import { EmailInput } from "../../../components/form/EmailInput";
import constants from "$/constants";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  newPassword: z.string()
    .min(6, { message: "Password must be at least 6 characters" })
    .max(100, { message: "Password must be less than 100 characters" }),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormSchema = z.infer<typeof formSchema>;

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    document.title = "Reset Password | " + constants.title;
  }, []);

  const onSubmit: SubmitHandler<FormSchema> = async (formData) => {
    const resetCode = searchParams.get("code");
    if (!resetCode) {
      setError("Invalid password reset code");
      return;
    }

    try {
      setIsLoading(true);
      setError(undefined);

      await postResetPassword({
        email: formData.email,
        newPassword: formData.newPassword,
        resetCode,
      });

      navigate("/reset-password-confirmation");
    } catch (_err) {
      setError("Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const errorMessage = error || errors.email?.message || errors.newPassword?.message || errors.confirmPassword?.message;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please enter your email and choose a new password
          </p>
        </div>

        <ErrorAlert message={errorMessage} />

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <EmailInput
              id="email"
              register={register}
              error={!!errors.email}
              autoComplete="email"
            />
            <PasswordInput
              id="newPassword"
              register={register}
              error={!!errors.newPassword}
              autoComplete="new-password"
            />
            <PasswordInput
              id="confirmPassword"
              register={register}
              error={!!errors.confirmPassword}
              autoComplete="new-password"
            />
          </div>

          <SubmitButton
            isLoading={isLoading}
            text="Reset Password"
            loadingText="Resetting..."
          />
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
