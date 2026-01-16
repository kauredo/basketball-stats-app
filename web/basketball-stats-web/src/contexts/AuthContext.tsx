import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useMutation, useConvex } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

interface User {
  id: Id<"users">;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "user";
}

interface League {
  id: Id<"leagues">;
  name: string;
  description?: string;
  leagueType: string;
  season: string;
  status: string;
  isPublic: boolean;
  teamsCount: number;
  membersCount: number;
  gamesCount: number;
  role?: string;
  createdAt: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
  selectedLeague: League | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  selectLeague: (league: League | null) => void;
  clearError: () => void;
  initialize: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'basketball_convex_token';
const LEAGUE_KEY = 'basketball_selected_league';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const convex = useConvex();
  const loginMutation = useMutation(api.auth.login);
  const signupMutation = useMutation(api.auth.signup);
  const logoutMutation = useMutation(api.auth.logout);
  const requestPasswordResetMutation = useMutation(api.auth.requestPasswordReset);

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
  }, []);

  const login = useCallback(async (email: string, password: string) => {
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
  }, [loginMutation]);

  const signup = useCallback(async (email: string, password: string, firstName: string, lastName: string) => {
    const result = await signupMutation({ email, password, passwordConfirmation: password, firstName, lastName });
    setUser({
      id: result.user.id,
      email: result.user.email,
      firstName: result.user.firstName,
      lastName: result.user.lastName,
      role: result.user.role,
    });
    setToken(result.tokens.accessToken);
    localStorage.setItem(TOKEN_KEY, result.tokens.accessToken);
  }, [signupMutation]);

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

  const selectLeague = useCallback((league: League | null) => {
    setSelectedLeague(league);
    if (league) {
      localStorage.setItem(LEAGUE_KEY, JSON.stringify(league));
    } else {
      localStorage.removeItem(LEAGUE_KEY);
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    setError(null);
    try {
      await requestPasswordResetMutation({ email });
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
      throw err;
    }
  }, [requestPasswordResetMutation]);

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
    selectLeague,
    clearError,
    initialize,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
