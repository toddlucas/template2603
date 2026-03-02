import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import constants from "$/constants";
import { AuthCard } from "../components/AuthCard";

const SignUp = () => {
  useEffect(() => {
    document.title = "Sign Up | " + constants.title;
  }, []);

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left column: form */}
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <Sparkles className="size-4" />
            </div>
            Product Name
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex w-full max-w-xs flex-col gap-6">
            <AuthCard mode="signup" />
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/signin"
                className="underline underline-offset-4 hover:text-foreground transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
      {/* Right column: brand panel */}
      <div className="bg-muted relative hidden lg:flex flex-col items-center justify-center gap-4 p-10">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-xl">
            <Sparkles className="size-6" />
          </div>
          <span className="text-2xl font-semibold">{constants.title}</span>
        </div>
        <p className="text-muted-foreground text-center max-w-xs text-sm leading-relaxed">
          Edit your documents with AI — directly from your existing cloud storage.
        </p>
      </div>
    </div>
  );
};

export default SignUp;
