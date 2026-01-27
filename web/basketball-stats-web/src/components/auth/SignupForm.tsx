import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import Icon from "../Icon";
import { LogoIcon } from "../Logo";
import { getErrorMessage } from "@basketball-stats/shared";

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

export default function SignupForm({ onSwitchToLogin }: SignupFormProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    passwordConfirmation: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signup } = useAuth();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { firstName, lastName, email, password, passwordConfirmation } = formData;

    if (!firstName.trim()) {
      return "Please enter your first name";
    }

    if (!lastName.trim()) {
      return "Please enter your last name";
    }

    if (!email.trim()) {
      return "Please enter your email";
    }

    if (!email.includes("@")) {
      return "Please enter a valid email address";
    }

    if (password.length < 6) {
      return "Password must be at least 6 characters";
    }

    if (password !== passwordConfirmation) {
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

    setIsLoading(true);
    setError(null);

    try {
      await signup(
        formData.email.trim().toLowerCase(),
        formData.password,
        formData.firstName.trim(),
        formData.lastName.trim()
      );
      // Navigation will be handled by the auth state change
    } catch (err) {
      console.error("Signup error:", err);
      setError(getErrorMessage(err, "Failed to create account. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto flex items-center justify-center">
            <LogoIcon variant="auto" size="xl" />
          </div>
          <h2 className="mt-6 text-center text-display-sm text-surface-900 dark:text-white">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-surface-600 dark:text-surface-400">
            Or{" "}
            <button
              onClick={onSwitchToLogin}
              className="font-medium text-primary-500 hover:text-primary-400 focus:outline-none focus-ring rounded"
            >
              sign in to your existing account
            </button>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                >
                  First name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  required
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  className="mt-1 relative block w-full px-4 py-3 border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 placeholder-surface-500 dark:placeholder-surface-400 text-surface-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors"
                  placeholder="John"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                >
                  Last name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  required
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  className="mt-1 relative block w-full px-4 py-3 border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 placeholder-surface-500 dark:placeholder-surface-400 text-surface-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors"
                  placeholder="Doe"
                  disabled={isLoading}
                />
              </div>
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
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="mt-1 relative block w-full px-4 py-3 border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 placeholder-surface-500 dark:placeholder-surface-400 text-surface-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors"
                placeholder="john.doe@example.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-surface-700 dark:text-surface-300"
              >
                Password
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
                  placeholder="Enter password (min. 6 chars)"
                  disabled={isLoading}
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
                Confirm password
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
                  placeholder="Confirm your password"
                  disabled={isLoading}
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

          <div>
            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3">
              {isLoading ? "Creating account..." : "Create account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
