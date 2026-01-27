import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import Icon from "../../components/Icon";
import { LogoIcon } from "../../components/Logo";
import SEOHead from "../../components/seo/SEOHead";
import { getErrorMessage, isErrorWithMessage } from "@basketball-stats/shared";

type PageState = "loading" | "form" | "success" | "error";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [pageState, setPageState] = useState<PageState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    password: "",
    passwordConfirmation: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetPasswordMutation = useMutation(api.auth.resetPassword);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token. Please request a new password reset link.");
      setPageState("error");
    } else {
      setPageState("form");
    }
  }, [token]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (formData.password.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (formData.password !== formData.passwordConfirmation) {
      return "Passwords do not match";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!token) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await resetPasswordMutation({
        token,
        password: formData.password,
        passwordConfirmation: formData.passwordConfirmation,
      });
      setPageState("success");
    } catch (err) {
      console.error("Reset password error:", err);
      const msg = isErrorWithMessage(err) ? err.message : "";
      if (msg.includes("expired")) {
        setError("This reset link has expired. Please request a new one.");
      } else if (msg.includes("Invalid")) {
        setError("This reset link is invalid. Please request a new one.");
      } else {
        setError(getErrorMessage(err, "Failed to reset password. Please try again."));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (pageState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-surface-600 dark:text-surface-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state (invalid/missing token)
  if (pageState === "error") {
    return (
      <>
        <SEOHead
          title="Reset Password"
          description="Reset your Basketball Stats account password."
          robots="noindex, nofollow"
        />
        <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8 text-center">
            <div className="mx-auto flex items-center justify-center">
              <LogoIcon variant="auto" size="xl" />
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 px-6 py-4 rounded-xl">
              <Icon name="x" size={24} className="mx-auto mb-2" />
              <p>{error}</p>
            </div>
            <Link to="/login" className="btn-primary inline-block px-6 py-3">
              Back to Login
            </Link>
          </div>
        </div>
      </>
    );
  }

  // Success state
  if (pageState === "success") {
    return (
      <>
        <SEOHead
          title="Password Reset Successfully"
          description="Your password has been reset successfully."
          robots="noindex, nofollow"
        />
        <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8 text-center">
            <div className="mx-auto flex items-center justify-center">
              <LogoIcon variant="auto" size="xl" />
            </div>
            <h2 className="text-display-sm text-surface-900 dark:text-white">Password Reset!</h2>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-800 text-green-800 dark:text-green-300 px-6 py-4 rounded-xl">
              <Icon name="check" size={24} className="mx-auto mb-2" />
              <p>
                Your password has been successfully reset. You can now log in with your new
                password.
              </p>
            </div>
            <button onClick={() => navigate("/login")} className="btn-primary w-full py-3">
              Continue to Login
            </button>
          </div>
        </div>
      </>
    );
  }

  // Form state
  return (
    <>
      <SEOHead
        title="Reset Password"
        description="Create a new password for your Basketball Stats account."
        robots="noindex, nofollow"
      />
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto flex items-center justify-center">
              <LogoIcon variant="auto" size="xl" />
            </div>
            <h2 className="mt-6 text-center text-display-sm text-surface-900 dark:text-white">
              Create new password
            </h2>
            <p className="mt-2 text-center text-sm text-surface-600 dark:text-surface-400">
              Enter your new password below.
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div role="alert" aria-live="polite" aria-atomic="true">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                >
                  New password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="relative block w-full px-4 py-3 pr-10 border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 placeholder-surface-500 dark:placeholder-surface-400 text-surface-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors"
                    placeholder="Enter new password (min. 8 chars)"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <Icon
                      name={showPassword ? "eye-off" : "eye"}
                      size={20}
                      className="text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300 transition-colors"
                    />
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="passwordConfirmation"
                  className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                >
                  Confirm new password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="passwordConfirmation"
                    name="passwordConfirmation"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={formData.passwordConfirmation}
                    onChange={(e) => handleInputChange("passwordConfirmation", e.target.value)}
                    className="relative block w-full px-4 py-3 pr-10 border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 placeholder-surface-500 dark:placeholder-surface-400 text-surface-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors"
                    placeholder="Confirm your new password"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    <Icon
                      name={showConfirmPassword ? "eye-off" : "eye"}
                      size={20}
                      className="text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300 transition-colors"
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3">
                {isSubmitting ? "Resetting password..." : "Reset password"}
              </button>

              <Link to="/login" className="btn-secondary w-full py-3 block text-center">
                Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
