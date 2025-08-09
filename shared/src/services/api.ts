import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  Team,
  Player,
  Game,
  PlayerStat,
  BoxScore,
  ApiResponse,
  PaginatedResponse,
  StatAction,
  User,
  AuthResponse,
  AuthTokens,
  LoginCredentials,
  SignupCredentials,
  League,
  LeagueMembership,
} from '../types';

export class BasketballStatsAPI {
  private client: AxiosInstance;
  private accessToken: string | null = null;

  constructor(baseURL: string = 'http://localhost:3000/api/v1') {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load saved token
    this.loadStoredToken();

    // Request interceptor for authentication and logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        
        // Add auth token to requests
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // Handle 401 errors (token expired/invalid)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            await this.refreshToken();
            // Retry the original request with new token
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            this.clearAuth();
            throw refreshError;
          }
        }
        
        console.error('API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Token Management
  setAccessToken(token: string) {
    this.accessToken = token;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('basketball_access_token', token);
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  clearAuth() {
    this.accessToken = null;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('basketball_access_token');
      localStorage.removeItem('basketball_refresh_token');
      localStorage.removeItem('basketball_user');
    }
  }

  private loadStoredToken() {
    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('basketball_access_token');
      if (token) {
        this.accessToken = token;
      }
    }
  }

  private async refreshToken(): Promise<void> {
    const refreshToken = typeof localStorage !== 'undefined' 
      ? localStorage.getItem('basketball_refresh_token') 
      : null;
      
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.client.post('/auth/refresh', {
      refresh_token: refreshToken
    });

    const { tokens, user } = response.data;
    this.setAccessToken(tokens.access_token);
    
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('basketball_refresh_token', tokens.refresh_token);
      localStorage.setItem('basketball_user', JSON.stringify(user));
    }
  }

  // Teams API
  async getTeams(page: number = 1): Promise<PaginatedResponse<Team> & { teams: Team[] }> {
    const response: AxiosResponse<PaginatedResponse<Team> & { teams: Team[] }> = 
      await this.client.get(`/teams?page=${page}`);
    return response.data;
  }

  async getTeam(id: number): Promise<{ team: Team }> {
    const response: AxiosResponse<{ team: Team }> = 
      await this.client.get(`/teams/${id}`);
    return response.data;
  }

  async createTeam(team: Partial<Team>): Promise<{ team: Team }> {
    const response: AxiosResponse<{ team: Team }> = 
      await this.client.post('/teams', { team });
    return response.data;
  }

  async updateTeam(id: number, team: Partial<Team>): Promise<{ team: Team }> {
    const response: AxiosResponse<{ team: Team }> = 
      await this.client.put(`/teams/${id}`, { team });
    return response.data;
  }

  async deleteTeam(id: number): Promise<void> {
    await this.client.delete(`/teams/${id}`);
  }

  // Players API
  async getTeamPlayers(teamId: number, page: number = 1): Promise<PaginatedResponse<Player> & { players: Player[] }> {
    const response: AxiosResponse<PaginatedResponse<Player> & { players: Player[] }> = 
      await this.client.get(`/teams/${teamId}/players?page=${page}`);
    return response.data;
  }

  async getPlayer(id: number): Promise<{ player: Player }> {
    const response: AxiosResponse<{ player: Player }> = 
      await this.client.get(`/players/${id}`);
    return response.data;
  }

  async createPlayer(teamId: number, player: Partial<Player>): Promise<{ player: Player }> {
    const response: AxiosResponse<{ player: Player }> = 
      await this.client.post(`/teams/${teamId}/players`, { player });
    return response.data;
  }

  async updatePlayer(id: number, player: Partial<Player>): Promise<{ player: Player }> {
    const response: AxiosResponse<{ player: Player }> = 
      await this.client.put(`/players/${id}`, { player });
    return response.data;
  }

  async deletePlayer(id: number): Promise<void> {
    await this.client.delete(`/players/${id}`);
  }

  // Games API
  async getGames(teamId?: number, page: number = 1): Promise<PaginatedResponse<Game> & { games: Game[] }> {
    const url = teamId ? `/teams/${teamId}/games?page=${page}` : `/games?page=${page}`;
    const response: AxiosResponse<PaginatedResponse<Game> & { games: Game[] }> = 
      await this.client.get(url);
    return response.data;
  }

  async getGame(id: number): Promise<{ game: Game }> {
    const response: AxiosResponse<{ game: Game }> = 
      await this.client.get(`/games/${id}`);
    return response.data;
  }

  async createGame(game: Partial<Game>): Promise<{ game: Game }> {
    const response: AxiosResponse<{ game: Game }> = 
      await this.client.post('/games', { game });
    return response.data;
  }

  async updateGame(id: number, game: Partial<Game>): Promise<{ game: Game }> {
    const response: AxiosResponse<{ game: Game }> = 
      await this.client.put(`/games/${id}`, { game });
    return response.data;
  }

  async deleteGame(id: number): Promise<void> {
    await this.client.delete(`/games/${id}`);
  }

  // Game actions
  async startGame(id: number): Promise<{ game: Game; message: string }> {
    const response: AxiosResponse<{ game: Game; message: string }> = 
      await this.client.post(`/games/${id}/start`);
    return response.data;
  }

  async pauseGame(id: number): Promise<{ game: Game; message: string }> {
    const response: AxiosResponse<{ game: Game; message: string }> = 
      await this.client.post(`/games/${id}/pause`);
    return response.data;
  }

  async resumeGame(id: number): Promise<{ game: Game; message: string }> {
    const response: AxiosResponse<{ game: Game; message: string }> = 
      await this.client.post(`/games/${id}/resume`);
    return response.data;
  }

  async endGame(id: number): Promise<{ game: Game; message: string }> {
    const response: AxiosResponse<{ game: Game; message: string }> = 
      await this.client.post(`/games/${id}/end`);
    return response.data;
  }

  // Stats API
  async getGameStats(gameId: number, page: number = 1): Promise<PaginatedResponse<PlayerStat> & { stats: PlayerStat[] }> {
    const response: AxiosResponse<PaginatedResponse<PlayerStat> & { stats: PlayerStat[] }> = 
      await this.client.get(`/games/${gameId}/stats?page=${page}`);
    return response.data;
  }

  async recordStat(gameId: number, action: StatAction): Promise<{ stat: PlayerStat; game_score: { home_score: number; away_score: number }; message: string }> {
    const response: AxiosResponse<{ stat: PlayerStat; game_score: { home_score: number; away_score: number }; message: string }> = 
      await this.client.post(`/games/${gameId}/stats`, { stat: action });
    return response.data;
  }

  async updateStat(gameId: number, statId: number, stat: Partial<PlayerStat>): Promise<{ stat: PlayerStat; message: string }> {
    const response: AxiosResponse<{ stat: PlayerStat; message: string }> = 
      await this.client.put(`/games/${gameId}/stats/${statId}`, { stat });
    return response.data;
  }

  async deleteStat(gameId: number, statId: number): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = 
      await this.client.delete(`/games/${gameId}/stats/${statId}`);
    return response.data;
  }

  // Box score
  async getBoxScore(gameId: number): Promise<BoxScore> {
    const response: AxiosResponse<BoxScore> = 
      await this.client.get(`/games/${gameId}/box_score`);
    return response.data;
  }

  async getLiveStats(gameId: number): Promise<{ game: Game; stats: PlayerStat[] }> {
    const response: AxiosResponse<{ game: Game; stats: PlayerStat[] }> = 
      await this.client.get(`/games/${gameId}/live_stats`);
    return response.data;
  }

  // Authentication API
  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = 
      await this.client.post('/auth/signup', { user: credentials });
    
    const { tokens, user } = response.data;
    this.setAccessToken(tokens.access_token);
    
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('basketball_refresh_token', tokens.refresh_token);
      localStorage.setItem('basketball_user', JSON.stringify(user));
    }
    
    return response.data;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = 
      await this.client.post('/auth/login', { user: credentials });
    
    const { tokens, user } = response.data;
    this.setAccessToken(tokens.access_token);
    
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('basketball_refresh_token', tokens.refresh_token);
      localStorage.setItem('basketball_user', JSON.stringify(user));
    }
    
    return response.data;
  }

  async logout(): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = 
      await this.client.post('/auth/logout');
    
    this.clearAuth();
    return response.data;
  }

  async getCurrentUser(): Promise<{ user: User }> {
    const response: AxiosResponse<{ user: User }> = 
      await this.client.get('/auth/me');
    return response.data;
  }

  async confirmEmail(token: string): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = 
      await this.client.post('/auth/confirm_email', { token });
    
    const { tokens, user } = response.data;
    this.setAccessToken(tokens.access_token);
    
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('basketball_refresh_token', tokens.refresh_token);
      localStorage.setItem('basketball_user', JSON.stringify(user));
    }
    
    return response.data;
  }

  async resendConfirmation(email: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = 
      await this.client.post('/auth/resend_confirmation', { email });
    return response.data;
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = 
      await this.client.post('/auth/forgot_password', { email });
    return response.data;
  }

  async resetPassword(token: string, password: string, password_confirmation: string): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = 
      await this.client.post('/auth/reset_password', { 
        token, 
        password, 
        password_confirmation 
      });
    
    const { tokens, user } = response.data;
    this.setAccessToken(tokens.access_token);
    
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('basketball_refresh_token', tokens.refresh_token);
      localStorage.setItem('basketball_user', JSON.stringify(user));
    }
    
    return response.data;
  }

  // League API
  async getLeagues(): Promise<{ leagues: League[] }> {
    const response: AxiosResponse<{ leagues: League[] }> = 
      await this.client.get('/leagues');
    return response.data;
  }

  async getLeague(leagueId: number): Promise<{ league: League }> {
    const response: AxiosResponse<{ league: League }> = 
      await this.client.get(`/leagues/${leagueId}`);
    return response.data;
  }

  async createLeague(league: Partial<League>): Promise<{ league: League; message: string }> {
    const response: AxiosResponse<{ league: League; message: string }> = 
      await this.client.post('/leagues', { league });
    return response.data;
  }

  async updateLeague(leagueId: number, league: Partial<League>): Promise<{ league: League; message: string }> {
    const response: AxiosResponse<{ league: League; message: string }> = 
      await this.client.put(`/leagues/${leagueId}`, { league });
    return response.data;
  }

  async deleteLeague(leagueId: number): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = 
      await this.client.delete(`/leagues/${leagueId}`);
    return response.data;
  }

  async joinLeague(leagueId: number, role: string = 'member'): Promise<{ league: League; membership: LeagueMembership; message: string }> {
    const response: AxiosResponse<{ league: League; membership: LeagueMembership; message: string }> = 
      await this.client.post(`/leagues/${leagueId}/join`, { role });
    return response.data;
  }

  async leaveLeague(leagueId: number): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = 
      await this.client.delete(`/leagues/${leagueId}/leave`);
    return response.data;
  }

  async joinLeagueByCode(code: string): Promise<{ league: League; membership: LeagueMembership; message: string }> {
    const response: AxiosResponse<{ league: League; membership: LeagueMembership; message: string }> = 
      await this.client.post('/leagues/join_by_code', { code });
    return response.data;
  }

  async getLeagueMembers(leagueId: number): Promise<{ members: LeagueMembership[] }> {
    const response: AxiosResponse<{ members: LeagueMembership[] }> = 
      await this.client.get(`/leagues/${leagueId}/members`);
    return response.data;
  }

  async getLeagueStandings(leagueId: number): Promise<{ standings: any[] }> {
    const response: AxiosResponse<{ standings: any[] }> = 
      await this.client.get(`/leagues/${leagueId}/standings`);
    return response.data;
  }

  async getLeagueInviteCode(leagueId: number): Promise<{ invite_code: string; invite_url: string }> {
    const response: AxiosResponse<{ invite_code: string; invite_url: string }> = 
      await this.client.get(`/leagues/${leagueId}/invite_code`);
    return response.data;
  }

  // Additional API methods for compatibility
  async getAllPlayers(): Promise<{ players: Player[] }> {
    const response: AxiosResponse<{ players: Player[] }> = await this.client.get('/players');
    return response.data;
  }

  // Statistics API
  async getPlayersStatistics(leagueId: number, params?: {
    season?: string;
    page?: number;
    per_page?: number;
    sort_by?: string;
    order?: string;
  }): Promise<{
    players: any[];
    pagination: {
      current_page: number;
      per_page: number;
      total_pages: number;
      total_count: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params?.season) queryParams.append('season', params.season);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params?.order) queryParams.append('order', params.order);
    
    const response = await this.client.get(
      `/leagues/${leagueId}/statistics/players?${queryParams.toString()}`
    );
    return response.data;
  }

  async getPlayerStatistics(leagueId: number, playerId: number, season?: string): Promise<any> {
    const queryParams = new URLSearchParams();
    if (season) queryParams.append('season', season);
    
    const response = await this.client.get(
      `/leagues/${leagueId}/statistics/players/${playerId}?${queryParams.toString()}`
    );
    return response.data;
  }

  async getTeamsStatistics(leagueId: number, params?: {
    season?: string;
    sort_by?: string;
    order?: string;
  }): Promise<{ teams: any[] }> {
    const queryParams = new URLSearchParams();
    if (params?.season) queryParams.append('season', params.season);
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params?.order) queryParams.append('order', params.order);
    
    const response = await this.client.get(
      `/leagues/${leagueId}/statistics/teams?${queryParams.toString()}`
    );
    return response.data;
  }

  async getTeamStatistics(leagueId: number, teamId: number, season?: string): Promise<any> {
    const queryParams = new URLSearchParams();
    if (season) queryParams.append('season', season);
    
    const response = await this.client.get(
      `/leagues/${leagueId}/statistics/teams/${teamId}?${queryParams.toString()}`
    );
    return response.data;
  }

  async getLeagueLeaders(leagueId: number, params?: {
    season?: string;
    category?: string;
    limit?: number;
  }): Promise<{ category: string; leaders: any }> {
    const queryParams = new URLSearchParams();
    if (params?.season) queryParams.append('season', params.season);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const response = await this.client.get(
      `/leagues/${leagueId}/statistics/leaders?${queryParams.toString()}`
    );
    return response.data;
  }

  async getStatisticsDashboard(leagueId: number, season?: string): Promise<any> {
    const queryParams = new URLSearchParams();
    if (season) queryParams.append('season', season);
    
    const response = await this.client.get(
      `/leagues/${leagueId}/statistics/dashboard?${queryParams.toString()}`
    );
    return response.data;
  }

  // Utility methods
  setBaseURL(baseURL: string): void {
    this.client.defaults.baseURL = baseURL;
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
    if (typeof localStorage !== 'undefined') {
      const userJson = localStorage.getItem('basketball_user');
      if (userJson) {
        return JSON.parse(userJson);
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