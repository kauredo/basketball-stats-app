import { useState, useEffect, useCallback, useRef } from "react";
import { ShotClockState } from "../../types/livegame";
import { useFeedback } from "./useFeedback";

interface UseShotClockOptions {
  initialSeconds?: number;
  offensiveReboundReset?: number;
  warningThreshold?: number;
  onViolation?: () => void;
}

/**
 * Hook for managing shot clock state.
 * Local-only (not synced to server) since shot clock is primarily for live scoring UX.
 */
export function useShotClock({
  initialSeconds = 24,
  offensiveReboundReset = 14,
  warningThreshold = 5,
  onViolation,
}: UseShotClockOptions = {}) {
  const [state, setState] = useState<ShotClockState>({
    seconds: initialSeconds,
    isRunning: false,
    isWarning: false,
    isViolation: false,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef<number>(Date.now());
  const feedback = useFeedback();

  // Start the shot clock
  const start = useCallback(() => {
    if (state.isRunning) return;

    lastTickRef.current = Date.now();
    setState((prev) => ({ ...prev, isRunning: true, isViolation: false }));

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - lastTickRef.current) / 1000;

      if (elapsed >= 0.1) {
        lastTickRef.current = now;

        setState((prev) => {
          const newSeconds = Math.max(0, prev.seconds - elapsed);
          const roundedSeconds = Math.ceil(newSeconds);
          const isWarning = roundedSeconds <= warningThreshold && roundedSeconds > 0;
          const isViolation = roundedSeconds === 0;

          // Play warning sound when entering warning zone
          if (isWarning && !prev.isWarning && roundedSeconds === warningThreshold) {
            feedback.shotClockWarning();
          }

          // Handle violation
          if (isViolation && !prev.isViolation) {
            onViolation?.();
            feedback.buzzer();
          }

          return {
            ...prev,
            seconds: roundedSeconds,
            isWarning,
            isViolation,
          };
        });
      }
    }, 100);
  }, [state.isRunning, warningThreshold, onViolation, feedback]);

  // Pause the shot clock
  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState((prev) => ({ ...prev, isRunning: false }));
  }, []);

  // Reset to full (24 seconds)
  const reset = useCallback(() => {
    pause();
    setState({
      seconds: initialSeconds,
      isRunning: false,
      isWarning: false,
      isViolation: false,
    });
  }, [initialSeconds, pause]);

  // Reset to offensive rebound time (14 seconds)
  const resetOffensiveRebound = useCallback(() => {
    pause();
    setState({
      seconds: offensiveReboundReset,
      isRunning: false,
      isWarning: false,
      isViolation: false,
    });
  }, [offensiveReboundReset, pause]);

  // Set custom time
  const setTime = useCallback((seconds: number) => {
    setState((prev) => ({
      ...prev,
      seconds,
      isWarning: seconds <= warningThreshold,
      isViolation: seconds === 0,
    }));
  }, [warningThreshold]);

  // Toggle running state
  const toggle = useCallback(() => {
    if (state.isRunning) {
      pause();
    } else {
      start();
    }
  }, [state.isRunning, start, pause]);

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
    resetOffensiveRebound,
    setTime,
    toggle,
  };
}

export default useShotClock;
