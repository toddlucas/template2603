import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { type SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import constants from "$/constants";
import { postForgotPassword } from "../api/authApi";
import type { ForgotPasswordRequest } from "../../../models/auth/forgot-password-request";
import { Link } from "../../../components/Link";
import { EmailInput } from "../../../components/form/EmailInput";
import { ErrorAlert } from "../../../components/form/ErrorAlert";
import { SubmitButton } from "../../../components/form/SubmitButton";

const formSchema = z.object({
  email: z.string({ message: "Email is required" }).email("Please enter a valid email address"),
});

type FormSchema = z.infer<typeof formSchema>;

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string>();

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit: SubmitHandler<FormSchema> = async (formData) => {
    try {
      setError(undefined);
      const request: ForgotPasswordRequest = {
        email: formData.email,
      };
      await postForgotPassword(request);
      setSuccess(true);
      setTimeout(() => navigate("/forgot-password-confirmation"), 3000);
    } catch (_err) {
      setError("Failed to send password reset email. Please try again.");
    }
  };

  useEffect(() => {
    document.title = "Forgot Password | " + constants.title;
  }, []);

  const errorMessage = error || errors.email?.message;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">
              Password reset email sent...
            </span>
          </div>
        ) : (
          <>
            <ErrorAlert message={errorMessage} />

            <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="rounded-md shadow-sm">
                <EmailInput
                  id="email"
                  register={register}
                  error={!!errors.email}
                />
              </div>

              <SubmitButton
                isLoading={isSubmitting}
                text="Send Reset Link"
                loadingText="Sending..."
              />
            </form>
          </>
        )}

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Remember your password?{' '}
            <Link to="/signin" variant="text">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
