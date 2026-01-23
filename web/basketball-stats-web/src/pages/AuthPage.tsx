import React, { useState, useEffect } from "react";
import LoginForm from "../components/auth/LoginForm";
import SignupForm from "../components/auth/SignupForm";
import ForgotPasswordForm from "../components/auth/ForgotPasswordForm";
import SEOHead from "../components/seo/SEOHead";

type AuthMode = "login" | "signup" | "forgot-password";

interface AuthPageProps {
  initialMode?: AuthMode;
}

export default function AuthPage({ initialMode = "login" }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const handleSwitchToLogin = () => setMode("login");
  const handleSwitchToSignup = () => setMode("signup");
  const handleSwitchToForgotPassword = () => setMode("forgot-password");

  const seoTitle =
    mode === "signup" ? "Sign Up" : mode === "forgot-password" ? "Reset Password" : "Log In";

  return (
    <>
      <SEOHead
        title={seoTitle}
        description="Access your Basketball Stats account to track games and analyze player performance."
        robots="noindex, nofollow"
      />
      {mode === "signup" ? (
        <SignupForm onSwitchToLogin={handleSwitchToLogin} />
      ) : mode === "forgot-password" ? (
        <ForgotPasswordForm onBackToLogin={handleSwitchToLogin} />
      ) : (
        <LoginForm
          onSwitchToSignup={handleSwitchToSignup}
          onSwitchToForgotPassword={handleSwitchToForgotPassword}
        />
      )}
    </>
  );
}
