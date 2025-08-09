import { useState, useEffect } from 'react';
import { 
  subscribeToAuth, 
  getAuthState, 
  authActions,
  type AuthState 
} from '@basketball-stats/shared';

export function useAuthStore() {
  const [state, setState] = useState<AuthState>(getAuthState());

  useEffect(() => {
    const unsubscribe = subscribeToAuth(setState);
    return unsubscribe;
  }, []);

  return {
    ...state,
    ...authActions,
  };
}