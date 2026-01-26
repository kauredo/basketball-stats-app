// App configuration constants

// Web app URL for export redirects
// In production, this should be your deployed web app URL
// For development, use localhost or ngrok tunnel
export const WEB_APP_BASE_URL = __DEV__
  ? "http://localhost:5173" // Vite dev server default port
  : "https://basketball-stats.app"; // Replace with production URL

// Export configuration
export const EXPORT_CONFIG = {
  // Warn users when exporting datasets larger than this
  LARGE_DATASET_THRESHOLD: 50, // games
  // Timeout for export operations (in ms)
  TIMEOUT_MS: 30000,
} as const;
