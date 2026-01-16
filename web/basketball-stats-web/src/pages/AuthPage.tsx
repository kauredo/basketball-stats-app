import React, { useState } from "react";
import LoginForm from "../components/auth/LoginForm";
import SignupForm from "../components/auth/SignupForm";
import ForgotPasswordForm from "../components/auth/ForgotPasswordForm";

type AuthMode = "login" | "signup" | "forgot-password";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");

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
