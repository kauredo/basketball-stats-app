import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateToken,
  isValidEmail,
  isValidPassword,
  formatUser,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
  RESET_TOKEN_EXPIRY,
} from "./auth";
import type { Id } from "../_generated/dataModel";

// Mock crypto for tests
const mockCrypto = {
  getRandomValues: (array: Uint8Array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  },
};

// Set up crypto mock before tests
beforeEach(() => {
  if (typeof globalThis.crypto === "undefined") {
    Object.defineProperty(globalThis, "crypto", {
      value: mockCrypto,
      writable: true,
      configurable: true,
    });
  }
});

describe("Auth Library", () => {
  describe("generateToken", () => {
    it("generates token of default length (32)", () => {
      const token = generateToken();
      expect(token.length).toBe(32);
    });

    it("generates token of specified length", () => {
      const token = generateToken(16);
      expect(token.length).toBe(16);
    });

    it("generates token of specified length (64)", () => {
      const token = generateToken(64);
      expect(token.length).toBe(64);
    });

    it("generates unique tokens", () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateToken());
      }
      expect(tokens.size).toBe(100);
    });

    it("only contains alphanumeric characters", () => {
      const token = generateToken(100);
      expect(token).toMatch(/^[A-Za-z0-9]+$/);
    });
  });

  describe("isValidEmail", () => {
    it("returns true for valid email", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
    });

    it("returns true for email with subdomain", () => {
      expect(isValidEmail("test@mail.example.com")).toBe(true);
    });

    it("returns true for email with plus sign", () => {
      expect(isValidEmail("test+tag@example.com")).toBe(true);
    });

    it("returns true for email with dots in local part", () => {
      expect(isValidEmail("first.last@example.com")).toBe(true);
    });

    it("returns false for email without @", () => {
      expect(isValidEmail("testexample.com")).toBe(false);
    });

    it("returns false for email without domain", () => {
      expect(isValidEmail("test@")).toBe(false);
    });

    it("returns false for email without local part", () => {
      expect(isValidEmail("@example.com")).toBe(false);
    });

    it("returns false for email with spaces", () => {
      expect(isValidEmail("test @example.com")).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(isValidEmail("")).toBe(false);
    });

    it("returns false for email without TLD", () => {
      expect(isValidEmail("test@example")).toBe(false);
    });
  });

  describe("isValidPassword", () => {
    it("returns valid for password with 6+ characters", () => {
      const result = isValidPassword("password123");
      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it("returns valid for exactly 6 characters", () => {
      const result = isValidPassword("123456");
      expect(result.valid).toBe(true);
    });

    it("returns invalid for password with 5 characters", () => {
      const result = isValidPassword("12345");
      expect(result.valid).toBe(false);
      expect(result.message).toBe("Password must be at least 6 characters");
    });

    it("returns invalid for empty password", () => {
      const result = isValidPassword("");
      expect(result.valid).toBe(false);
    });

    it("returns valid for long password", () => {
      const result = isValidPassword("a".repeat(100));
      expect(result.valid).toBe(true);
    });

    it("returns valid for password with special characters", () => {
      const result = isValidPassword("p@ss!word#123");
      expect(result.valid).toBe(true);
    });
  });

  describe("Token Expiry Constants", () => {
    it("ACCESS_TOKEN_EXPIRY is 24 hours in ms", () => {
      expect(ACCESS_TOKEN_EXPIRY).toBe(24 * 60 * 60 * 1000);
    });

    it("REFRESH_TOKEN_EXPIRY is 7 days in ms", () => {
      expect(REFRESH_TOKEN_EXPIRY).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it("RESET_TOKEN_EXPIRY is 1 hour in ms", () => {
      expect(RESET_TOKEN_EXPIRY).toBe(60 * 60 * 1000);
    });
  });

  describe("formatUser", () => {
    const mockUser = {
      _id: "user-123" as Id<"users">,
      _creationTime: 1700000000000,
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      passwordHash: "sensitive-hash",
      role: "user" as const,
      confirmedAt: 1700000000000,
    };

    it("includes id from _id", () => {
      const result = formatUser(mockUser);
      expect(result.id).toBe("user-123");
    });

    it("includes email", () => {
      const result = formatUser(mockUser);
      expect(result.email).toBe("test@example.com");
    });

    it("includes firstName", () => {
      const result = formatUser(mockUser);
      expect(result.firstName).toBe("Test");
    });

    it("includes lastName", () => {
      const result = formatUser(mockUser);
      expect(result.lastName).toBe("User");
    });

    it("computes fullName from firstName and lastName", () => {
      const result = formatUser(mockUser);
      expect(result.fullName).toBe("Test User");
    });

    it("includes role", () => {
      const result = formatUser(mockUser);
      expect(result.role).toBe("user");
    });

    it("sets confirmed to true when confirmedAt is set", () => {
      const result = formatUser(mockUser);
      expect(result.confirmed).toBe(true);
    });

    it("sets confirmed to false when confirmedAt is undefined", () => {
      const unconfirmedUser = { ...mockUser, confirmedAt: undefined };
      const result = formatUser(unconfirmedUser);
      expect(result.confirmed).toBe(false);
    });

    it("includes createdAt from _creationTime", () => {
      const result = formatUser(mockUser);
      expect(result.createdAt).toBe(1700000000000);
    });

    it("does not include passwordHash", () => {
      const result = formatUser(mockUser);
      expect((result as any).passwordHash).toBeUndefined();
    });

    it("handles admin role", () => {
      const adminUser = { ...mockUser, role: "admin" as const };
      const result = formatUser(adminUser);
      expect(result.role).toBe("admin");
    });
  });
});
