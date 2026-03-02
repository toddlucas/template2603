import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import constants from "$/constants";
import { AuthCard } from "../components/AuthCard";

const SignIn = () => {
  useEffect(() => {
    document.title = "Sign In | " + constants.title;
  }, []);

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <Sparkles className="size-4" />
          </div>
          Product Name
        </a>
        <AuthCard mode="signin" />
        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignIn;
