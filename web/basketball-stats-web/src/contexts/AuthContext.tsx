import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useMutation, useConvex } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import type {
  User as SharedUser,
  League as SharedLeague,
  LeagueRole,
} from "@basketball-stats/shared";

// Extend shared types with Convex-specific ID types
interface User extends Omit<SharedUser, "id"> {
  id: Id<"users">;
}

interface League extends Omit<
  SharedLeague,
  "id" | "ownerId" | "createdById" | "leagueType" | "status"
> {
  id: Id<"leagues">;
  leagueType: string;
  status: string;
  teamsCount: number;
  membersCount: number;
  gamesCount: number;
  role?: LeagueRole;
  createdAt: number;
}

// Minimal type for league selection (used when selecting a league to work with)
interface LeagueSelection {
  id: Id<"leagues">;
  name: string;
  season?: string;
  leagueType?: string;
  status?: string;
  role?: LeagueRole;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
  selectedLeague: LeagueSelection | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string, passwordConfirmation: string) => Promise<void>;
  confirmEmail: (token: string) => Promise<void>;
  selectLeague: (league: LeagueSelection | null) => void;
  clearError: () => void;
  initialize: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "basketball_convex_token";
const LEAGUE_KEY = "basketball_selected_league";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<LeagueSelection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const convex = useConvex();
  const loginMutation = useMutation(api.auth.login);
  const signupMutation = useMutation(api.auth.signup);
  const logoutMutation = useMutation(api.auth.logout);
  const requestPasswordResetMutation = useMutation(api.auth.requestPasswordReset);
  const resetPasswordMutation = useMutation(api.auth.resetPassword);
  const confirmEmailMutation = useMutation(api.auth.confirmEmail);

  const initialize = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedLeague = localStorage.getItem(LEAGUE_KEY);

      if (storedLeague) {
        try {
          setSelectedLeague(JSON.parse(storedLeague));
        } catch {
          localStorage.removeItem(LEAGUE_KEY);
        }
      }

      if (storedToken) {
        try {
          const result = await convex.query(api.auth.validateToken, { token: storedToken });
          if (result.valid && result.user) {
            setToken(storedToken);
            setUser({
              id: result.user.id,
              email: result.user.email,
              firstName: result.user.firstName,
              lastName: result.user.lastName,
              role: result.user.role,
            });
          } else {
            localStorage.removeItem(TOKEN_KEY);
          }
        } catch {
          localStorage.removeItem(TOKEN_KEY);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [convex]);

  useEffect(() => {
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally run only on mount

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await loginMutation({ email, password });
      setUser({
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
      });
      setToken(result.tokens.accessToken);
      localStorage.setItem(TOKEN_KEY, result.tokens.accessToken);
    },
    [loginMutation]
  );

  const signup = useCallback(
    async (email: string, password: string, firstName: string, lastName: string) => {
      const result = await signupMutation({
        email,
        password,
        passwordConfirmation: password,
        firstName,
        lastName,
      });
      setUser({
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
      });
      setToken(result.tokens.accessToken);
      localStorage.setItem(TOKEN_KEY, result.tokens.accessToken);
    },
    [signupMutation]
  );

  const logout = useCallback(async () => {
    if (token) {
      try {
        await logoutMutation({ token });
      } catch {
        // Ignore errors on logout
      }
    }
    setUser(null);
    setToken(null);
    setSelectedLeague(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LEAGUE_KEY);
  }, [token, logoutMutation]);

  const selectLeague = useCallback((league: LeagueSelection | null) => {
    setSelectedLeague(league);
    if (league) {
      localStorage.setItem(LEAGUE_KEY, JSON.stringify(league));
    } else {
      localStorage.removeItem(LEAGUE_KEY);
    }
  }, []);

  const forgotPassword = useCallback(
    async (email: string) => {
      setError(null);
      try {
        await requestPasswordResetMutation({ email });
      } catch (err: any) {
        setError(err.message || "Failed to send reset email");
        throw err;
      }
    },
    [requestPasswordResetMutation]
  );

  const resetPassword = useCallback(
    async (resetToken: string, password: string, passwordConfirmation: string) => {
      setError(null);
      try {
        const result = await resetPasswordMutation({
          token: resetToken,
          password,
          passwordConfirmation,
        });
        // Auto-login after password reset
        setUser({
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          role: result.user.role,
        });
        setToken(result.tokens.accessToken);
        localStorage.setItem(TOKEN_KEY, result.tokens.accessToken);
      } catch (err: any) {
        setError(err.message || "Failed to reset password");
        throw err;
      }
    },
    [resetPasswordMutation]
  );

  const confirmEmail = useCallback(
    async (confirmationToken: string) => {
      setError(null);
      try {
        const result = await confirmEmailMutation({ token: confirmationToken });
        // Auto-login after email confirmation
        setUser({
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          role: result.user.role,
        });
        setToken(result.tokens.accessToken);
        localStorage.setItem(TOKEN_KEY, result.tokens.accessToken);
      } catch (err: any) {
        setError(err.message || "Failed to confirm email");
        throw err;
      }
    },
    [confirmEmailMutation]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && !!token,
    isLoading,
    error,
    token,
    selectedLeague,
    login,
    signup,
    logout,
    forgotPassword,
    resetPassword,
    confirmEmail,
    selectLeague,
    clearError,
    initialize,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
