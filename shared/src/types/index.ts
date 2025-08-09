// Basketball domain types based on our Rails API

// Authentication & User types
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  confirmed: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
  message: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  password_confirmation: string;
  first_name: string;
  last_name: string;
}

export interface League {
  id: number;
  name: string;
  description?: string;
  league_type: LeagueType;
  season: string;
  status: LeagueStatus;
  is_public: boolean;
  owner: {
    id: number;
    name: string;
    email: string;
  };
  teams_count?: number;
  members_count?: number;
  games_count?: number;
  membership?: LeagueMembership;
  created_at: string;
  updated_at: string;
}

export interface LeagueMembership {
  id: number;
  role: LeagueRole;
  display_role: string;
  status: MembershipStatus;
  joined_at?: string;
  can_manage_teams: boolean;
  can_record_stats: boolean;
  can_view_analytics: boolean;
  can_manage_league: boolean;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface Team {
  id: number;
  name: string;
  city: string;
  logo_url?: string;
  description?: string;
  active_players_count: number;
  created_at: string;
  updated_at: string;
  players?: Player[];
}

export interface Player {
  id: number;
  name: string;
  number: number;
  position?: Position;
  height_cm?: number;
  weight_kg?: number;
  birth_date?: string;
  age?: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
  team?: {
    id: number;
    name: string;
    city: string;
  };
  season_averages?: PlayerAverages;
  games_played?: number;
}

export interface Game {
  id: number;
  scheduled_at?: string;
  started_at?: string;
  ended_at?: string;
  status: GameStatus;
  current_quarter: number;
  time_remaining_seconds: number;
  time_display: string;
  home_score: number;
  away_score: number;
  duration_minutes: number;
  game_settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
  home_team: TeamSummary;
  away_team: TeamSummary;
  player_stats?: PlayerStat[];
}

export interface PlayerStat {
  id: number;
  points: number;
  field_goals_made: number;
  field_goals_attempted: number;
  field_goal_percentage: number;
  three_pointers_made: number;
  three_pointers_attempted: number;
  three_point_percentage: number;
  free_throws_made: number;
  free_throws_attempted: number;
  free_throw_percentage: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  minutes_played: number;
  plus_minus: number;
  effective_field_goal_percentage: number;
  true_shooting_percentage: number;
  created_at: string;
  updated_at: string;
  player: {
    id: number;
    name: string;
    number: number;
    position?: Position;
    team?: {
      id: number;
      name: string;
    };
  };
  game?: {
    id: number;
    status: GameStatus;
    current_quarter: number;
    time_display: string;
  };
}

export interface BoxScore {
  game: Game;
  box_score: {
    home_team: {
      team: TeamSummary;
      score: number;
      players: PlayerStat[];
    };
    away_team: {
      team: TeamSummary;
      score: number;
      players: PlayerStat[];
    };
  };
}

// Utility types
export interface TeamSummary {
  id: number;
  name: string;
  city: string;
  logo_url?: string;
}

export interface PlayerAverages {
  games_played: number;
  points: number;
  rebounds: number;
  assists: number;
  field_goal_percentage: number;
}

// Statistics Dashboard Types
export interface PlayerSeasonStats {
  player_id: number;
  player_name: string;
  team: string;
  position?: Position;
  games_played: number;
  
  // Totals
  total_points: number;
  total_field_goals_made: number;
  total_field_goals_attempted: number;
  total_three_pointers_made: number;
  total_three_pointers_attempted: number;
  total_free_throws_made: number;
  total_free_throws_attempted: number;
  total_rebounds: number;
  total_assists: number;
  total_steals: number;
  total_blocks: number;
  total_turnovers: number;
  total_fouls: number;
  total_minutes: number;
  
  // Averages
  avg_points: number;
  avg_field_goals_made: number;
  avg_field_goals_attempted: number;
  avg_three_pointers_made: number;
  avg_three_pointers_attempted: number;
  avg_free_throws_made: number;
  avg_free_throws_attempted: number;
  avg_rebounds: number;
  avg_assists: number;
  avg_steals: number;
  avg_blocks: number;
  avg_turnovers: number;
  avg_fouls: number;
  avg_minutes: number;
  
  // Percentages
  field_goal_percentage: number;
  three_point_percentage: number;
  free_throw_percentage: number;
  effective_field_goal_percentage: number;
  true_shooting_percentage: number;
  
  // Advanced Stats
  player_efficiency_rating: number;
  usage_rate: number;
  assist_to_turnover_ratio: number;
}

export interface TeamSeasonStats {
  team_id: number;
  team_name: string;
  games_played: number;
  wins: number;
  losses: number;
  win_percentage: number;
  
  // Team totals and averages
  total_points: number;
  avg_points: number;
  total_rebounds: number;
  avg_rebounds: number;
  total_assists: number;
  avg_assists: number;
  field_goal_percentage: number;
  three_point_percentage: number;
  free_throw_percentage: number;
}

export interface PlayerGameLog {
  game_id: number;
  game_date: string;
  opponent: string;
  home_game: boolean;
  result: 'W' | 'L' | 'N/A';
  minutes: number;
  points: number;
  rebounds: number;
  assists: number;
  field_goals: string; // "made/attempted" format
  field_goal_percentage: number;
  three_pointers: string;
  three_point_percentage: number;
  free_throws: string;
  free_throw_percentage: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  plus_minus: number;
}

export interface LeagueLeaders {
  [playerName: string]: number;
}

export interface StatisticsResponse {
  players?: PlayerSeasonStats[];
  teams?: TeamSeasonStats[];
  leaders?: {
    scoring: LeagueLeaders;
    rebounding: LeagueLeaders;
    assists: LeagueLeaders;
    shooting: LeagueLeaders;
  };
  standings?: TeamSeasonStats[];
  recent_games?: GameSummary[];
  league_info?: {
    total_games: number;
    total_teams: number;
    total_players: number;
  };
  pagination?: {
    current_page: number;
    per_page: number;
    total_pages: number;
    total_count: number;
  };
}

export interface PlayerDetailedStats {
  player: {
    id: number;
    name: string;
    team: string;
    position?: Position;
    number: number;
  };
  season_stats: PlayerSeasonStats;
  recent_games: PlayerGameLog[];
}

export interface TeamDetailedStats {
  team: {
    id: number;
    name: string;
    city: string;
  };
  season_stats: TeamSeasonStats;
  top_scorers: Array<{
    player_id: number;
    player_name: string;
    avg_points: number;
  }>;
  top_rebounders: Array<{
    player_id: number;
    player_name: string;
    avg_rebounds: number;
  }>;
}

export interface GameSummary {
  id: number;
  date: string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  total_points: number;
}

export interface DashboardData {
  leaders: {
    scoring: LeagueLeaders;
    rebounding: LeagueLeaders;
    assists: LeagueLeaders;
    shooting: LeagueLeaders;
  };
  standings: TeamSeasonStats[];
  recent_games: GameSummary[];
  league_info: {
    total_games: number;
    total_teams: number;
    total_players: number;
  };
}

// Enums
export type UserRole = 'admin' | 'user';

export type LeagueType = 'professional' | 'college' | 'high_school' | 'youth' | 'recreational';

export type LeagueStatus = 'draft' | 'active' | 'completed' | 'archived';

export type LeagueRole = 'admin' | 'coach' | 'scorekeeper' | 'member' | 'viewer';

export type MembershipStatus = 'pending' | 'active' | 'suspended' | 'removed';

export type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C' | 'Point Guard' | 'Shooting Guard' | 'Small Forward' | 'Power Forward' | 'Center' | 'Guard' | 'Forward';

export type GameStatus = 'scheduled' | 'active' | 'paused' | 'completed';

export type StatType = 
  | 'shot2' 
  | 'shot3' 
  | 'freethrow' 
  | 'rebounds' 
  | 'assists' 
  | 'steals' 
  | 'blocks' 
  | 'turnovers' 
  | 'fouls';

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

// WebSocket message types
export interface WebSocketMessage {
  type: string;
  message?: string;
  game?: Game;
  stats?: PlayerStat[];
  stat?: PlayerStat;
  player_id?: number;
  game_score?: {
    home_score: number;
    away_score: number;
  };
  time_remaining_seconds?: number;
  current_quarter?: number;
  time_display?: string;
  timestamp?: string;
}

// Action types for stat recording
export interface StatAction {
  player_id: number;
  stat_type: StatType;
  made?: boolean;
  value?: number;
}

// UI State types
export interface GameTimerState {
  isRunning: boolean;
  timeRemaining: number;
  quarter: number;
  timeDisplay: string;
}

export interface UIState {
  selectedPlayer?: Player;
  selectedAction?: StatType;
  isRecording: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
}