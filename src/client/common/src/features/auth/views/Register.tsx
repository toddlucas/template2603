import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { type SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import constants from "$/constants";
// import config from "@/config";
import { useAuthStore } from "../stores/authStore";
import { Link } from "../../../components/Link";
import { EmailInput } from "../../../components/form/EmailInput";
import { PasswordInput } from "../../../components/form/PasswordInput";
import { ErrorAlert } from "../../../components/form/ErrorAlert";
import { SubmitButton } from "../../../components/form/SubmitButton";

const formSchema = z.object({
  email: z.string({ message: "Email is required" }).email("Please enter a valid email address"),
  password: z.string().min(8, { message: "Password must be at least 8 characters long" }),
  confirm: z.string().min(8, { message: "Password confirmation must be at least 8 characters long" }),
})
.refine((data) => data.password === data.confirm, {
  message: "Passwords don't match",
  path: ["confirm"],
});

type FormSchema = z.infer<typeof formSchema>;

const Register = () => {
  const navigate = useNavigate();
  const {
    register: { success, problem },
    postRegister,
    resetRegisterFlags
  } = useAuthStore();

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "", confirm: "" },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit: SubmitHandler<FormSchema> = async (formData) => {
    await postRegister(formData);
  };

  useEffect(() => {
    if (success) {
      // TODO: Config
      // if (import.meta.env.VITE_IDENTITY_REQUIRE_CONFIRMED_EMAIL ||
      //   config.identity.REQUIRE_CONFIRMED_EMAIL) {
      //   setTimeout(() => navigate("/register-confirmation"), 3000);
      // } else {
        setTimeout(() => navigate("/login"), 3000);
      // }
    }

    setTimeout(() => {
      resetRegisterFlags();
    }, 3000);
  }, [success, problem, navigate, resetRegisterFlags]);

  useEffect(() => {
    document.title = "Sign up | " + constants.title;
  }, []);

  const errorMessage = problem?.title || errors.email?.message || errors.password?.message || errors.confirm?.message;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        aria-label="Go back to home"
        title="Go back to home"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>

      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>

        <ErrorAlert message={errorMessage} />

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <EmailInput
              id="email"
              register={register}
              error={!!errors.email}
            />
            <PasswordInput
              id="password"
              register={register}
              error={!!errors.password}
              placeholder="Password"
              autoComplete="new-password"
            />
            <PasswordInput
              id="confirm"
              register={register}
              error={!!errors.confirm}
              placeholder="Confirm Password"
              autoComplete="new-password"
            />
          </div>

          <div className="flex items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
              I agree to the{' '}
              <Link to="#" variant="text" className="text-indigo-600 hover:text-indigo-500">
                terms of use
              </Link>
            </label>
          </div>

          <SubmitButton
            isLoading={isSubmitting}
            text="Sign up"
            loadingText="Creating account..."
          />
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/signin" variant="text">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
