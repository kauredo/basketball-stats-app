import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import * as SecureStore from "expo-secure-store";
import type { User as SharedUser, League as SharedLeague } from "@basketball-stats/shared";

// Extend shared types with Convex-specific ID types
interface User extends Omit<SharedUser, "id"> {
  id: Id<"users">;
}

interface League extends Omit<
  SharedLeague,
  "id" | "ownerId" | "createdById" | "leagueType" | "status"
> {
  id: Id<"leagues">;
  leagueType: string; // String to match Convex API response
  status: string;
  ownerId?: string;
  createdById?: string;
  membership?: {
    id?: string;
    role: string;
    status?: string;
    joinedAt?: number;
  } | null;
}

// Type for league selection (used when selecting a league to work with)
// Includes all properties that screens might need to access
interface LeagueSelection {
  id: Id<"leagues">;
  name: string;
  season?: string;
  leagueType?: string;
  status?: string;
  role?: string; // User's role in this league (from membership)
  membership?: {
    id?: string;
    role: string;
    status?: string;
    joinedAt?: number;
  } | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  user: User | null;
  token: string | null;
  selectedLeague: LeagueSelection | null;
  userLeagues: League[];
  login: (email: string, password: string) => Promise<void>;
  signup: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  selectLeague: (league: LeagueSelection | null) => void;
  setUserLeagues: (leagues: League[]) => void;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  handleConvexError: (error: unknown) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "basketball_stats_token";
const USER_KEY = "basketball_stats_user";
const LEAGUE_KEY = "basketball_stats_league";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<LeagueSelection | null>(null);
  const [userLeagues, setUserLeagues] = useState<League[]>([]);

  const loginMutation = useMutation(api.auth.login);
  const signupMutation = useMutation(api.auth.signup);
  const logoutMutation = useMutation(api.auth.logout);
  const requestPasswordResetMutation = useMutation(api.auth.requestPasswordReset);

  // Query for refreshing user data
  const currentUserData = useQuery(api.auth.getCurrentUser, token ? { token } : "skip");

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      const storedUser = await SecureStore.getItemAsync(USER_KEY);
      const storedLeague = await SecureStore.getItemAsync(LEAGUE_KEY);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);

        if (storedLeague) {
          setSelectedLeague(JSON.parse(storedLeague));
        }
      }
    } catch (err) {
      console.error("Failed to initialize auth:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await loginMutation({ email, password });

      const accessToken = result.tokens.accessToken;
      await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(result.user));

      setToken(accessToken);
      setUser({
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
      });
      setIsAuthenticated(true);
    } catch (err: any) {
      const errorMessage = err.message || "Login failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (firstName: string, lastName: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signupMutation({
        firstName,
        lastName,
        email,
        password,
        passwordConfirmation: password,
      });

      const accessToken = result.tokens.accessToken;
      await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(result.user));

      setToken(accessToken);
      setUser({
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
      });
      setIsAuthenticated(true);
    } catch (err: any) {
      const errorMessage = err.message || "Signup failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await logoutMutation({ token });
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      await SecureStore.deleteItemAsync(LEAGUE_KEY);

      setToken(null);
      setUser(null);
      setSelectedLeague(null);
      setUserLeagues([]);
      setIsAuthenticated(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await requestPasswordResetMutation({ email });
    } catch (err: any) {
      const errorMessage = err.message || "Failed to send reset email";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const selectLeague = async (league: LeagueSelection | null) => {
    setSelectedLeague(league);
    if (league) {
      await SecureStore.setItemAsync(LEAGUE_KEY, JSON.stringify(league));
    } else {
      await SecureStore.deleteItemAsync(LEAGUE_KEY);
    }
  };

  const clearError = () => setError(null);

  /**
   * Force logout without calling the server.
   * Used when we detect an unauthorized error and need to clear credentials immediately.
   */
  const forceLogout = async () => {
    console.warn("Force logout triggered - clearing stored credentials");
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    await SecureStore.deleteItemAsync(LEAGUE_KEY);

    setToken(null);
    setUser(null);
    setSelectedLeague(null);
    setUserLeagues([]);
    setIsAuthenticated(false);
  };

  /**
   * Handle Convex errors and automatically log out on unauthorized errors.
   * Call this in catch blocks when making Convex queries/mutations.
   * @returns true if the error was an unauthorized error and logout was triggered
   */
  const handleConvexError = (error: unknown): boolean => {
    if (error instanceof Error) {
      const isUnauthorized =
        error.message?.includes("Unauthorized") ||
        error.message?.includes("Invalid token") ||
        error.message?.includes("Token expired");

      if (isUnauthorized) {
        console.warn("Unauthorized error in async operation, logging out...");
        forceLogout();
        return true;
      }
    }
    return false;
  };

  const refreshUser = async () => {
    if (currentUserData?.user) {
      const updatedUser = {
        id: currentUserData.user.id,
        email: currentUserData.user.email,
        firstName: currentUserData.user.firstName,
        lastName: currentUserData.user.lastName,
        role: currentUserData.user.role,
      };
      setUser(updatedUser);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(updatedUser));
    }
  };

  // Sync user data when query updates and handle invalid tokens
  useEffect(() => {
    if (currentUserData?.user && user) {
      // Check if user data has changed
      if (
        currentUserData.user.firstName !== user.firstName ||
        currentUserData.user.lastName !== user.lastName
      ) {
        refreshUser();
      }
    } else if (token && currentUserData === null && !isLoading) {
      // Token exists but validation returned null - token is invalid
      // Clear stored credentials and log out
      console.warn("Stored token is invalid, logging out");
      logout();
    }
  }, [currentUserData, token, isLoading]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        error,
        user,
        token,
        selectedLeague,
        userLeagues,
        login,
        signup,
        logout,
        forgotPassword,
        selectLeague,
        setUserLeagues,
        clearError,
        refreshUser,
        handleConvexError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
