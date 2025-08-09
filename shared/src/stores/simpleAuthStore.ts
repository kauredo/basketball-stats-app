import { basketballAPI } from '../services/api';
import type {
  User,
  AuthTokens,
  LoginCredentials,
  SignupCredentials,
  League,
} from '../types';

// State interface
export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  userLeagues: League[];
  selectedLeague: League | null;
}

// Event system for state changes
type AuthListener = (state: AuthState) => void;
let listeners: AuthListener[] = [];

// Initial state
let authState: AuthState = {
  user: null,
  tokens: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
  userLeagues: [],
  selectedLeague: null,
};

// Helper to update state and notify listeners
const updateState = (updates: Partial<AuthState>) => {
  authState = { ...authState, ...updates };
  listeners.forEach(listener => listener(authState));
};

// Subscribe to state changes
export const subscribeToAuth = (listener: AuthListener) => {
  listeners.push(listener);
  // Return unsubscribe function
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
};

// Get current state
export const getAuthState = () => authState;

// Actions
export const authActions = {
  login: async (credentials: LoginCredentials) => {
    try {
      updateState({ isLoading: true, error: null });
      
      const response = await basketballAPI.login(credentials);
      
      updateState({
        user: response.user,
        tokens: response.tokens,
        isAuthenticated: true,
        isLoading: false,
      });
      
      await authActions.loadUserLeagues();
    } catch (error: any) {
      updateState({
        error: error.response?.data?.error || 'Login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  signup: async (credentials: SignupCredentials) => {
    try {
      updateState({ isLoading: true, error: null });
      
      const response = await basketballAPI.signup(credentials);
      
      updateState({
        user: response.user,
        tokens: response.tokens,
        isAuthenticated: true,
        isLoading: false,
      });
      
      await authActions.loadUserLeagues();
    } catch (error: any) {
      updateState({
        error: error.response?.data?.error || 'Signup failed',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      updateState({ isLoading: true });
      
      await basketballAPI.logout();
      
      updateState({
        user: null,
        tokens: null,
        isAuthenticated: false,
        userLeagues: [],
        selectedLeague: null,
        isLoading: false,
      });
    } catch (error) {
      updateState({
        user: null,
        tokens: null,
        isAuthenticated: false,
        userLeagues: [],
        selectedLeague: null,
        isLoading: false,
      });
    }
  },

  clearError: () => updateState({ error: null }),

  loadProfile: async () => {
    try {
      updateState({ isLoading: true, error: null });
      
      const response = await basketballAPI.getCurrentUser();
      
      updateState({
        user: response.user,
        isLoading: false,
      });
    } catch (error: any) {
      updateState({
        error: error.response?.data?.error || 'Failed to load profile',
        isLoading: false,
      });
      throw error;
    }
  },

  updateProfile: async (updates: Partial<User>) => {
    try {
      updateState({ isLoading: true, error: null });
      
      updateState({
        user: { ...authState.user as User, ...updates },
        isLoading: false,
      });
    } catch (error: any) {
      updateState({
        error: error.response?.data?.error || 'Failed to update profile',
        isLoading: false,
      });
      throw error;
    }
  },

  loadUserLeagues: async () => {
    try {
      updateState({ isLoading: true, error: null });
      
      const response = await basketballAPI.getLeagues();
      
      updateState({
        userLeagues: response.leagues,
        isLoading: false,
      });
      
      if (!authState.selectedLeague && response.leagues.length > 0) {
        updateState({ selectedLeague: response.leagues[0] });
      }
    } catch (error: any) {
      updateState({
        error: error.response?.data?.error || 'Failed to load leagues',
        isLoading: false,
      });
      throw error;
    }
  },

  selectLeague: (league: League | null) => {
    updateState({ selectedLeague: league });
  },

  joinLeague: async (leagueId: number, role: string = "member") => {
    try {
      updateState({ isLoading: true, error: null });
      
      await basketballAPI.joinLeague(leagueId, role);
      await authActions.loadUserLeagues();
      
      updateState({ isLoading: false });
    } catch (error: any) {
      updateState({
        error: error.response?.data?.error || 'Failed to join league',
        isLoading: false,
      });
      throw error;
    }
  },

  leaveLeague: async (leagueId: number) => {
    try {
      updateState({ isLoading: true, error: null });
      
      await basketballAPI.leaveLeague(leagueId);
      
      const userLeagues = authState.userLeagues.filter(l => l.id !== leagueId);
      let selectedLeague = authState.selectedLeague;
      
      if (selectedLeague && selectedLeague.id === leagueId) {
        selectedLeague = userLeagues.length > 0 ? userLeagues[0] : null;
      }
      
      updateState({ 
        userLeagues,
        selectedLeague,
        isLoading: false,
      });
    } catch (error: any) {
      updateState({
        error: error.response?.data?.error || 'Failed to leave league',
        isLoading: false,
      });
      throw error;
    }
  },

  joinLeagueByCode: async (code: string) => {
    try {
      updateState({ isLoading: true, error: null });
      
      await basketballAPI.joinLeagueByCode(code);
      await authActions.loadUserLeagues();
      
      updateState({ isLoading: false });
    } catch (error: any) {
      updateState({
        error: error.response?.data?.error || 'Failed to join league',
        isLoading: false,
      });
      throw error;
    }
  },

  confirmEmail: async (token: string) => {
    try {
      updateState({ isLoading: true, error: null });
      
      const response = await basketballAPI.confirmEmail(token);
      
      updateState({
        user: response.user,
        tokens: response.tokens,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      updateState({
        error: error.response?.data?.error || 'Email confirmation failed',
        isLoading: false,
      });
      throw error;
    }
  },

  resendConfirmation: async (email: string) => {
    try {
      updateState({ isLoading: true, error: null });
      await basketballAPI.resendConfirmation(email);
      updateState({ isLoading: false });
    } catch (error: any) {
      updateState({
        error: error.response?.data?.error || 'Failed to resend confirmation',
        isLoading: false,
      });
      throw error;
    }
  },

  forgotPassword: async (email: string) => {
    try {
      updateState({ isLoading: true, error: null });
      await basketballAPI.forgotPassword(email);
      updateState({ isLoading: false });
    } catch (error: any) {
      updateState({
        error: error.response?.data?.error || 'Password reset request failed',
        isLoading: false,
      });
      throw error;
    }
  },

  resetPassword: async (token: string, password: string, passwordConfirmation: string) => {
    try {
      updateState({ isLoading: true, error: null });
      
      const response = await basketballAPI.resetPassword(token, password, passwordConfirmation);
      
      updateState({
        user: response.user,
        tokens: response.tokens,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      updateState({
        error: error.response?.data?.error || 'Password reset failed',
        isLoading: false,
      });
      throw error;
    }
  },

  initialize: async () => {
    try {
      updateState({ isLoading: true });
      
      if (basketballAPI.isAuthenticated()) {
        try {
          const response = await basketballAPI.getCurrentUser();
          
          updateState({
            user: response.user,
            isAuthenticated: true,
          });
          
          await authActions.loadUserLeagues();
        } catch (error) {
          const user = basketballAPI.getCurrentUserFromStorage();
          
          if (user) {
            updateState({
              user,
              isAuthenticated: true,
            });
          } else {
            await authActions.logout();
          }
        }
      }
      
      updateState({ isLoading: false });
    } catch (error) {
      updateState({ isLoading: false });
      console.error('Failed to initialize auth:', error);
    }
  },

  refreshAuth: async () => {
    console.log('Auth refresh not implemented yet');
  }
};