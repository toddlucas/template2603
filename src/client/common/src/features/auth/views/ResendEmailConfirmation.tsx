import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { postResendConfirmationEmail } from "../api/authApi";
import { ErrorAlert } from "../../../components/form/ErrorAlert";
import { SubmitButton } from "../../../components/form/SubmitButton";
import { EmailInput } from "../../../components/form/EmailInput";
import { Link } from "../../../components/Link";
import constants from "$/constants";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

type FormSchema = z.infer<typeof formSchema>;

const ResendEmailConfirmation = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | undefined>(undefined);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    document.title = "Resend Email Confirmation | " + constants.title;
  }, []);

  const onSubmit: SubmitHandler<FormSchema> = async (formData) => {
    try {
      setIsLoading(true);
      setError(undefined);

      const response = await postResendConfirmationEmail({
        email: formData.email,
      });

      if (!response.ok) {
        throw new Error("Failed to resend confirmation email.");
      }

      setSuccess(true);
      setTimeout(() => navigate("/signin"), 3000);
    } catch (_err) {
      setError("Failed to resend confirmation email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const errorMessage = error || errors.email?.message;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Resend confirmation email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we'll send you a new confirmation link.
          </p>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">
              Confirmation email sent. Please check your inbox. Redirecting to sign in...
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
                  autoComplete="email"
                />
              </div>

              <SubmitButton
                isLoading={isLoading}
                text="Send Confirmation Link"
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

export default ResendEmailConfirmation;
