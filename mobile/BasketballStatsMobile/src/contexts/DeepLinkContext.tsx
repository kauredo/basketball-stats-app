import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import * as Linking from "expo-linking";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "./AuthContext";
import { Alert } from "react-native";

interface DeepLinkContextType {
  pendingInviteCode: string | null;
  isProcessingDeepLink: boolean;
  clearPendingInviteCode: () => void;
}

const DeepLinkContext = createContext<DeepLinkContextType | undefined>(undefined);

/**
 * Parse invite code from a deep link URL.
 * Supports both:
 * - basketballstats://join/{code}
 * - https://basketballstatsapp.com/join/{code}
 */
function parseInviteCode(url: string): string | null {
  try {
    const parsed = Linking.parse(url);

    // Handle path like "join/my-league-abc123"
    if (parsed.path?.startsWith("join/")) {
      return parsed.path.replace("join/", "");
    }

    // Handle path like "join" with code as query param
    if (parsed.path === "join" && parsed.queryParams?.code) {
      return parsed.queryParams.code as string;
    }

    return null;
  } catch {
    return null;
  }
}

export function DeepLinkProvider({ children }: { children: ReactNode }) {
  const [pendingInviteCode, setPendingInviteCode] = useState<string | null>(null);
  const [isProcessingDeepLink, setIsProcessingDeepLink] = useState(false);
  const [hasShownConfirmation, setHasShownConfirmation] = useState(false);

  const { isAuthenticated, token, isLoading, selectLeague } = useAuth();
  const joinByCodeMutation = useMutation(api.leagues.joinByCode);

  // Fetch league info when we have a pending invite code
  const leagueInfo = useQuery(
    api.leagues.getLeagueByInviteCode,
    pendingInviteCode ? { code: pendingInviteCode } : "skip"
  );

  // Handle incoming URL
  const handleUrl = useCallback((url: string) => {
    const inviteCode = parseInviteCode(url);
    if (inviteCode) {
      setPendingInviteCode(inviteCode);
      setHasShownConfirmation(false);
    }
  }, []);

  // Listen for deep links
  useEffect(() => {
    // Check initial URL (app opened from link while closed)
    const checkInitialUrl = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        handleUrl(initialUrl);
      }
    };
    checkInitialUrl();

    // Listen for URLs while app is running (app in background)
    const subscription = Linking.addEventListener("url", (event) => {
      handleUrl(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, [handleUrl]);

  // Show confirmation when authenticated and league info is loaded
  useEffect(() => {
    if (
      !pendingInviteCode ||
      isLoading ||
      !isAuthenticated ||
      !token ||
      hasShownConfirmation ||
      leagueInfo === undefined // Still loading
    ) {
      return;
    }

    // League not found
    if (leagueInfo === null) {
      Alert.alert("Invalid Link", "This invite link is no longer valid.", [{ text: "OK" }]);
      setPendingInviteCode(null);
      return;
    }

    // Show confirmation dialog
    setHasShownConfirmation(true);
    Alert.alert(
      "Join League",
      `Would you like to join "${leagueInfo.name}"?\n\n${leagueInfo.membersCount} members · ${leagueInfo.teamsCount} teams`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {
            setPendingInviteCode(null);
          },
        },
        {
          text: "Join",
          onPress: () => {
            handleJoinLeague();
          },
        },
      ]
    );
  }, [pendingInviteCode, isAuthenticated, token, isLoading, leagueInfo, hasShownConfirmation]);

  const handleJoinLeague = async () => {
    if (!pendingInviteCode || !token) return;

    setIsProcessingDeepLink(true);
    try {
      const result = await joinByCodeMutation({ token, code: pendingInviteCode });

      // Auto-select the joined league
      if (result.league) {
        selectLeague(result.league as any);
      }

      Alert.alert("Welcome!", `You've joined ${result.league.name}`, [{ text: "OK" }]);
    } catch (error: any) {
      if (error.message?.includes("Already a member")) {
        Alert.alert("Already Joined", "You're already a member of this league.");
      } else {
        Alert.alert("Error", error.message || "Failed to join league");
      }
    } finally {
      setPendingInviteCode(null);
      setIsProcessingDeepLink(false);
    }
  };

  const clearPendingInviteCode = useCallback(() => {
    setPendingInviteCode(null);
    setHasShownConfirmation(false);
  }, []);

  return (
    <DeepLinkContext.Provider
      value={{
        pendingInviteCode,
        isProcessingDeepLink,
        clearPendingInviteCode,
      }}
    >
      {children}
    </DeepLinkContext.Provider>
  );
}

export function useDeepLink() {
  const context = useContext(DeepLinkContext);
  if (context === undefined) {
    throw new Error("useDeepLink must be used within a DeepLinkProvider");
  }
  return context;
}
