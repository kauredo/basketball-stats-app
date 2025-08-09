import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { basketballAPI } from '../services/api';
import type {
  User,
  AuthTokens,
  LoginCredentials,
  SignupCredentials,
  League,
} from '../types';

// Split state and actions for better TypeScript support in SSR
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
}

export interface AuthActions {
  // Auth actions
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

// Create the auth store and handle both browser and server environments
let store: any;

function createAuthStore() {
  return create<AuthState & AuthActions>()(
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
            
            // Load user's leagues after signup
            await get().loadUserLeagues();
          } catch (error: any) {
            set({
              error: error.response?.data?.error || 'Signup failed',
              isLoading: false,
            });
            throw error;
          }
        },

        logout: async () => {
          try {
            set({ isLoading: true });
            
            await basketballAPI.logout();
            
            set({
              user: null,
              tokens: null,
              isAuthenticated: false,
              userLeagues: [],
              selectedLeague: null,
              isLoading: false,
            });
          } catch (error) {
            // Even if logout fails on the server, clear the local state
            set({
              user: null,
              tokens: null,
              isAuthenticated: false,
              userLeagues: [],
              selectedLeague: null,
              isLoading: false,
            });
          }
        },

        clearError: () => set({ error: null }),

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
            
            // API call will be implemented later
            // const response = await basketballAPI.updateProfile(updates);
            
            // For now, just update local state
            set({
              user: { ...get().user as User, ...updates },
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
            set({ isLoading: true, error: null });
            
            const response = await basketballAPI.getLeagues();
            
            set({
              userLeagues: response.leagues,
              isLoading: false,
            });
            
            // If no league is selected but leagues are available, select the first one
            const { selectedLeague, userLeagues } = get();
            if (!selectedLeague && userLeagues.length > 0) {
              set({ selectedLeague: userLeagues[0] });
            }
          } catch (error: any) {
            set({
              error: error.response?.data?.error || 'Failed to load leagues',
              isLoading: false,
            });
            throw error;
          }
        },

        selectLeague: (league: League | null) => {
          set({ selectedLeague: league });
        },

        joinLeague: async (leagueId: number, role: string = "member") => {
          try {
            set({ isLoading: true, error: null });
            
            const response = await basketballAPI.joinLeague(leagueId, role);
            
            // Update the leagues list
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
            
            // Update local state
            const userLeagues = get().userLeagues.filter(l => l.id !== leagueId);
            set({ 
              userLeagues,
              isLoading: false,
            });
            
            // If the selected league was left, select another one if available
            const { selectedLeague } = get();
            if (selectedLeague && selectedLeague.id === leagueId) {
              set({ 
                selectedLeague: userLeagues.length > 0 ? userLeagues[0] : null 
              });
            }
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
            
            // Update the leagues list
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
              error: error.response?.data?.error || 'Password reset request failed',
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
            set({ isLoading: true });
            
            // Check if user is already authenticated
            if (basketballAPI.isAuthenticated()) {
              try {
                // Load current user from API
                const response = await basketballAPI.getCurrentUser();
                
                set({
                  user: response.user,
                  isAuthenticated: true,
                });
                
                // Load user's leagues
                await get().loadUserLeagues();
              } catch (error) {
                // If API call fails, try to get user from local storage as fallback
                const user = basketballAPI.getCurrentUserFromStorage();
                
                if (user) {
                  set({
                    user,
                    isAuthenticated: true,
                  });
                } else {
                  // Clear auth if no user found
                  await get().logout();
                }
              }
            }
            
            set({ isLoading: false });
          } catch (error) {
            set({ isLoading: false });
            console.error('Failed to initialize auth:', error);
          }
        },

        refreshAuth: async () => {
          // This will be implemented when needed
          // For now, just a placeholder
          console.log('Auth refresh not implemented yet');
        }
      }),
      {
        name: 'basketball-auth-storage',
        storage: createJSONStorage(() => {
          // Use appropriate storage based on environment
          if (typeof localStorage !== 'undefined') {
            return {
              getItem: (name) => {
                try {
                  const value = localStorage.getItem(name);
                  return value ? JSON.parse(value) : null;
                } catch (error) {
                  console.error('Error retrieving auth state from storage:', error);
                  return null;
                }
              },
              setItem: (name, value) => {
                try {
                  localStorage.setItem(name, JSON.stringify(value));
                } catch (error) {
                  console.error('Error storing auth state:', error);
                }
              },
              removeItem: (name) => {
                try {
                  localStorage.removeItem(name);
                } catch (error) {
                  console.error('Error removing auth state from storage:', error);
                }
              }
            };
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
}

// Initialize the store (create it if needed)
export const useAuthStore = () => {
  if (typeof window !== 'undefined' && !store) {
    store = createAuthStore();
  }
  return store || {
    getState: () => ({
      user: null,
      tokens: null, 
      isLoading: false,
      isAuthenticated: false,
      error: null,
      userLeagues: [],
      selectedLeague: null
    } as AuthState),
    setState: () => {},
    subscribe: () => () => {},
    destroy: () => {},
    // Empty implementations for all actions
    login: async () => { throw new Error('Auth actions not available in SSR'); },
    signup: async () => { throw new Error('Auth actions not available in SSR'); },
    logout: async () => { throw new Error('Auth actions not available in SSR'); },
    clearError: () => {},
    loadProfile: async () => { throw new Error('Auth actions not available in SSR'); },
    updateProfile: async () => { throw new Error('Auth actions not available in SSR'); },
    loadUserLeagues: async () => { throw new Error('Auth actions not available in SSR'); },
    selectLeague: () => {},
    joinLeague: async () => { throw new Error('Auth actions not available in SSR'); },
    leaveLeague: async () => { throw new Error('Auth actions not available in SSR'); },
    joinLeagueByCode: async () => { throw new Error('Auth actions not available in SSR'); },
    confirmEmail: async () => { throw new Error('Auth actions not available in SSR'); },
    resendConfirmation: async () => { throw new Error('Auth actions not available in SSR'); },
    forgotPassword: async () => { throw new Error('Auth actions not available in SSR'); },
    resetPassword: async () => { throw new Error('Auth actions not available in SSR'); },
    initialize: async () => { throw new Error('Auth actions not available in SSR'); },
    refreshAuth: async () => { throw new Error('Auth actions not available in SSR'); }
  };
};

// Get state without hooks for non-component code
export const getAuthState = () => {
  if (typeof window !== 'undefined') {
    const authStore = useAuthStore();
    if (typeof authStore.getState === 'function') {
      return authStore.getState();
    }
  }
  return {
    user: null,
    tokens: null, 
    isLoading: false,
    isAuthenticated: false,
    error: null,
    userLeagues: [],
    selectedLeague: null
  } as AuthState;
};
