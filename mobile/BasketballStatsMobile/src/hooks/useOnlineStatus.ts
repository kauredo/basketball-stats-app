import { useState, useEffect, useRef } from "react";

// Simple in-memory cache for offline data (will be cleared when app restarts)
const offlineCache = new Map<string, { data: unknown; timestamp: number }>();

export interface OnlineStatus {
  isOnline: boolean;
  wasOffline: boolean;
  connectionType: string | null;
}

/**
 * Hook to detect online/offline status
 * Uses a simple fetch-based approach to check connectivity
 */
export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [connectionType, setConnectionType] = useState<string | null>("wifi");
  const previousOnline = useRef(true);

  useEffect(() => {
    // Simple connectivity check by pinging a reliable endpoint
    const checkConnectivity = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch("https://www.google.com/generate_204", {
          method: "HEAD",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const nowOnline = response.ok || response.status === 204;

        // If we were offline and now online, show "back online" message briefly
        if (nowOnline && !previousOnline.current) {
          setWasOffline(true);
          setTimeout(() => setWasOffline(false), 5000);
        }

        previousOnline.current = nowOnline;
        setIsOnline(nowOnline);
      } catch {
        // If fetch fails, assume offline
        if (previousOnline.current) {
          previousOnline.current = false;
          setIsOnline(false);
          setWasOffline(false);
        }
      }
    };

    // Check immediately
    checkConnectivity();

    // Check periodically (every 10 seconds)
    const interval = setInterval(checkConnectivity, 10000);

    return () => clearInterval(interval);
  }, []);

  return { isOnline, wasOffline, connectionType };
}

/**
 * Hook to cache data locally for offline access (in-memory cache)
 */
export function useOfflineCache<T>(key: string, data: T | undefined): {
  data: T | undefined;
  isCached: boolean;
} {
  const [cachedData, setCachedData] = useState<T | undefined>(undefined);
  const { isOnline } = useOnlineStatus();

  // Save data to cache when data is available
  useEffect(() => {
    if (data !== undefined) {
      offlineCache.set(key, { data, timestamp: Date.now() });
    }
  }, [key, data]);

  // Load cached data when offline or data is loading
  useEffect(() => {
    if (data === undefined || !isOnline) {
      const cached = offlineCache.get(key);
      if (cached) {
        setCachedData(cached.data as T);
      }
    }
  }, [key, data, isOnline]);

  return {
    data: data !== undefined ? data : cachedData,
    isCached: data === undefined && cachedData !== undefined,
  };
}

/**
 * Utility to clear offline cache
 */
export function clearOfflineCache(): void {
  offlineCache.clear();
}
