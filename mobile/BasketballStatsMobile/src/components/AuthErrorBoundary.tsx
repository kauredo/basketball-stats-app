import React, { Component, type ReactNode } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import * as SecureStore from "expo-secure-store";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  isRedirecting: boolean;
}

const TOKEN_KEY = "basketball_stats_token";
const USER_KEY = "basketball_stats_user";
const LEAGUE_KEY = "basketball_stats_league";

/**
 * Error boundary that catches "Unauthorized" errors from Convex queries
 * and automatically logs out the user by clearing stored credentials.
 */
class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, isRedirecting: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true, isRedirecting: false };
  }

  async componentDidCatch(error: Error) {
    // Check if this is an unauthorized error
    const isUnauthorized =
      error.message?.includes("Unauthorized") ||
      error.message?.includes("Invalid token") ||
      error.message?.includes("Token expired");

    if (isUnauthorized) {
      console.warn("Unauthorized error detected in ErrorBoundary, clearing credentials...");
      this.setState({ isRedirecting: true });

      // Clear stored credentials
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      await SecureStore.deleteItemAsync(LEAGUE_KEY);

      // Force a reload by clearing state after a brief delay
      // The app will restart in a logged-out state
      setTimeout(() => {
        this.setState({ hasError: false, isRedirecting: false });
      }, 500);
    }
  }

  render() {
    if (this.state.hasError) {
      // Show a brief loading state while clearing credentials
      return (
        <View className="flex-1 bg-surface-50 dark:bg-surface-900 justify-center items-center">
          <ActivityIndicator size="large" color="#F97316" />
          <Text className="text-surface-600 dark:text-surface-400 mt-4">
            Session expired. Redirecting to login...
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary;
