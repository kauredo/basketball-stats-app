import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import Icon from "../Icon";
import { LogoIcon } from "../Logo";

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

export default function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { forgotPassword, isLoading, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      return;
    }

    try {
      clearError();
      await forgotPassword(email.trim().toLowerCase());
      setIsSubmitted(true);
    } catch (error) {
      console.error("Reset password error:", error);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto flex items-center justify-center">
              <LogoIcon variant="auto" size="xl" />
            </div>
            <h2 className="mt-6 text-center text-display-sm text-surface-900 dark:text-white">
              Check your email
            </h2>
            <p className="mt-2 text-center text-sm text-surface-600 dark:text-surface-400">
              We&apos;ve sent a password reset link to {email}
            </p>
          </div>

          <div className="mt-8 space-y-6">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-800 text-green-800 dark:text-green-300 px-4 py-3 rounded-xl">
              Password reset instructions have been sent to your email address. Please check your
              inbox and follow the instructions to reset your password.
            </div>

            <div>
              <button onClick={onBackToLogin} className="btn-primary w-full py-3">
                Back to Sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center">
            <Icon name="basketball" size={32} className="text-primary-500" />
          </div>
          <h2 className="mt-6 text-center text-display-sm text-surface-900 dark:text-white">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-surface-600 dark:text-surface-400">
            Enter your email address and we&apos;ll send you a link to reset your password.
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

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-surface-700 dark:text-surface-300"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 relative block w-full px-4 py-3 border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 placeholder-surface-500 dark:placeholder-surface-400 text-surface-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors"
              placeholder="Enter your email address"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="btn-primary w-full py-3"
            >
              {isLoading ? "Sending..." : "Send reset link"}
            </button>

            <button type="button" onClick={onBackToLogin} className="btn-secondary w-full py-3">
              Back to Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
