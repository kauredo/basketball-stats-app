import { useState, useEffect, useCallback, useRef } from "react";

export interface GameClockState {
  displayTime: string;
  seconds: number;
  isRunning: boolean;
  quarter: number;
  quarterDuration: number;
}

interface UseGameClockOptions {
  // Server state (from game query)
  serverSeconds?: number;
  serverStartedAt?: number;
  serverIsRunning?: boolean;
  // Callbacks
  onQuarterEnd?: () => void;
  // Legacy options (for backwards compatibility when not using Convex sync)
  initialSeconds?: number;
  quarterDuration?: number;
}

/**
 * Hook for managing game clock state.
 * Uses client-relative timing to avoid server/client clock drift issues.
 * When the clock starts running, we capture the client time and calculate
 * elapsed time relative to that, avoiding issues with network latency.
 */
export function useGameClock({
  serverSeconds,
  serverStartedAt,
  serverIsRunning,
  onQuarterEnd,
  initialSeconds = 720, // 12 minutes default
  quarterDuration = 720,
}: UseGameClockOptions = {}) {
  const [state, setState] = useState<GameClockState>({
    displayTime: formatTime(serverSeconds ?? initialSeconds),
    seconds: serverSeconds ?? initialSeconds,
    isRunning: serverIsRunning ?? false,
    quarter: 1,
    quarterDuration,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasTriggeredQuarterEndRef = useRef(false);

  // Track when we started counting on the client side
  // This avoids issues with server/client clock differences
  const clientStartTimeRef = useRef<number | null>(null);
  const startingSecondsRef = useRef<number>(serverSeconds ?? initialSeconds);
  const lastServerStartedAtRef = useRef<number | undefined>(undefined);

  // Format seconds to MM:SS
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  // Sync with server state when it changes
  useEffect(() => {
    if (serverSeconds === undefined) return;

    // Detect if this is a new "start" event (serverStartedAt changed)
    const isNewStart =
      serverStartedAt !== undefined &&
      serverStartedAt !== lastServerStartedAtRef.current &&
      serverIsRunning;

    if (isNewStart) {
      // Clock just started/resumed - capture client time now
      clientStartTimeRef.current = Date.now();
      startingSecondsRef.current = serverSeconds;
      lastServerStartedAtRef.current = serverStartedAt;
    } else if (!serverIsRunning) {
      // Clock stopped - clear client start time
      clientStartTimeRef.current = null;
      lastServerStartedAtRef.current = undefined;
    }

    // Calculate current seconds
    let currentSeconds = serverSeconds;
    if (serverIsRunning && clientStartTimeRef.current !== null) {
      const elapsed = (Date.now() - clientStartTimeRef.current) / 1000;
      currentSeconds = Math.max(0, startingSecondsRef.current - elapsed);
    }

    setState((prev) => ({
      ...prev,
      seconds: currentSeconds,
      displayTime: formatTime(currentSeconds),
      isRunning: serverIsRunning ?? false,
    }));

    // Reset quarter end flag when clock resets to a higher value
    if (currentSeconds > 1) {
      hasTriggeredQuarterEndRef.current = false;
    }
  }, [serverSeconds, serverStartedAt, serverIsRunning]);

  // Client-side interval for smooth display updates when running
  useEffect(() => {
    // Always clear existing interval first to prevent stacking
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!serverIsRunning || clientStartTimeRef.current === null) {
      return;
    }

    // Update display every 100ms for smooth countdown
    intervalRef.current = setInterval(() => {
      if (clientStartTimeRef.current === null) return;

      const elapsed = (Date.now() - clientStartTimeRef.current) / 1000;
      const currentSeconds = Math.max(0, startingSecondsRef.current - elapsed);

      setState((prev) => {
        // Check for quarter end
        if (currentSeconds === 0 && prev.seconds > 0 && !hasTriggeredQuarterEndRef.current) {
          hasTriggeredQuarterEndRef.current = true;
          onQuarterEnd?.();
        }

        return {
          ...prev,
          seconds: currentSeconds,
          displayTime: formatTime(currentSeconds),
          isRunning: true,
        };
      });
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [serverIsRunning, onQuarterEnd]);

  // Legacy methods for backwards compatibility (no-ops when using Convex sync)
  const start = useCallback(() => {
    // No-op when using server sync - use resume mutation instead
  }, []);

  const pause = useCallback(() => {
    // No-op when using server sync - use pause mutation instead
  }, []);

  const reset = useCallback(
    (_seconds?: number) => {
      // No-op when using server sync - use setGameTime mutation instead
      const newSeconds = _seconds ?? quarterDuration;
      setState((prev) => ({
        ...prev,
        seconds: newSeconds,
        displayTime: formatTime(newSeconds),
      }));
    },
    [quarterDuration]
  );

  const setTime = useCallback((seconds: number) => {
    // No-op when using server sync - use setGameTime mutation instead
    setState((prev) => ({
      ...prev,
      seconds,
      displayTime: formatTime(seconds),
    }));
  }, []);

  const setQuarter = useCallback((quarter: number) => {
    setState((prev) => ({ ...prev, quarter }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    // Display values
    displaySeconds: Math.floor(state.seconds),
    formattedTime: formatTime(state.seconds),
    // Legacy actions (for backwards compatibility)
    start,
    pause,
    reset,
    setTime,
    setQuarter,
  };
}

export default useGameClock;
