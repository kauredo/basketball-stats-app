import { useEffect, useState } from "react";
import { subscribeToAuth, getAuthState, authActions, AuthState } from "@basketball-stats/shared";

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>(getAuthState());

  useEffect(() => {
    const unsubscribe = subscribeToAuth(setAuth);
    return unsubscribe;
  }, []);

  return {
    ...auth,
    ...authActions,
  };
}
