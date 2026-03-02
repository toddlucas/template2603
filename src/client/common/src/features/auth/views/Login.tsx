import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { type SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import constants from "$/constants";
import { useAuthStore } from "../stores/authStore";
import type { LoginRequest } from "../../../models/auth/login-request";
import { Link } from "../../../components/Link";
import { EmailInput } from "../../../components/form/EmailInput";
import { PasswordInput } from "../../../components/form/PasswordInput";
import { ErrorAlert } from "../../../components/form/ErrorAlert";
import { SubmitButton } from "../../../components/form/SubmitButton";

const formSchema = z.object({
  email: z.string({ message: "Email is required" }).email("Please enter a valid email address"),
  password: z.string().min(1, { message: "Password is required" }),
});

type FormSchema = z.infer<typeof formSchema>;

const Login = () => {
  const {
    login: { error },
    user: { userModel },
    postLogin,
    getUser,
    resetLoginFlags
  } = useAuthStore();
  const navigate = useNavigate();
  const [isUserLoaded, setUserLoaded] = useState(false);

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    //defaultValues: { email: "", password: "" },
    defaultValues: { email: "bb@example.com", password: "qw12QW!@" },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit: SubmitHandler<FormSchema> = async (formData) => {
    const request: LoginRequest = {
      email: formData.email,
      password: formData.password,
    };

    await postLogin(request, true);
    await getUser();
  };

  useEffect(() => {
    if (error) {
      setTimeout(() => {
        resetLoginFlags();
      }, 3000);
    }
  }, [error, resetLoginFlags]);

  useEffect(() => {
    if (userModel && !isUserLoaded) {
      setUserLoaded(true);
      navigate("/");
    }
  }, [userModel, navigate, isUserLoaded]);

  useEffect(() => {
    document.title = "Sign In | " + constants.title;
  }, []);

  const errorMessage = error || errors.email?.message || errors.password?.message;

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
            Sign in to your account
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
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link to="/forgot-password" variant="text">
                Forgot your password?
              </Link>
            </div>
          </div>

          <SubmitButton
            isLoading={isSubmitting}
            text="Sign in"
            loadingText="Signing in..."
          />
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" variant="text">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
