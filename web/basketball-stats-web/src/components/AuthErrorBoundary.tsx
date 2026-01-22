import React, { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

const TOKEN_KEY = "basketball_convex_token";
const LEAGUE_KEY = "basketball_selected_league";

/**
 * Error boundary that catches "Unauthorized" errors from Convex queries
 * and automatically logs out the user by clearing stored credentials.
 */
class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // Check if this is an unauthorized error
    const isUnauthorized =
      error.message?.includes("Unauthorized") ||
      error.message?.includes("Invalid token") ||
      error.message?.includes("Token expired");

    if (isUnauthorized) {
      console.warn("Unauthorized error detected, clearing credentials and reloading...");

      // Clear stored credentials
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(LEAGUE_KEY);

      // Reload the page to reset app state
      window.location.href = "/login";
    }
  }

  render() {
    if (this.state.hasError) {
      // Show a brief loading state while redirecting
      return (
        <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center">
          <div className="text-center">
            <p className="text-surface-600 dark:text-surface-400">
              Session expired. Redirecting to login...
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary;

/**
 * Hook to handle unauthorized errors in async operations.
 * Call this in catch blocks when making Convex queries/mutations.
 */
export function handleConvexError(error: unknown): void {
  if (error instanceof Error) {
    const isUnauthorized =
      error.message?.includes("Unauthorized") ||
      error.message?.includes("Invalid token") ||
      error.message?.includes("Token expired");

    if (isUnauthorized) {
      console.warn("Unauthorized error in async operation, clearing credentials...");
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(LEAGUE_KEY);
      window.location.href = "/login";
    }
  }
}
