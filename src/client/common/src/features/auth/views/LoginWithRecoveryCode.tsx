import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { type SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import constants from "$/constants";
import { useAuthStore } from "../stores/authStore";
import { ErrorAlert } from "../../../components/form/ErrorAlert";
import { SubmitButton } from "../../../components/form/SubmitButton";
import { TextInput } from "../../../components/form/TextInput";

const formSchema = z.object({
  recoveryCode: z.string().min(1, { message: "Recovery code is required" }),
});

type FormSchema = z.infer<typeof formSchema>;

const LoginWithRecoveryCode = () => {
  const {
    login: { twoFactorCredentials },
    postLogin,
    setTwoFactorCredentials
  } = useAuthStore();
  const navigate = useNavigate();
  const [error, setError] = useState<string | undefined>(undefined);

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: { recoveryCode: "" },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    if (!twoFactorCredentials) {
      navigate("/signin");
    }
  }, [twoFactorCredentials, navigate]);

  const onSubmit: SubmitHandler<FormSchema> = async (formData) => {
    if (!twoFactorCredentials) {
      setError("No credentials found. Please log in again.");
      return;
    }

    try {
      await postLogin({
        email: twoFactorCredentials.email,
        password: twoFactorCredentials.password,
        twoFactorRecoveryCode: formData.recoveryCode,
      });
      setTwoFactorCredentials(null);
      navigate("/");
    } catch (_err) {
      setError("Invalid recovery code. Please try again.");
    }
  };

  useEffect(() => {
    document.title = "Recovery Code Login | " + constants.title;
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Recovery Code Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please enter your recovery code
          </p>
        </div>

        <ErrorAlert message={error || errors.recoveryCode?.message} />

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <TextInput
              id="recoveryCode"
              type="text"
              placeholder="Enter recovery code"
              register={register}
              error={!!errors.recoveryCode}
            />
          </div>

          <SubmitButton
            isLoading={isSubmitting}
            text="Verify"
            loadingText="Verifying..."
          />
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Have access to your authenticator app?{' '}
            <a href="/login-with-2fa" className="text-indigo-600 hover:text-indigo-500">
              Use authenticator app
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginWithRecoveryCode;
