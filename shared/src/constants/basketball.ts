// Basketball game constants
export const BASKETBALL_CONSTANTS = {
  // Game timing
  QUARTER_TIME_MINUTES: 12,
  QUARTER_TIME_SECONDS: 720,
  TOTAL_QUARTERS: 4,
  OVERTIME_MINUTES: 5,
  OVERTIME_SECONDS: 300,

  // Shot clock
  SHOT_CLOCK_SECONDS: 24,
  OFFENSIVE_REBOUND_SHOT_CLOCK: 14,

  // Fouls
  TEAM_FOUL_LIMIT: 4,
  PLAYER_FOUL_LIMIT: 6,
  TECHNICAL_FOUL_LIMIT: 2,

  // Scoring
  FREE_THROW_POINTS: 1,
  TWO_POINT_SHOT: 2,
  THREE_POINT_SHOT: 3,

  // Court dimensions (in feet)
  COURT_LENGTH: 94,
  COURT_WIDTH: 50,
  THREE_POINT_LINE_DISTANCE: 23.75,
  FREE_THROW_LINE_DISTANCE: 15,

  // Team size
  MAX_PLAYERS_ON_COURT: 5,
  ROSTER_SIZE_LIMIT: 15,
} as const;

// Position definitions
export const POSITIONS = {
  PG: {
    code: "PG",
    name: "Point Guard",
    description: "Primary ball handler and playmaker",
  },
  SG: {
    code: "SG",
    name: "Shooting Guard",
    description: "Primary perimeter scorer",
  },
  SF: {
    code: "SF",
    name: "Small Forward",
    description: "Versatile wing player",
  },
  PF: {
    code: "PF",
    name: "Power Forward",
    description: "Interior scorer and rebounder",
  },
  C: {
    code: "C",
    name: "Center",
    description: "Primary interior presence",
  },
} as const;

// Stat types for recording
export const STAT_TYPES = {
  SHOT_2PT: {
    code: "shot2",
    name: "2-Point Shot",
    description: "Two-point field goal attempt",
    requiresMade: true,
    points: 2,
  },
  SHOT_3PT: {
    code: "shot3",
    name: "3-Point Shot",
    description: "Three-point field goal attempt",
    requiresMade: true,
    points: 3,
  },
  FREE_THROW: {
    code: "freethrow",
    name: "Free Throw",
    description: "Free throw attempt",
    requiresMade: true,
    points: 1,
  },
  REBOUND: {
    code: "rebounds",
    name: "Rebound",
    description: "Defensive or offensive rebound",
    requiresMade: false,
  },
  ASSIST: {
    code: "assists",
    name: "Assist",
    description: "Pass leading to a score",
    requiresMade: false,
  },
  STEAL: {
    code: "steals",
    name: "Steal",
    description: "Defensive steal",
    requiresMade: false,
  },
  BLOCK: {
    code: "blocks",
    name: "Block",
    description: "Blocked shot",
    requiresMade: false,
  },
  TURNOVER: {
    code: "turnovers",
    name: "Turnover",
    description: "Loss of possession",
    requiresMade: false,
  },
  FOUL: {
    code: "fouls",
    name: "Personal Foul",
    description: "Personal foul committed",
    requiresMade: false,
  },
} as const;

// Game status definitions
export const GAME_STATUSES = {
  SCHEDULED: {
    code: "scheduled",
    name: "Scheduled",
    color: "#6B7280", // gray
    canEdit: true,
    canStart: true,
  },
  ACTIVE: {
    code: "active",
    name: "Live",
    color: "#EF4444", // red (live indicator)
    canEdit: true,
    canPause: true,
    canEnd: true,
  },
  PAUSED: {
    code: "paused",
    name: "Paused",
    color: "#F59E0B", // amber
    canEdit: true,
    canResume: true,
    canEnd: true,
  },
  COMPLETED: {
    code: "completed",
    name: "Final",
    color: "#10B981", // emerald
    canEdit: false,
  },
} as const;

// API configuration
export const API_CONFIG = {
  // BASE_URL: "http://localhost:3000/api/v1",
  BASE_URL: "http://192.168.1.55:3000/api/v1",
  // WEBSOCKET_URL: "ws://localhost:3000",
  WEBSOCKET_URL: "ws://192.168.1.55:3000",
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// WebSocket event types
export const WEBSOCKET_EVENTS = {
  // Connection events
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  CONNECT_ERROR: "connect_error",

  // Game events
  GAME_UPDATE: "game_update",
  GAME_CONNECTED: "game_connected",
  TIMER_UPDATE: "timer_update",
  QUARTER_END: "quarter_end",

  // Stats events
  STAT_UPDATE: "stat_update",
  STATS_CONNECTED: "stats_connected",
  STATS_STATE: "stats_state",

  // General events
  PING: "ping",
  PONG: "pong",
  ERROR: "error",
} as const;

// UI Constants
export const UI_CONSTANTS = {
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Colors (Tailwind CSS classes)
  COLORS: {
    PRIMARY: "bg-blue-600",
    SECONDARY: "bg-gray-600",
    SUCCESS: "bg-green-600",
    WARNING: "bg-yellow-600",
    DANGER: "bg-red-600",
    INFO: "bg-blue-500",
  },

  // Breakpoints (px)
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    "2XL": 1536,
  },

  // Animation durations (ms)
  ANIMATIONS: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
} as const;

// Validation constants
export const VALIDATION = {
  PLAYER: {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 50,
    NUMBER_MIN: 0,
    NUMBER_MAX: 99,
    HEIGHT_MIN_CM: 150,
    HEIGHT_MAX_CM: 250,
    WEIGHT_MIN_KG: 50,
    WEIGHT_MAX_KG: 200,
  },

  TEAM: {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 50,
    CITY_MAX_LENGTH: 50,
    DESCRIPTION_MAX_LENGTH: 500,
  },

  GAME: {
    TIME_MIN: 0,
    TIME_MAX: 720, // 12 minutes in seconds
    QUARTER_MIN: 1,
    QUARTER_MAX: 4,
    SCORE_MIN: 0,
    SCORE_MAX: 999,
  },
} as const;

// Export all constants
export default {
  BASKETBALL_CONSTANTS,
  POSITIONS,
  STAT_TYPES,
  GAME_STATUSES,
  API_CONFIG,
  WEBSOCKET_EVENTS,
  UI_CONSTANTS,
  VALIDATION,
};
