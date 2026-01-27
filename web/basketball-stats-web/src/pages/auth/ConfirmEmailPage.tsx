import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import Icon from "../../components/Icon";
import { LogoIcon } from "../../components/Logo";
import SEOHead from "../../components/seo/SEOHead";
import { getErrorMessage, isErrorWithMessage } from "@basketball-stats/shared";

type PageState = "loading" | "success" | "error" | "already-confirmed";

const TOKEN_KEY = "basketball_convex_token";

export default function ConfirmEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [pageState, setPageState] = useState<PageState>("loading");
  const [error, setError] = useState<string | null>(null);

  const confirmEmailMutation = useMutation(api.auth.confirmEmail);

  useEffect(() => {
    const confirmEmail = async () => {
      if (!token) {
        setError("Invalid or missing confirmation token.");
        setPageState("error");
        return;
      }

      try {
        const result = await confirmEmailMutation({ token });

        // Store the tokens to log the user in automatically
        if (result.tokens?.accessToken) {
          localStorage.setItem(TOKEN_KEY, result.tokens.accessToken);
        }

        setPageState("success");
      } catch (err) {
        console.error("Email confirmation error:", err);
        const msg = isErrorWithMessage(err) ? err.message : "";
        if (msg.includes("already confirmed")) {
          setPageState("already-confirmed");
        } else if (msg.includes("Invalid")) {
          setError("This confirmation link is invalid or has expired.");
          setPageState("error");
        } else {
          setError(getErrorMessage(err, "Failed to confirm email. Please try again."));
          setPageState("error");
        }
      }
    };

    confirmEmail();
  }, [token, confirmEmailMutation]);

  const handleContinue = () => {
    // Force a page reload to pick up the new auth state
    window.location.href = "/app";
  };

  // Loading state
  if (pageState === "loading") {
    return (
      <>
        <SEOHead
          title="Confirming Email"
          description="Confirming your email address..."
          robots="noindex, nofollow"
        />
        <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center mb-6">
              <LogoIcon variant="auto" size="xl" />
            </div>
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-surface-600 dark:text-surface-400">Confirming your email...</p>
          </div>
        </div>
      </>
    );
  }

  // Already confirmed state
  if (pageState === "already-confirmed") {
    return (
      <>
        <SEOHead
          title="Email Already Confirmed"
          description="Your email has already been confirmed."
          robots="noindex, nofollow"
        />
        <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8 text-center">
            <div className="mx-auto flex items-center justify-center">
              <LogoIcon variant="auto" size="xl" />
            </div>
            <h2 className="text-display-sm text-surface-900 dark:text-white">Already Confirmed</h2>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300 px-6 py-4 rounded-xl">
              <Icon name="check" size={24} className="mx-auto mb-2" />
              <p>Your email address has already been confirmed. You can log in to your account.</p>
            </div>
            <Link to="/login" className="btn-primary inline-block w-full py-3">
              Go to Login
            </Link>
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (pageState === "error") {
    return (
      <>
        <SEOHead
          title="Email Confirmation Failed"
          description="There was a problem confirming your email."
          robots="noindex, nofollow"
        />
        <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8 text-center">
            <div className="mx-auto flex items-center justify-center">
              <LogoIcon variant="auto" size="xl" />
            </div>
            <h2 className="text-display-sm text-surface-900 dark:text-white">
              Confirmation Failed
            </h2>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 px-6 py-4 rounded-xl">
              <Icon name="x" size={24} className="mx-auto mb-2" />
              <p>{error}</p>
            </div>
            <div className="space-y-3">
              <Link to="/login" className="btn-primary inline-block w-full py-3">
                Go to Login
              </Link>
              <p className="text-sm text-surface-600 dark:text-surface-400">
                Need help?{" "}
                <Link to="/contact" className="text-primary-500 hover:text-primary-400">
                  Contact support
                </Link>
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Success state
  return (
    <>
      <SEOHead
        title="Email Confirmed"
        description="Your email has been successfully confirmed."
        robots="noindex, nofollow"
      />
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="mx-auto flex items-center justify-center">
            <LogoIcon variant="auto" size="xl" />
          </div>
          <h2 className="text-display-sm text-surface-900 dark:text-white">Email Confirmed!</h2>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-800 text-green-800 dark:text-green-300 px-6 py-4 rounded-xl">
            <Icon name="check" size={24} className="mx-auto mb-2" />
            <p>Your email has been successfully confirmed. Welcome to Basketball Stats!</p>
          </div>
          <button onClick={handleContinue} className="btn-primary w-full py-3">
            Get Started
          </button>
        </div>
      </div>
    </>
  );
}
