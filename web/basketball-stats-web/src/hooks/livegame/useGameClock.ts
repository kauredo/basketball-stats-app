import { useState, useEffect, useCallback, useRef } from "react";
import { GameClockState } from "../../types/livegame";

interface UseGameClockOptions {
  initialSeconds?: number;
  quarterDuration?: number;
  onQuarterEnd?: () => void;
}

/**
 * Hook for managing game clock state.
 * Syncs with server time but provides smooth local countdown.
 */
export function useGameClock({
  initialSeconds = 720, // 12 minutes default
  quarterDuration = 720,
  onQuarterEnd,
}: UseGameClockOptions = {}) {
  const [state, setState] = useState<GameClockState>({
    displayTime: formatTime(initialSeconds),
    seconds: initialSeconds,
    isRunning: false,
    quarter: 1,
    quarterDuration,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef<number>(Date.now());

  // Format seconds to MM:SS
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  // Start the clock
  const start = useCallback(() => {
    if (state.isRunning) return;

    lastTickRef.current = Date.now();
    setState((prev) => ({ ...prev, isRunning: true }));

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - lastTickRef.current) / 1000);

      if (elapsed >= 1) {
        lastTickRef.current = now;

        setState((prev) => {
          const newSeconds = Math.max(0, prev.seconds - elapsed);

          if (newSeconds === 0 && prev.seconds > 0) {
            // Quarter ended
            onQuarterEnd?.();
          }

          return {
            ...prev,
            seconds: newSeconds,
            displayTime: formatTime(newSeconds),
          };
        });
      }
    }, 100); // Update every 100ms for smooth display
  }, [state.isRunning, onQuarterEnd]);

  // Pause the clock
  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState((prev) => ({ ...prev, isRunning: false }));
  }, []);

  // Reset to a specific time
  const reset = useCallback(
    (seconds?: number) => {
      const newSeconds = seconds ?? quarterDuration;
      setState((prev) => ({
        ...prev,
        seconds: newSeconds,
        displayTime: formatTime(newSeconds),
      }));
    },
    [quarterDuration]
  );

  // Set time manually (for syncing with server)
  const setTime = useCallback((seconds: number) => {
    setState((prev) => ({
      ...prev,
      seconds,
      displayTime: formatTime(seconds),
    }));
  }, []);

  // Set quarter
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
    start,
    pause,
    reset,
    setTime,
    setQuarter,
  };
}

export default useGameClock;
