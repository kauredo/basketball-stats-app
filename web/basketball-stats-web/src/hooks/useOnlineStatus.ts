import { useState, useEffect, useCallback } from "react";

export interface OnlineStatus {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnlineAt: Date | null;
}

/**
 * Hook to detect online/offline status with history tracking
 */
export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);
  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(null);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setLastOnlineAt(new Date());
    // Keep wasOffline true for a few seconds to show "Back online" message
    if (!isOnline) {
      setWasOffline(true);
      setTimeout(() => setWasOffline(false), 5000);
    }
  }, [isOnline]);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setWasOffline(false);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return { isOnline, wasOffline, lastOnlineAt };
}

/**
 * Hook to cache data locally for offline access
 */
export function useOfflineCache<T>(key: string, data: T | undefined): T | undefined {
  const [cachedData, setCachedData] = useState<T | undefined>(undefined);
  const { isOnline } = useOnlineStatus();

  useEffect(() => {
    // When online and we have data, cache it
    if (data !== undefined) {
      try {
        localStorage.setItem(`offline_cache_${key}`, JSON.stringify(data));
        localStorage.setItem(`offline_cache_${key}_timestamp`, Date.now().toString());
      } catch (e) {
        console.warn("Failed to cache data for offline use:", e);
      }
    }
  }, [key, data]);

  useEffect(() => {
    // When offline or data is loading, try to use cached data
    if (data === undefined || !isOnline) {
      try {
        const cached = localStorage.getItem(`offline_cache_${key}`);
        if (cached) {
          setCachedData(JSON.parse(cached));
        }
      } catch (e) {
        console.warn("Failed to read cached data:", e);
      }
    } else {
      setCachedData(undefined);
    }
  }, [key, data, isOnline]);

  // Return live data when available, otherwise cached data
  return data !== undefined ? data : cachedData;
}
