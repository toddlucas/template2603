import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { type SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import constants from "$/constants";
import { postTwoFactor } from "../api/authApi";
import { ErrorAlert } from "../../../components/form/ErrorAlert";
import { SubmitButton } from "../../../components/form/SubmitButton";
import { TextInput } from "../../../components/form/TextInput";

const formSchema = z.object({
  twoFactorCode: z.string().min(1, { message: "Two-factor code is required" }),
  rememberMachine: z.boolean(), //.default(false),
});

type FormSchema = z.infer<typeof formSchema>;

const LoginWith2fa = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | undefined>(undefined);

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: { twoFactorCode: "", rememberMachine: false },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit: SubmitHandler<FormSchema> = async (formData) => {
    try {
      await postTwoFactor({
        twoFactorCode: formData.twoFactorCode,
        forgetMachine: !formData.rememberMachine,
        resetSharedKey: false,
        resetRecoveryCodes: false,
      });
      navigate("/");
    } catch (_err) {
      setError("Invalid two-factor code. Please try again.");
    }
  };

  useEffect(() => {
    document.title = "Two-Factor Authentication | " + constants.title;
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Two-Factor Authentication
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please enter your authenticator app code
          </p>
        </div>

        <ErrorAlert message={error || errors.twoFactorCode?.message} />

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <TextInput
              id="twoFactorCode"
              type="text"
              placeholder="Enter code"
              register={register}
              error={!!errors.twoFactorCode}
            />
          </div>

          <div className="flex items-center">
            <input
              id="rememberMachine"
              type="checkbox"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              {...register("rememberMachine")}
            />
            <label htmlFor="rememberMachine" className="ml-2 block text-sm text-gray-900">
              Remember this machine
            </label>
          </div>

          <SubmitButton
            isLoading={isSubmitting}
            text="Verify"
            loadingText="Verifying..."
          />
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Lost access to your authenticator app?{' '}
            <a href="/login-with-recovery-code" className="text-indigo-600 hover:text-indigo-500">
              Use a recovery code
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginWith2fa;
