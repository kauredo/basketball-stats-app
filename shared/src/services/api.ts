import type {
  Team,
  Player,
  Game,
  PlayerStat,
  BoxScore,
  ApiResponse,
  PaginatedResponse,
  LoginCredentials,
  SignupCredentials,
  AuthResponse,
  AuthTokens,
  User,
  League,
  LeagueMembership,
  StatAction,
} from "../types";

type RequestMethod = "GET" | "POST" | "PUT" | "DELETE";

interface RequestOptions {
  method: RequestMethod;
  headers: Record<string, string>;
  body?: string;
}

export class BasketballStatsAPI {
  private baseURL: string;
  private accessToken: string | null = null;

  // constructor(baseURL: string = "http://localhost:3000/api/v1") {
  constructor(baseURL: string = "http://192.168.1.55:3000/api/v1") {
    this.baseURL = baseURL;
    this.loadStoredToken();
  }

  // API Request Helper Methods
  private async request<T>(
    endpoint: string,
    method: RequestMethod = "GET",
    data?: any
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const options: RequestOptions = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    // Add auth token to requests if available
    if (this.accessToken) {
      options.headers.Authorization = `Bearer ${this.accessToken}`;
    }

    // Add body for non-GET requests
    if (data && method !== "GET") {
      options.body = JSON.stringify(data);
    }

    console.log(`API Request: ${method} ${url}`);

    try {
      // Use query parameters for GET requests with data
      const fullUrl =
        method === "GET" && data
          ? `${url}?${new URLSearchParams(data).toString()}`
          : url;

      const response = await fetch(fullUrl, options);

      // Handle 401 Unauthorized - attempt token refresh
      if (response.status === 401) {
        try {
          await this.refreshToken();

          // Retry request with new token
          options.headers.Authorization = `Bearer ${this.accessToken}`;
          const retryResponse = await fetch(fullUrl, options);

          if (!retryResponse.ok) {
            throw new Error(
              `API error: ${retryResponse.status} ${retryResponse.statusText}`
            );
          }

          return await retryResponse.json();
        } catch (refreshError) {
          // Refresh failed, clear tokens and rethrow
          this.clearAuth();
          throw refreshError;
        }
      }

      // Handle other errors
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API Request Error:", error);
      throw error;
    }
  }

  // Token Management
  setAccessToken(token: string): void {
    this.accessToken = token;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("basketball_access_token", token);
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  clearAuth(): void {
    this.accessToken = null;
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("basketball_access_token");
      localStorage.removeItem("basketball_refresh_token");
      localStorage.removeItem("basketball_user");
    }
  }

  private loadStoredToken(): void {
    if (typeof localStorage !== "undefined") {
      const token = localStorage.getItem("basketball_access_token");
      if (token) {
        this.accessToken = token;
      }
    }
  }

  private async refreshToken(): Promise<void> {
    const refreshToken =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("basketball_refresh_token")
        : null;

    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await this.request<AuthResponse>("/auth/refresh", "POST", {
      refresh_token: refreshToken,
    });

    const { tokens, user } = response;
    this.setAccessToken(tokens.access_token);

    if (typeof localStorage !== "undefined") {
      localStorage.setItem("basketball_refresh_token", tokens.refresh_token);
      localStorage.setItem("basketball_user", JSON.stringify(user));
    }
  }

  // Teams API
  async getTeams(
    page: number = 1
  ): Promise<PaginatedResponse<Team> & { teams: Team[] }> {
    return this.request<PaginatedResponse<Team> & { teams: Team[] }>(
      `/teams?page=${page}`
    );
  }

  async getTeam(id: number): Promise<{ team: Team }> {
    return this.request<{ team: Team }>(`/teams/${id}`);
  }

  async createTeam(team: Partial<Team>): Promise<{ team: Team }> {
    return this.request<{ team: Team }>("/teams", "POST", { team });
  }

  async updateTeam(id: number, team: Partial<Team>): Promise<{ team: Team }> {
    return this.request<{ team: Team }>(`/teams/${id}`, "PUT", { team });
  }

  async deleteTeam(id: number): Promise<void> {
    await this.request<void>(`/teams/${id}`, "DELETE");
  }

  // Players API
  async getTeamPlayers(
    teamId: number,
    page: number = 1
  ): Promise<PaginatedResponse<Player> & { players: Player[] }> {
    return this.request<PaginatedResponse<Player> & { players: Player[] }>(
      `/teams/${teamId}/players?page=${page}`
    );
  }

  async getPlayer(id: number): Promise<{ player: Player }> {
    return this.request<{ player: Player }>(`/players/${id}`);
  }

  async createPlayer(
    teamId: number,
    player: Partial<Player>
  ): Promise<{ player: Player }> {
    return this.request<{ player: Player }>(
      `/teams/${teamId}/players`,
      "POST",
      { player }
    );
  }

  async updatePlayer(
    id: number,
    player: Partial<Player>
  ): Promise<{ player: Player }> {
    return this.request<{ player: Player }>(`/players/${id}`, "PUT", {
      player,
    });
  }

  async deletePlayer(id: number): Promise<void> {
    await this.request<void>(`/players/${id}`, "DELETE");
  }

  // Games API
  async getGames(
    teamId?: number,
    page: number = 1
  ): Promise<PaginatedResponse<Game> & { games: Game[] }> {
    const url = teamId
      ? `/teams/${teamId}/games?page=${page}`
      : `/games?page=${page}`;
    return this.request<PaginatedResponse<Game> & { games: Game[] }>(url);
  }

  async getGame(id: number): Promise<{ game: Game }> {
    return this.request<{ game: Game }>(`/games/${id}`);
  }

  async createGame(game: Partial<Game>): Promise<{ game: Game }> {
    return this.request<{ game: Game }>("/games", "POST", { game });
  }

  async updateGame(id: number, game: Partial<Game>): Promise<{ game: Game }> {
    return this.request<{ game: Game }>(`/games/${id}`, "PUT", { game });
  }

  async deleteGame(id: number): Promise<void> {
    await this.request<void>(`/games/${id}`, "DELETE");
  }

  // Game actions
  async startGame(id: number): Promise<{ game: Game; message: string }> {
    return this.request<{ game: Game; message: string }>(
      `/games/${id}/start`,
      "POST"
    );
  }

  async pauseGame(id: number): Promise<{ game: Game; message: string }> {
    return this.request<{ game: Game; message: string }>(
      `/games/${id}/pause`,
      "POST"
    );
  }

  async resumeGame(id: number): Promise<{ game: Game; message: string }> {
    return this.request<{ game: Game; message: string }>(
      `/games/${id}/resume`,
      "POST"
    );
  }

  async endGame(id: number): Promise<{ game: Game; message: string }> {
    return this.request<{ game: Game; message: string }>(
      `/games/${id}/end`,
      "POST"
    );
  }

  // Stats API
  async getGameStats(
    gameId: number,
    page: number = 1
  ): Promise<PaginatedResponse<PlayerStat> & { stats: PlayerStat[] }> {
    return this.request<
      PaginatedResponse<PlayerStat> & { stats: PlayerStat[] }
    >(`/games/${gameId}/stats?page=${page}`);
  }

  async recordStat(
    gameId: number,
    action: StatAction
  ): Promise<{
    stat: PlayerStat;
    game_score: { home_score: number; away_score: number };
    message: string;
  }> {
    return this.request<{
      stat: PlayerStat;
      game_score: { home_score: number; away_score: number };
      message: string;
    }>(`/games/${gameId}/stats`, "POST", { stat: action });
  }

  async updateStat(
    gameId: number,
    statId: number,
    stat: Partial<PlayerStat>
  ): Promise<{ stat: PlayerStat; message: string }> {
    return this.request<{ stat: PlayerStat; message: string }>(
      `/games/${gameId}/stats/${statId}`,
      "PUT",
      { stat }
    );
  }

  async deleteStat(
    gameId: number,
    statId: number
  ): Promise<{ message: string }> {
    return this.request<{ message: string }>(
      `/games/${gameId}/stats/${statId}`,
      "DELETE"
    );
  }

  // Box score
  async getBoxScore(gameId: number): Promise<BoxScore> {
    return this.request<BoxScore>(`/games/${gameId}/box_score`);
  }

  async getLiveStats(
    gameId: number
  ): Promise<{ game: Game; stats: PlayerStat[] }> {
    return this.request<{ game: Game; stats: PlayerStat[] }>(
      `/games/${gameId}/live_stats`
    );
  }

  // Authentication API
  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>("/auth/signup", "POST", {
      user: credentials,
    });

    const { tokens, user } = response;
    this.setAccessToken(tokens.access_token);

    if (typeof localStorage !== "undefined") {
      localStorage.setItem("basketball_refresh_token", tokens.refresh_token);
      localStorage.setItem("basketball_user", JSON.stringify(user));
    }

    return response;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>("/auth/login", "POST", {
      user: credentials,
    });

    const { tokens, user } = response;
    this.setAccessToken(tokens.access_token);

    if (typeof localStorage !== "undefined") {
      localStorage.setItem("basketball_refresh_token", tokens.refresh_token);
      localStorage.setItem("basketball_user", JSON.stringify(user));
    }

    return response;
  }

  async logout(): Promise<{ message: string }> {
    const response = await this.request<{ message: string }>(
      "/auth/logout",
      "POST"
    );

    this.clearAuth();
    return response;
  }

  async getCurrentUser(): Promise<{ user: User }> {
    return this.request<{ user: User }>("/auth/me");
  }

  async confirmEmail(token: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>(
      "/auth/confirm_email",
      "POST",
      { token }
    );

    const { tokens, user } = response;
    this.setAccessToken(tokens.access_token);

    if (typeof localStorage !== "undefined") {
      localStorage.setItem("basketball_refresh_token", tokens.refresh_token);
      localStorage.setItem("basketball_user", JSON.stringify(user));
    }

    return response;
  }

  async resendConfirmation(email: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(
      "/auth/resend_confirmation",
      "POST",
      { email }
    );
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    return this.request<{ message: string }>("/auth/forgot_password", "POST", {
      email,
    });
  }

  async resetPassword(
    token: string,
    password: string,
    password_confirmation: string
  ): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>(
      "/auth/reset_password",
      "POST",
      {
        token,
        password,
        password_confirmation,
      }
    );

    const { tokens, user } = response;
    this.setAccessToken(tokens.access_token);

    if (typeof localStorage !== "undefined") {
      localStorage.setItem("basketball_refresh_token", tokens.refresh_token);
      localStorage.setItem("basketball_user", JSON.stringify(user));
    }

    return response;
  }

  // League API
  async getLeagues(): Promise<{ leagues: League[] }> {
    return this.request<{ leagues: League[] }>("/leagues");
  }

  async getLeague(leagueId: number): Promise<{ league: League }> {
    return this.request<{ league: League }>(`/leagues/${leagueId}`);
  }

  async createLeague(
    league: Partial<League>
  ): Promise<{ league: League; message: string }> {
    return this.request<{ league: League; message: string }>(
      "/leagues",
      "POST",
      { league }
    );
  }

  async updateLeague(
    leagueId: number,
    league: Partial<League>
  ): Promise<{ league: League; message: string }> {
    return this.request<{ league: League; message: string }>(
      `/leagues/${leagueId}`,
      "PUT",
      { league }
    );
  }

  async deleteLeague(leagueId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/leagues/${leagueId}`, "DELETE");
  }

  async joinLeague(
    leagueId: number,
    role: string = "member"
  ): Promise<{
    league: League;
    membership: LeagueMembership;
    message: string;
  }> {
    return this.request<{
      league: League;
      membership: LeagueMembership;
      message: string;
    }>(`/leagues/${leagueId}/join`, "POST", { role });
  }

  async leaveLeague(leagueId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(
      `/leagues/${leagueId}/leave`,
      "DELETE"
    );
  }

  async joinLeagueByCode(code: string): Promise<{
    league: League;
    membership: LeagueMembership;
    message: string;
  }> {
    return this.request<{
      league: League;
      membership: LeagueMembership;
      message: string;
    }>("/leagues/join_by_code", "POST", { code });
  }

  async getLeagueMembers(
    leagueId: number
  ): Promise<{ members: LeagueMembership[] }> {
    return this.request<{ members: LeagueMembership[] }>(
      `/leagues/${leagueId}/members`
    );
  }

  async getLeagueStandings(leagueId: number): Promise<{ standings: any[] }> {
    return this.request<{ standings: any[] }>(`/leagues/${leagueId}/standings`);
  }

  async getLeagueInviteCode(
    leagueId: number
  ): Promise<{ invite_code: string; invite_url: string }> {
    return this.request<{ invite_code: string; invite_url: string }>(
      `/leagues/${leagueId}/invite_code`
    );
  }

  // Additional API methods for compatibility
  async getAllPlayers(): Promise<{ players: Player[] }> {
    return this.request<{ players: Player[] }>("/players");
  }

  // Statistics API
  async getPlayersStatistics(
    leagueId: number,
    params?: {
      season?: string;
      page?: number;
      per_page?: number;
      sort_by?: string;
      order?: string;
    }
  ): Promise<{
    players: any[];
    pagination: {
      current_page: number;
      per_page: number;
      total_pages: number;
      total_count: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params?.season) queryParams.append("season", params.season);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.per_page)
      queryParams.append("per_page", params.per_page.toString());
    if (params?.sort_by) queryParams.append("sort_by", params.sort_by);
    if (params?.order) queryParams.append("order", params.order);

    return this.request<{
      players: any[];
      pagination: {
        current_page: number;
        per_page: number;
        total_pages: number;
        total_count: number;
      };
    }>(`/leagues/${leagueId}/statistics/players?${queryParams.toString()}`);
  }

  async getPlayerStatistics(
    leagueId: number,
    playerId: number,
    season?: string
  ): Promise<any> {
    const queryParams = new URLSearchParams();
    if (season) queryParams.append("season", season);

    return this.request<any>(
      `/leagues/${leagueId}/statistics/players/${playerId}?${queryParams.toString()}`
    );
  }

  async getTeamsStatistics(
    leagueId: number,
    params?: {
      season?: string;
      sort_by?: string;
      order?: string;
    }
  ): Promise<{ teams: any[] }> {
    const queryParams = new URLSearchParams();
    if (params?.season) queryParams.append("season", params.season);
    if (params?.sort_by) queryParams.append("sort_by", params.sort_by);
    if (params?.order) queryParams.append("order", params.order);

    return this.request<{ teams: any[] }>(
      `/leagues/${leagueId}/statistics/teams?${queryParams.toString()}`
    );
  }

  async getTeamStatistics(
    leagueId: number,
    teamId: number,
    season?: string
  ): Promise<any> {
    const queryParams = new URLSearchParams();
    if (season) queryParams.append("season", season);

    return this.request<any>(
      `/leagues/${leagueId}/statistics/teams/${teamId}?${queryParams.toString()}`
    );
  }

  async getLeagueLeaders(
    leagueId: number,
    params?: {
      season?: string;
      category?: string;
      limit?: number;
    }
  ): Promise<{ category: string; leaders: any }> {
    const queryParams = new URLSearchParams();
    if (params?.season) queryParams.append("season", params.season);
    if (params?.category) queryParams.append("category", params.category);
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    return this.request<{ category: string; leaders: any }>(
      `/leagues/${leagueId}/statistics/leaders?${queryParams.toString()}`
    );
  }

  async getStatisticsDashboard(
    leagueId: number,
    season?: string
  ): Promise<any> {
    const queryParams = new URLSearchParams();
    if (season) queryParams.append("season", season);

    return this.request<any>(
      `/leagues/${leagueId}/statistics/dashboard?${queryParams.toString()}`
    );
  }

  // Utility methods
  setBaseURL(baseURL: string): void {
    this.baseURL = baseURL;
  }

  // Legacy method for backward compatibility
  setAuthToken(token: string): void {
    this.setAccessToken(token);
  }

  // Legacy method for backward compatibility
  clearAuthToken(): void {
    this.clearAuth();
  }

  // Get current user from localStorage (for offline access)
  getCurrentUserFromStorage(): User | null {
    if (typeof localStorage !== "undefined") {
      try {
        const userJson = localStorage.getItem("basketball_user");
        if (userJson) {
          return JSON.parse(userJson);
        }
      } catch (error) {
        console.error("Error parsing user from storage:", error);
      }
    }
    return null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }
}

// Export singleton instance
export const basketballAPI = new BasketballStatsAPI();
