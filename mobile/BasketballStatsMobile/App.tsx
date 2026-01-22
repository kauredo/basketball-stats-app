import React, { useEffect } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SecureStore from "expo-secure-store";
import { AuthProvider } from "./src/contexts/AuthContext";
import { ThemeProvider } from "./src/contexts/ThemeContext";
import { NotificationProvider } from "./src/contexts/NotificationContext";
import { DeepLinkProvider } from "./src/contexts/DeepLinkContext";
import AuthErrorBoundary from "./src/components/AuthErrorBoundary";
import AppNavigator from "./src/navigation/AppNavigator";

// Storage keys (must match AuthContext)
const TOKEN_KEY = "basketball_stats_token";
const USER_KEY = "basketball_stats_user";
const LEAGUE_KEY = "basketball_stats_league";

/**
 * Check if an error is an unauthorized error
 */
function isUnauthorizedError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message?.includes("Unauthorized") ||
      error.message?.includes("Invalid token") ||
      error.message?.includes("Token expired")
    );
  }
  return false;
}

/**
 * Clear stored credentials when unauthorized error is detected
 */
async function clearCredentials() {
  console.warn("Unauthorized error detected - clearing stored credentials");
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
  await SecureStore.deleteItemAsync(LEAGUE_KEY);
}

// Initialize Convex client
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL || "";
const convex = new ConvexReactClient(convexUrl);

function App() {
  // Set up global handler for unhandled promise rejections (catches Convex query errors)
  useEffect(() => {
    // Store the original handler
    const originalHandler = global.ErrorUtils?.getGlobalHandler?.();

    // Set up custom handler
    const customHandler = (error: Error, isFatal?: boolean) => {
      if (isUnauthorizedError(error)) {
        clearCredentials();
        // Don't re-throw, just handle silently after clearing credentials
        // The app will redirect to login when it detects missing credentials
        return;
      }

      // Call original handler for other errors
      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    };

    // Apply custom handler if ErrorUtils is available
    if (global.ErrorUtils?.setGlobalHandler) {
      global.ErrorUtils.setGlobalHandler(customHandler);
    }

    // Cleanup: restore original handler
    return () => {
      if (global.ErrorUtils?.setGlobalHandler && originalHandler) {
        global.ErrorUtils.setGlobalHandler(originalHandler);
      }
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ConvexProvider client={convex}>
        <AuthErrorBoundary>
          <ThemeProvider>
            <AuthProvider>
              <DeepLinkProvider>
                <NotificationProvider>
                  <AppNavigator />
                </NotificationProvider>
              </DeepLinkProvider>
            </AuthProvider>
          </ThemeProvider>
        </AuthErrorBoundary>
      </ConvexProvider>
    </GestureHandlerRootView>
  );
}

export default App;
