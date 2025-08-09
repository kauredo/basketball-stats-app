// Export the pure JavaScript functions from simpleAuthStore
// Each app should create their own React hooks
export { 
  subscribeToAuth, 
  getAuthState, 
  authActions,
  type AuthState 
} from './simpleAuthStore';