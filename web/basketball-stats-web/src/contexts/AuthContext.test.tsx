import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import React from "react";
import { AuthProvider, useAuth } from "./AuthContext";

// Mock Convex mutations
const mockLoginMutation = vi.fn();
const mockSignupMutation = vi.fn();
const mockLogoutMutation = vi.fn();
const mockRequestPasswordResetMutation = vi.fn();
const mockResetPasswordMutation = vi.fn();
const mockConfirmEmailMutation = vi.fn();
const mockQuery = vi.fn();

vi.mock("convex/react", () => ({
  useMutation: vi.fn((apiRef: string) => {
    switch (apiRef) {
      case "login":
        return mockLoginMutation;
      case "signup":
        return mockSignupMutation;
      case "logout":
        return mockLogoutMutation;
      case "requestPasswordReset":
        return mockRequestPasswordResetMutation;
      case "resetPassword":
        return mockResetPasswordMutation;
      case "confirmEmail":
        return mockConfirmEmailMutation;
      default:
        return vi.fn();
    }
  }),
  useConvex: () => ({
    query: mockQuery,
  }),
}));

vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    auth: {
      login: "login",
      signup: "signup",
      logout: "logout",
      requestPasswordReset: "requestPasswordReset",
      resetPassword: "resetPassword",
      confirmEmail: "confirmEmail",
      validateToken: "validateToken",
    },
  },
}));

const mockUser = {
  id: "user-123" as any,
  email: "test@example.com",
  firstName: "Test",
  lastName: "User",
  role: "user" as const,
};

const mockTokens = {
  accessToken: "test-token-123",
  refreshToken: "refresh-token-123",
  expiresAt: Date.now() + 3600000,
};

const mockLeague = {
  id: "league-123" as any,
  name: "Test League",
  season: "2024",
};

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Default: no valid token stored
    mockQuery.mockResolvedValue({ valid: false });
  });

  afterEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  describe("useAuth hook", () => {
    it("throws error when used outside AuthProvider", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow("useAuth must be used within an AuthProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("initial state", () => {
    it("initializes with no user when no stored token", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.token).toBeNull();
    });
  });

  describe("login", () => {
    it("logs in user and stores token", async () => {
      mockLoginMutation.mockResolvedValueOnce({
        user: mockUser,
        tokens: mockTokens,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login("test@example.com", "password123");
      });

      expect(result.current.user?.email).toBe("test@example.com");
      expect(result.current.token).toBe(mockTokens.accessToken);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it("calls login mutation with correct credentials", async () => {
      mockLoginMutation.mockResolvedValueOnce({
        user: mockUser,
        tokens: mockTokens,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login("test@example.com", "password123");
      });

      expect(mockLoginMutation).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  describe("signup", () => {
    it("signs up user and stores token", async () => {
      mockSignupMutation.mockResolvedValueOnce({
        user: mockUser,
        tokens: mockTokens,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.signup("test@example.com", "password123", "Test", "User");
      });

      expect(result.current.user?.email).toBe("test@example.com");
      expect(result.current.isAuthenticated).toBe(true);
    });

    it("calls signup mutation with all fields", async () => {
      mockSignupMutation.mockResolvedValueOnce({
        user: mockUser,
        tokens: mockTokens,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.signup("test@example.com", "password123", "Test", "User");
      });

      expect(mockSignupMutation).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
        passwordConfirmation: "password123",
        firstName: "Test",
        lastName: "User",
      });
    });
  });

  describe("logout", () => {
    it("clears user state on logout", async () => {
      mockLoginMutation.mockResolvedValueOnce({
        user: mockUser,
        tokens: mockTokens,
      });
      mockLogoutMutation.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Login first
      await act(async () => {
        await result.current.login("test@example.com", "password123");
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Then logout
      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe("selectLeague", () => {
    it("sets selected league", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.selectLeague(mockLeague);
      });

      expect(result.current.selectedLeague?.name).toBe("Test League");
    });

    it("clears selected league when passed null", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // First set a league
      act(() => {
        result.current.selectLeague(mockLeague);
      });

      expect(result.current.selectedLeague).not.toBeNull();

      // Then clear it
      act(() => {
        result.current.selectLeague(null);
      });

      expect(result.current.selectedLeague).toBeNull();
    });
  });

  describe("token persistence", () => {
    it("restores user from valid stored token", async () => {
      localStorage.setItem("basketball_convex_token", "stored-token");
      mockQuery.mockResolvedValueOnce({
        valid: true,
        user: mockUser,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user?.email).toBe("test@example.com");
      expect(result.current.token).toBe("stored-token");
      expect(result.current.isAuthenticated).toBe(true);
    });

    it("clears invalid stored token", async () => {
      localStorage.setItem("basketball_convex_token", "invalid-token");
      mockQuery.mockResolvedValueOnce({ valid: false });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });

    it("restores selected league from storage", async () => {
      localStorage.setItem("basketball_selected_league", JSON.stringify(mockLeague));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.selectedLeague?.name).toBe("Test League");
    });
  });

  describe("error handling", () => {
    it("clears error with clearError", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe("password reset", () => {
    it("calls forgotPassword mutation", async () => {
      mockRequestPasswordResetMutation.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.forgotPassword("test@example.com");
      });

      expect(mockRequestPasswordResetMutation).toHaveBeenCalledWith({
        email: "test@example.com",
      });
    });

    it("resets password and auto-logs in", async () => {
      mockResetPasswordMutation.mockResolvedValueOnce({
        user: mockUser,
        tokens: mockTokens,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.resetPassword("reset-token", "newpassword", "newpassword");
      });

      expect(result.current.user?.email).toBe("test@example.com");
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe("email confirmation", () => {
    it("confirms email and auto-logs in", async () => {
      mockConfirmEmailMutation.mockResolvedValueOnce({
        user: mockUser,
        tokens: mockTokens,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.confirmEmail("confirmation-token");
      });

      expect(result.current.user?.email).toBe("test@example.com");
      expect(result.current.isAuthenticated).toBe(true);
    });
  });
});
