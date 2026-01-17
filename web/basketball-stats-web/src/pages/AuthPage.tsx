import React, { useState, useEffect } from "react";
import LoginForm from "../components/auth/LoginForm";
import SignupForm from "../components/auth/SignupForm";
import ForgotPasswordForm from "../components/auth/ForgotPasswordForm";

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

  switch (mode) {
    case "signup":
      return <SignupForm onSwitchToLogin={handleSwitchToLogin} />;
    case "forgot-password":
      return <ForgotPasswordForm onBackToLogin={handleSwitchToLogin} />;
    case "login":
    default:
      return (
        <LoginForm
          onSwitchToSignup={handleSwitchToSignup}
          onSwitchToForgotPassword={handleSwitchToForgotPassword}
        />
      );
  }
}
