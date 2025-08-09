import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { basketballAPI } from '../services/api';
import {
  User,
  AuthTokens,
  LoginCredentials,
  SignupCredentials,
  League,
} from '../types';

export interface AuthState {
  // State
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  
  // User's leagues
  userLeagues: League[];
  selectedLeague: League | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  
  // Profile actions
  loadProfile: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  
  // League actions
  loadUserLeagues: () => Promise<void>;
  selectLeague: (league: League | null) => void;
  joinLeague: (leagueId: number, role?: string) => Promise<void>;
  leaveLeague: (leagueId: number) => Promise<void>;
  joinLeagueByCode: (code: string) => Promise<void>;
  
  // Email actions
  confirmEmail: (token: string) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string, passwordConfirmation: string) => Promise<void>;
  
  // Utility actions
  initialize: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      tokens: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
      userLeagues: [],
      selectedLeague: null,

      // Auth actions
      login: async (credentials: LoginCredentials) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await basketballAPI.login(credentials);
          
          set({
            user: response.user,
            tokens: response.tokens,
            isAuthenticated: true,
            isLoading: false,
          });
          
          // Load user's leagues after login
          await get().loadUserLeagues();
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      signup: async (credentials: SignupCredentials) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await basketballAPI.signup(credentials);
          
          set({
            user: response.user,
            tokens: response.tokens,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.errors?.join(', ') || 'Signup failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await basketballAPI.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
            userLeagues: [],
            selectedLeague: null,
            error: null,
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      // Profile actions
      loadProfile: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await basketballAPI.getCurrentUser();
          
          set({
            user: response.user,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'Failed to load profile',
            isLoading: false,
          });
          throw error;
        }
      },

      updateProfile: async (updates: Partial<User>) => {
        try {
          set({ isLoading: true, error: null });
          
          // This would need to be implemented in the API
          // const response = await basketballAPI.updateProfile(updates);
          
          set({
            user: { ...get().user!, ...updates },
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'Failed to update profile',
            isLoading: false,
          });
          throw error;
        }
      },

      // League actions
      loadUserLeagues: async () => {
        try {
          const response = await basketballAPI.getLeagues();
          const userLeagues = response.leagues.filter(league => league.membership);
          
          set({ userLeagues });
          
          // Auto-select first league if none selected
          const currentSelected = get().selectedLeague;
          if (!currentSelected && userLeagues.length > 0) {
            set({ selectedLeague: userLeagues[0] });
          }
        } catch (error: any) {
          set({ error: error.response?.data?.error || 'Failed to load leagues' });
        }
      },

      selectLeague: (league: League | null) => {
        set({ selectedLeague: league });
      },

      joinLeague: async (leagueId: number, role = 'member') => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await basketballAPI.joinLeague(leagueId, role);
          
          // Refresh user leagues
          await get().loadUserLeagues();
          
          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'Failed to join league',
            isLoading: false,
          });
          throw error;
        }
      },

      leaveLeague: async (leagueId: number) => {
        try {
          set({ isLoading: true, error: null });
          
          await basketballAPI.leaveLeague(leagueId);
          
          // Remove from user leagues and deselect if it was selected
          const userLeagues = get().userLeagues.filter(l => l.id !== leagueId);
          const selectedLeague = get().selectedLeague?.id === leagueId ? null : get().selectedLeague;
          
          set({ 
            userLeagues,
            selectedLeague,
            isLoading: false 
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'Failed to leave league',
            isLoading: false,
          });
          throw error;
        }
      },

      joinLeagueByCode: async (code: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await basketballAPI.joinLeagueByCode(code);
          
          // Refresh user leagues
          await get().loadUserLeagues();
          
          // Select the newly joined league
          set({ 
            selectedLeague: response.league,
            isLoading: false 
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'Failed to join league',
            isLoading: false,
          });
          throw error;
        }
      },

      // Email actions
      confirmEmail: async (token: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await basketballAPI.confirmEmail(token);
          
          set({
            user: response.user,
            tokens: response.tokens,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'Email confirmation failed',
            isLoading: false,
          });
          throw error;
        }
      },

      resendConfirmation: async (email: string) => {
        try {
          set({ isLoading: true, error: null });
          
          await basketballAPI.resendConfirmation(email);
          
          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'Failed to resend confirmation',
            isLoading: false,
          });
          throw error;
        }
      },

      forgotPassword: async (email: string) => {
        try {
          set({ isLoading: true, error: null });
          
          await basketballAPI.forgotPassword(email);
          
          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'Failed to send reset email',
            isLoading: false,
          });
          throw error;
        }
      },

      resetPassword: async (token: string, password: string, passwordConfirmation: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await basketballAPI.resetPassword(token, password, passwordConfirmation);
          
          set({
            user: response.user,
            tokens: response.tokens,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'Password reset failed',
            isLoading: false,
          });
          throw error;
        }
      },

      // Utility actions
      initialize: async () => {
        try {
          const storedUser = basketballAPI.getCurrentUserFromStorage();
          const isAuthenticated = basketballAPI.isAuthenticated();
          
          if (storedUser && isAuthenticated) {
            set({
              user: storedUser,
              isAuthenticated: true,
            });
            
            // Try to refresh profile and leagues
            try {
              await get().loadProfile();
              await get().loadUserLeagues();
            } catch (error) {
              console.error('Failed to refresh auth data:', error);
              // Don't logout on profile/league load failure
            }
          }
        } catch (error) {
          console.error('Auth initialization failed:', error);
          await get().logout();
        }
      },

      refreshAuth: async () => {
        if (!get().isAuthenticated) return;
        
        try {
          await get().loadProfile();
          await get().loadUserLeagues();
        } catch (error) {
          console.error('Auth refresh failed:', error);
          // Don't logout automatically - let the API interceptor handle token issues
        }
      },
    }),
    {
      name: 'basketball-auth-storage',
      storage: createJSONStorage(() => {
        // Use appropriate storage based on environment
        if (typeof localStorage !== 'undefined') {
          return localStorage;
        }
        // For React Native, you might want to use AsyncStorage
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
        selectedLeague: state.selectedLeague,
      }),
    }
  )
);