/**
 * Extract a user-friendly error message from various error types
 */
export function getErrorMessage(error: unknown, fallback = "An unexpected error occurred"): string {
  if (!error) return fallback;

  // Handle Convex errors (typically have a data property with message)
  if (typeof error === "object" && error !== null) {
    const err = error as Record<string, unknown>;

    // Convex ConvexError with data.message
    if (err.data && typeof err.data === "object") {
      const data = err.data as Record<string, unknown>;
      if (typeof data.message === "string") {
        return data.message;
      }
    }

    // Standard Error with message property
    if (typeof err.message === "string" && err.message) {
      // Clean up common Convex error prefixes
      let message = err.message;

      // Remove "Uncaught ConvexError:" prefix
      if (message.includes("Uncaught ConvexError:")) {
        message = message.replace("Uncaught ConvexError:", "").trim();
      }

      // Remove "Error:" prefix
      if (message.startsWith("Error:")) {
        message = message.replace("Error:", "").trim();
      }

      // Parse JSON error messages from Convex
      try {
        const parsed = JSON.parse(message);
        if (typeof parsed === "string") {
          return parsed;
        }
        if (parsed.message) {
          return parsed.message;
        }
      } catch {
        // Not JSON, use as-is
      }

      return message;
    }
  }

  // Handle string errors
  if (typeof error === "string") {
    return error;
  }

  return fallback;
}

/**
 * Common error messages for specific operations
 */
export const ErrorMessages = {
  team: {
    create: "Failed to create team",
    update: "Failed to update team",
    delete: "Failed to delete team",
    notFound: "Team not found",
    duplicate: "A team with this name already exists",
  },
  player: {
    create: "Failed to add player",
    update: "Failed to update player",
    delete: "Failed to delete player",
    notFound: "Player not found",
    duplicateNumber: "This jersey number is already taken on this team",
  },
  game: {
    create: "Failed to create game",
    update: "Failed to update game",
    delete: "Failed to delete game",
    notFound: "Game not found",
  },
  auth: {
    unauthorized: "You are not authorized to perform this action",
    sessionExpired: "Your session has expired. Please sign in again.",
  },
  network: {
    offline: "You appear to be offline. Please check your connection.",
    timeout: "The request timed out. Please try again.",
  },
};
