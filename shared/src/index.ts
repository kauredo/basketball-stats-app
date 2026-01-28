// Types - all shared type definitions
export * from "./types";

// UI Components - shared component utilities
export * from "./components";

// Utils - basketball calculations and helpers
export { BasketballUtils } from "./utils/basketball";
export type { StatInput } from "./utils/basketball";

// Utils - CSV generation
export { toCSV } from "./utils/csv";
export type { CSVColumn } from "./utils/csv";

// Utils - Team colors
export {
  DEFAULT_TEAM_COLORS,
  TEAM_COLOR_PALETTE,
  resolveTeamColor,
  resolveTeamColors,
  isLightColor,
  getContrastingTextColor,
} from "./utils/teamColors";
export type { TeamColorPalette } from "./utils/teamColors";

// Utils - YouTube
export {
  extractYouTubeId,
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
  isValidYouTubeUrl,
} from "./utils/youtube";

// Constants - basketball-related constants
export * from "./constants/basketball";
export { default as CONSTANTS } from "./constants/basketball";

// Theme - unified design system constants
export * from "./constants/theme";
export { default as THEME } from "./constants/theme";

// Social platforms
export {
  SOCIAL_PLATFORMS,
  getSocialPlatform,
  isValidSocialUrl,
  countSocialLinks,
} from "./constants/social";
export type { SocialPlatformKey, SocialLinks } from "./constants/social";

// Re-export commonly used types for convenience
export type {
  // Auth
  User,
  AuthTokens,
  AuthResponse,
  LoginCredentials,
  SignupCredentials,
  UserRole,
  // League
  League,
  LeagueMembership,
  LeagueType,
  LeagueStatus,
  LeagueRole,
  MembershipStatus,
  // Team
  Team,
  TeamSummary,
  // Player
  Player,
  PlayerAverages,
  // Game
  Game,
  GameSummary,
  GameStatus,
  // Stats
  PlayerStat,
  BoxScore,
  PlayerSeasonStats,
  TeamSeasonStats,
  PlayerGameLog,
  // Shot Chart
  Shot,
  ShotType,
  ShotZone,
  // Notifications
  Notification,
  NotificationType,
  NotificationData,
  NotificationPreferences,
  // Game Settings & Live Stats
  GameSettings,
  FoulsByQuarter,
  LiveTeamStats,
  // Error utilities
  AppError,
  // Convex return types
  LivePlayerStat,
  LiveStatsResponse,
  StatsPlayerData,
  StatsTeamData,
  PlayerStatsResponse,
  TeamStatsResponse,
  GameListItem,
  GameAnalysisPlayerStat,
  GameEvent,
  ExportShot,
  PlayerGameLogEntry,
  TeamListItem,
  PlayerListItem,
  LineupStatsItem,
  PairStatsItem,
  LeagueMembershipItem,
  NotificationItem,
  // Team Membership
  TeamMembership,
  TeamMembershipRole,
  TeamMembershipStatus,
  // Misc
  Position,
  StatType,
  StatAction,
  ApiResponse,
  PaginatedResponse,
  GameTimerState,
  ConnectionStatus,
  // Export System
  ExportFormat,
  ExportType,
  ExportOptions,
  ExportStatus,
  ExportProgress,
  PDFSettings,
  GameExportData,
  TeamExportData,
  PlayerExportData,
  TeamTotalsData,
  ShotExportData,
  EventExportData,
  ExportShotLocation,
  ExportURLParams,
  // New export types
  PlayerGameLogExportRow,
  RosterExportRow,
  GameResultExportRow,
  LineupExportRow,
  PairExportRow,
  SeasonSummaryData,
} from "./types";

// Export system utilities
export { DEFAULT_PDF_SETTINGS, buildExportURL, parseExportURL } from "./types/export";

// Error utilities
export { getErrorMessage, isErrorWithMessage, isAppError } from "./types/errors";
