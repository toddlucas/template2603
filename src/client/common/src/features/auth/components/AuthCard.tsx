import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { type SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Mail } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "$/components/ui/card";
import { Button } from "$/components/ui/button";
import { Input } from "$/components/ui/input";
import { Label } from "$/components/ui/label";
import { Separator } from "$/components/ui/separator";
import { Checkbox } from "$/components/ui/checkbox";
import { useAuthStore } from "../stores/authStore";
import type { LoginRequest } from "../../../models/auth/login-request";
import type { RegisterRequest } from "../../../models/auth/register-request";

type Step = "choose" | "email";

interface AuthCardProps {
  mode: "signin" | "signup";
}

const signinSchema = z.object({
  email: z
    .string({ message: "Email is required" })
    .email("Please enter a valid email address"),
  password: z.string().min(1, { message: "Password is required" }),
});

const signupSchema = z
  .object({
    email: z
      .string({ message: "Email is required" })
      .email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" }),
    confirm: z
      .string()
      .min(8, { message: "Password confirmation must be at least 8 characters long" }),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });

type SigninSchema = z.infer<typeof signinSchema>;
type SignupSchema = z.infer<typeof signupSchema>;

const MicrosoftIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 21 21"
    className="size-4 shrink-0"
    aria-hidden="true"
  >
    <rect x="1" y="1" width="9" height="9" fill="#F25022" />
    <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
    <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
    <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
  </svg>
);

const GoogleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className="size-4 shrink-0"
    aria-hidden="true"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

export function AuthCard({ mode }: AuthCardProps) {
  const [step, setStep] = useState<Step>("choose");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [isUserLoaded, setIsUserLoaded] = useState(false);
  const pendingExternalSignIn = useRef(false);
  const navigate = useNavigate();

  const {
    login: { error: loginError },
    externalLogin: { status: externalLoginStatus, error: externalLoginError },
    register: { success: registerSuccess, problem: registerProblem },
    user: { userModel },
    postLogin,
    loginWithMicrosoft,
    getUser,
    postRegister,
    resetLoginFlags,
    resetRegisterFlags,
  } = useAuthStore();

  const signinForm = useForm<SigninSchema>({
    resolver: zodResolver(signinSchema),
    defaultValues: { email: "bb@example.com", password: "qw12QW!@" },
  });

  const signupForm = useForm<SignupSchema>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", confirm: "" },
  });

  const onSigninSubmit: SubmitHandler<SigninSchema> = async (data) => {
    const request: LoginRequest = { email: data.email, password: data.password };
    await postLogin(request, true);
    await getUser();
  };

  const onSignupSubmit: SubmitHandler<SignupSchema> = async (data) => {
    if (!termsAccepted) {
      setTermsError(true);
      return;
    }
    setTermsError(false);
    const request: RegisterRequest = { email: data.email, password: data.password };
    await postRegister(request);
  };

  useEffect(() => {
    if (userModel && !isUserLoaded) {
      setIsUserLoaded(true);
      navigate("/");
    }
  }, [userModel, navigate, isUserLoaded]);

  useEffect(() => {
    if (externalLoginStatus === 'idle' && pendingExternalSignIn.current && userModel) {
      pendingExternalSignIn.current = false;
      navigate("/");
    }
    if (externalLoginStatus === 'failed' || externalLoginStatus === 'idle') {
      pendingExternalSignIn.current = false;
    }
  }, [externalLoginStatus, userModel, navigate]);

  useEffect(() => {
    if (registerSuccess) {
      const timer = setTimeout(() => {
        resetRegisterFlags();
        navigate("/signin");
      }, 2000);
      return () => clearTimeout(timer);
    }
    if (registerProblem) {
      const timer = setTimeout(() => resetRegisterFlags(), 3000);
      return () => clearTimeout(timer);
    }
  }, [registerSuccess, registerProblem, navigate, resetRegisterFlags]);

  useEffect(() => {
    if (loginError) {
      const timer = setTimeout(() => resetLoginFlags(), 3000);
      return () => clearTimeout(timer);
    }
  }, [loginError, resetLoginFlags]);

  const signinErrorMessage =
    loginError ||
    signinForm.formState.errors.email?.message ||
    signinForm.formState.errors.password?.message;

  const signupErrorMessage =
    registerProblem?.title ||
    signupForm.formState.errors.email?.message ||
    signupForm.formState.errors.password?.message ||
    signupForm.formState.errors.confirm?.message;

  return (
    <Card className="w-full">
      {step === "choose" ? (
        <>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </CardTitle>
            <CardDescription>
              {mode === "signin"
                ? "Choose how you'd like to sign in"
                : "Choose how you'd like to get started"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button
              variant="outline"
              className="w-full gap-2"
              disabled={externalLoginStatus === 'loading'}
              onClick={() => { pendingExternalSignIn.current = true; loginWithMicrosoft(); }}
            >
              <MicrosoftIcon />
              {externalLoginStatus === 'loading' ? 'Signing in...' : 'Continue with Microsoft'}
            </Button>
            {externalLoginError && (
              <p className="text-sm text-destructive text-center rounded-md bg-destructive/10 px-3 py-2">
                {externalLoginError}
              </p>
            )}
            <Button
              variant="outline"
              className="w-full gap-2 opacity-50"
              disabled
              title="Coming soon"
            >
              <GoogleIcon />
              Continue with Google
              <span className="ml-auto text-xs">Soon</span>
            </Button>
            <div className="flex items-center gap-3 my-1">
              <Separator className="flex-1" />
              <span className="text-muted-foreground text-xs uppercase tracking-wide">or</span>
              <Separator className="flex-1" />
            </div>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setStep("email")}
            >
              <Mail className="size-4 shrink-0" />
              Continue with Email
            </Button>
          </CardContent>
        </>
      ) : (
        <>
          <CardHeader>
            <button
              type="button"
              onClick={() => setStep("choose")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
            >
              <ArrowLeft className="size-3.5" />
              Back
            </button>
            <CardTitle className="text-xl">
              {mode === "signin" ? "Sign in with email" : "Create account with email"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mode === "signin" ? (
              <form
                onSubmit={signinForm.handleSubmit(onSigninSubmit)}
                className="flex flex-col gap-4"
              >
                {signinErrorMessage && (
                  <p className="text-sm text-destructive text-center rounded-md bg-destructive/10 px-3 py-2">
                    {signinErrorMessage}
                  </p>
                )}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    aria-invalid={!!signinForm.formState.errors.email}
                    {...signinForm.register("email")}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="signin-password">Password</Label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="signin-password"
                    type="password"
                    autoComplete="current-password"
                    aria-invalid={!!signinForm.formState.errors.password}
                    {...signinForm.register("password")}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={signinForm.formState.isSubmitting}
                >
                  {signinForm.formState.isSubmitting ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            ) : (
              <form
                onSubmit={signupForm.handleSubmit(onSignupSubmit)}
                className="flex flex-col gap-4"
              >
                {registerSuccess ? (
                  <p className="text-sm text-center text-muted-foreground rounded-md bg-muted px-3 py-2">
                    Account created! Redirecting to sign in...
                  </p>
                ) : signupErrorMessage ? (
                  <p className="text-sm text-destructive text-center rounded-md bg-destructive/10 px-3 py-2">
                    {signupErrorMessage}
                  </p>
                ) : null}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    aria-invalid={!!signupForm.formState.errors.email}
                    {...signupForm.register("email")}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={!!signupForm.formState.errors.password}
                    {...signupForm.register("password")}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={!!signupForm.formState.errors.confirm}
                    {...signupForm.register("confirm")}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="terms"
                      checked={termsAccepted}
                      onCheckedChange={(checked) => {
                        setTermsAccepted(checked === true);
                        if (checked) setTermsError(false);
                      }}
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor="terms"
                      className="font-normal text-sm leading-snug cursor-pointer"
                    >
                      I agree to the{" "}
                      <Link
                        to="/terms"
                        className="underline underline-offset-4 hover:text-foreground"
                      >
                        terms of use
                      </Link>
                    </Label>
                  </div>
                  {termsError && (
                    <p className="text-xs text-destructive pl-6">
                      You must accept the terms to continue.
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={signupForm.formState.isSubmitting || registerSuccess}
                >
                  {signupForm.formState.isSubmitting ? "Creating account..." : "Create account"}
                </Button>
              </form>
            )}
          </CardContent>
        </>
      )}
    </Card>
  );
}
