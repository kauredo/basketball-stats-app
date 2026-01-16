import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  hashPassword,
  verifyPassword,
  generateToken,
  isValidEmail,
  isValidPassword,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
  RESET_TOKEN_EXPIRY,
  getUserFromToken,
  getUserFromRefreshToken,
  formatUser,
} from "./lib/auth";

// Sign up a new user
export const signup = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    passwordConfirmation: v.string(),
    firstName: v.string(),
    lastName: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate email format
    if (!isValidEmail(args.email)) {
      throw new Error("Invalid email format");
    }

    // Validate password
    const passwordCheck = isValidPassword(args.password);
    if (!passwordCheck.valid) {
      throw new Error(passwordCheck.message!);
    }

    // Check password confirmation
    if (args.password !== args.passwordConfirmation) {
      throw new Error("Passwords do not match");
    }

    // Check if email already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (existingUser) {
      throw new Error("Email already registered");
    }

    // Hash password
    const passwordHash = await hashPassword(args.password);

    // Generate confirmation token
    const confirmationToken = generateToken(32);

    // Create user
    const userId = await ctx.db.insert("users", {
      email: args.email.toLowerCase(),
      passwordHash,
      firstName: args.firstName,
      lastName: args.lastName,
      role: "user",
      confirmationToken,
    });

    // Create session
    const token = generateToken(64);
    const refreshToken = generateToken(64);
    const now = Date.now();

    await ctx.db.insert("sessions", {
      userId,
      token,
      expiresAt: now + ACCESS_TOKEN_EXPIRY,
      refreshToken,
      refreshExpiresAt: now + REFRESH_TOKEN_EXPIRY,
    });

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("Failed to create user");

    return {
      user: formatUser(user),
      tokens: {
        accessToken: token,
        refreshToken,
        expiresAt: now + ACCESS_TOKEN_EXPIRY,
      },
      message: "Account created successfully. Please check your email to confirm your account.",
    };
  },
});

// Login with email and password
export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Verify password
    const isValid = await verifyPassword(args.password, user.passwordHash);
    if (!isValid) {
      throw new Error("Invalid email or password");
    }

    // Check if email is confirmed (optional - can be enforced)
    // if (!user.confirmedAt) {
    //   throw new Error("Please confirm your email before logging in");
    // }

    // Create new session
    const token = generateToken(64);
    const refreshToken = generateToken(64);
    const now = Date.now();

    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
      expiresAt: now + ACCESS_TOKEN_EXPIRY,
      refreshToken,
      refreshExpiresAt: now + REFRESH_TOKEN_EXPIRY,
    });

    return {
      user: formatUser(user),
      tokens: {
        accessToken: token,
        refreshToken,
        expiresAt: now + ACCESS_TOKEN_EXPIRY,
      },
      message: "Login successful",
    };
  },
});

// Refresh access token using refresh token
export const refreshToken = mutation({
  args: {
    refreshToken: v.string(),
  },
  handler: async (ctx, args) => {
    const result = await getUserFromRefreshToken(ctx, args.refreshToken);
    if (!result) {
      throw new Error("Invalid or expired refresh token");
    }

    const { user, sessionId } = result;

    // Generate new tokens
    const newToken = generateToken(64);
    const newRefreshToken = generateToken(64);
    const now = Date.now();

    // Update session with new tokens
    await ctx.db.patch(sessionId, {
      token: newToken,
      expiresAt: now + ACCESS_TOKEN_EXPIRY,
      refreshToken: newRefreshToken,
      refreshExpiresAt: now + REFRESH_TOKEN_EXPIRY,
    });

    return {
      user: formatUser(user),
      tokens: {
        accessToken: newToken,
        refreshToken: newRefreshToken,
        expiresAt: now + ACCESS_TOKEN_EXPIRY,
      },
    };
  },
});

// Logout - invalidate session
export const logout = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }

    return { message: "Logged out successfully" };
  },
});

// Get current user from token
export const getCurrentUser = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) {
      return null;
    }

    return { user: formatUser(user) };
  },
});

// Confirm email
export const confirmEmail = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_confirmation_token", (q) => q.eq("confirmationToken", args.token))
      .first();

    if (!user) {
      throw new Error("Invalid confirmation token");
    }

    if (user.confirmedAt) {
      throw new Error("Email already confirmed");
    }

    // Confirm user
    await ctx.db.patch(user._id, {
      confirmedAt: Date.now(),
      confirmationToken: undefined,
    });

    // Create session for auto-login
    const sessionToken = generateToken(64);
    const refreshToken = generateToken(64);
    const now = Date.now();

    await ctx.db.insert("sessions", {
      userId: user._id,
      token: sessionToken,
      expiresAt: now + ACCESS_TOKEN_EXPIRY,
      refreshToken,
      refreshExpiresAt: now + REFRESH_TOKEN_EXPIRY,
    });

    const updatedUser = await ctx.db.get(user._id);
    if (!updatedUser) throw new Error("User not found");

    return {
      user: formatUser(updatedUser),
      tokens: {
        accessToken: sessionToken,
        refreshToken,
        expiresAt: now + ACCESS_TOKEN_EXPIRY,
      },
      message: "Email confirmed successfully",
    };
  },
});

// Request password reset
export const requestPasswordReset = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: "If an account exists with this email, a reset link has been sent." };
    }

    // Generate reset token
    const resetToken = generateToken(32);

    await ctx.db.patch(user._id, {
      resetPasswordToken: resetToken,
      resetPasswordSentAt: Date.now(),
    });

    // TODO: Send email with reset link
    // In production, you would trigger an email here

    return { message: "If an account exists with this email, a reset link has been sent." };
  },
});

// Reset password with token
export const resetPassword = mutation({
  args: {
    token: v.string(),
    password: v.string(),
    passwordConfirmation: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate password
    const passwordCheck = isValidPassword(args.password);
    if (!passwordCheck.valid) {
      throw new Error(passwordCheck.message!);
    }

    if (args.password !== args.passwordConfirmation) {
      throw new Error("Passwords do not match");
    }

    // Find user by reset token
    const user = await ctx.db
      .query("users")
      .withIndex("by_reset_token", (q) => q.eq("resetPasswordToken", args.token))
      .first();

    if (!user || !user.resetPasswordSentAt) {
      throw new Error("Invalid or expired reset token");
    }

    // Check if token is expired (1 hour)
    if (Date.now() - user.resetPasswordSentAt > RESET_TOKEN_EXPIRY) {
      throw new Error("Reset token has expired");
    }

    // Hash new password
    const passwordHash = await hashPassword(args.password);

    // Update user
    await ctx.db.patch(user._id, {
      passwordHash,
      resetPasswordToken: undefined,
      resetPasswordSentAt: undefined,
    });

    // Invalidate all existing sessions
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    // Create new session
    const sessionToken = generateToken(64);
    const refreshToken = generateToken(64);
    const now = Date.now();

    await ctx.db.insert("sessions", {
      userId: user._id,
      token: sessionToken,
      expiresAt: now + ACCESS_TOKEN_EXPIRY,
      refreshToken,
      refreshExpiresAt: now + REFRESH_TOKEN_EXPIRY,
    });

    const updatedUser = await ctx.db.get(user._id);
    if (!updatedUser) throw new Error("User not found");

    return {
      user: formatUser(updatedUser),
      tokens: {
        accessToken: sessionToken,
        refreshToken,
        expiresAt: now + ACCESS_TOKEN_EXPIRY,
      },
      message: "Password reset successfully",
    };
  },
});

// Validate token (used by frontend to check if still logged in)
export const validateToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    return { valid: !!user };
  },
});
