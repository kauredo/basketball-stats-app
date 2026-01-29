import { useState, useEffect, useCallback, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { ShotClockState } from "../../types/livegame";
import { useFeedback } from "./useFeedback";

interface UseShotClockOptions {
  // Convex sync props
  gameId?: Id<"games">;
  token?: string;
  // Server state (from game query)
  serverSeconds?: number;
  serverStartedAt?: number;
  serverIsRunning?: boolean;
  // Game clock time (for violation tracking)
  gameTimeRemainingSeconds?: number;
  // Local-only options (fallback if no Convex sync)
  initialSeconds?: number;
  offensiveReboundReset?: number;
  warningThreshold?: number;
  violationButtonDuration?: number; // How long to show violation button (ms)
  onViolation?: () => void;
}

interface ViolationState {
  showButton: boolean;
  gameTimeAtViolation: number | null;
}

/**
 * Hook for managing shot clock state.
 * Syncs with Convex for cross-instance coordination when gameId/token provided.
 * Falls back to local-only mode if no Convex props.
 */
export function useShotClock({
  gameId,
  token,
  serverSeconds,
  serverStartedAt,
  serverIsRunning,
  gameTimeRemainingSeconds,
  initialSeconds = 24,
  offensiveReboundReset = 14,
  warningThreshold = 5,
  violationButtonDuration = 5000, // 5 seconds default
  onViolation,
}: UseShotClockOptions = {}) {
  const [state, setState] = useState<ShotClockState>({
    seconds: serverSeconds ?? initialSeconds,
    isRunning: serverIsRunning ?? false,
    isWarning: false,
    isViolation: false,
  });

  const [violationState, setViolationState] = useState<ViolationState>({
    showButton: false,
    gameTimeAtViolation: null,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const violationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedback = useFeedback();
  const lastWarningRef = useRef<number | null>(null);
  const hasPlayedViolationRef = useRef(false);
  // Store game time in ref to avoid re-creating interval when it changes
  const gameTimeRef = useRef<number | undefined>(gameTimeRemainingSeconds);

  // Track when we started counting on the client side
  // This avoids issues with server/client clock differences
  const clientStartTimeRef = useRef<number | null>(null);
  const startingSecondsRef = useRef<number>(serverSeconds ?? initialSeconds);
  const lastServerStartedAtRef = useRef<number | undefined>(undefined);

  // Convex mutations
  const resetShotClockMutation = useMutation(api.games.resetShotClock);
  const retroactivePauseMutation = useMutation(api.games.retroactivePause);

  // Keep game time ref updated
  useEffect(() => {
    gameTimeRef.current = gameTimeRemainingSeconds;
  }, [gameTimeRemainingSeconds]);

  // Sync with server state when it changes
  useEffect(() => {
    if (serverSeconds === undefined) return;

    // Detect if this is a new "start" event (serverStartedAt changed)
    const isNewStart = serverStartedAt !== undefined &&
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
    } else if (serverIsRunning && serverSeconds !== startingSecondsRef.current && clientStartTimeRef.current === null) {
      // Clock is running but we don't have a client start time (e.g., page reload while clock running)
      // Fall back to server timestamp in this case
      clientStartTimeRef.current = Date.now();
      startingSecondsRef.current = serverSeconds;
      lastServerStartedAtRef.current = serverStartedAt;
    }

    // Calculate current seconds
    let currentSeconds = serverSeconds;
    if (serverIsRunning && clientStartTimeRef.current !== null) {
      const elapsed = (Date.now() - clientStartTimeRef.current) / 1000;
      currentSeconds = Math.max(0, startingSecondsRef.current - elapsed);
    }

    const roundedSeconds = Math.ceil(currentSeconds);
    const isWarning = roundedSeconds <= warningThreshold && roundedSeconds > 0;
    const isViolation = roundedSeconds === 0;

    setState({
      seconds: currentSeconds, // Store precise value for display
      isRunning: serverIsRunning ?? false,
      isWarning,
      isViolation,
    });

    // Reset violation flag when clock resets
    if (currentSeconds > 1) {
      hasPlayedViolationRef.current = false;
    }
  }, [serverSeconds, serverStartedAt, serverIsRunning, warningThreshold, initialSeconds]);

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
      const roundedSeconds = Math.ceil(currentSeconds);
      const isWarning = roundedSeconds <= warningThreshold && roundedSeconds > 0;
      const isViolation = roundedSeconds === 0;

      setState((prev) => {
        // Play warning sound when entering warning zone
        if (isWarning && !prev.isWarning && lastWarningRef.current !== roundedSeconds) {
          lastWarningRef.current = roundedSeconds;
          if (roundedSeconds === warningThreshold) {
            feedback.shotClockWarning();
          }
        }

        // Handle violation - show button and play feedback
        if (isViolation && !hasPlayedViolationRef.current) {
          hasPlayedViolationRef.current = true;
          onViolation?.();
          feedback.buzzer();

          // Show violation button and capture game time
          setViolationState({
            showButton: true,
            gameTimeAtViolation: gameTimeRef.current ?? null,
          });

          // Auto-hide after duration
          if (violationTimeoutRef.current) {
            clearTimeout(violationTimeoutRef.current);
          }
          violationTimeoutRef.current = setTimeout(() => {
            setViolationState((prev) => ({ ...prev, showButton: false }));
          }, violationButtonDuration);
        }

        return {
          seconds: currentSeconds,
          isRunning: true,
          isWarning,
          isViolation,
        };
      });
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    serverIsRunning,
    warningThreshold,
    onViolation,
    feedback,
    violationButtonDuration,
  ]);

  // Handle retroactive pause (stop clock at violation time)
  const handleViolationPause = useCallback(async () => {
    if (!gameId || !token || violationState.gameTimeAtViolation === null) return;

    try {
      await retroactivePauseMutation({
        token,
        gameId,
        timeRemainingSeconds: violationState.gameTimeAtViolation,
      });
    } catch (error) {
      console.error("Failed to retroactively pause:", error);
    }

    // Hide the button
    setViolationState({ showButton: false, gameTimeAtViolation: null });
    if (violationTimeoutRef.current) {
      clearTimeout(violationTimeoutRef.current);
    }
  }, [gameId, token, violationState.gameTimeAtViolation, retroactivePauseMutation]);

  // Dismiss violation button without pausing
  const dismissViolation = useCallback(() => {
    setViolationState({ showButton: false, gameTimeAtViolation: null });
    if (violationTimeoutRef.current) {
      clearTimeout(violationTimeoutRef.current);
    }
  }, []);

  // Reset to full (24 seconds)
  const reset = useCallback(async () => {
    if (gameId && token) {
      await resetShotClockMutation({ token, gameId, seconds: 24, autoStart: true });
    } else {
      // Local fallback
      setState({
        seconds: initialSeconds,
        isRunning: false,
        isWarning: false,
        isViolation: false,
      });
    }
    hasPlayedViolationRef.current = false;
    lastWarningRef.current = null;
    // Also dismiss violation button on reset
    setViolationState({ showButton: false, gameTimeAtViolation: null });
  }, [gameId, token, resetShotClockMutation, initialSeconds]);

  // Reset to offensive rebound time (14 seconds)
  const resetOffensiveRebound = useCallback(async () => {
    if (gameId && token) {
      await resetShotClockMutation({ token, gameId, seconds: 14, autoStart: true });
    } else {
      // Local fallback
      setState({
        seconds: offensiveReboundReset,
        isRunning: false,
        isWarning: false,
        isViolation: false,
      });
    }
    hasPlayedViolationRef.current = false;
    lastWarningRef.current = null;
    // Also dismiss violation button on reset
    setViolationState({ showButton: false, gameTimeAtViolation: null });
  }, [gameId, token, resetShotClockMutation, offensiveReboundReset]);

  // Set custom time
  const setTime = useCallback(
    async (seconds: number) => {
      if (gameId && token) {
        await resetShotClockMutation({ token, gameId, seconds, autoStart: false });
      } else {
        setState((prev) => ({
          ...prev,
          seconds,
          isWarning: seconds <= warningThreshold,
          isViolation: seconds === 0,
        }));
      }
    },
    [gameId, token, resetShotClockMutation, warningThreshold]
  );

  // Format time for display (SS.T format showing tenths)
  const formatTime = useCallback((seconds: number): string => {
    const wholeSec = Math.floor(seconds);
    const tenths = Math.floor((seconds - wholeSec) * 10);
    return `${wholeSec}.${tenths}`;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (violationTimeoutRef.current) {
        clearTimeout(violationTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    // Display value (rounded for most uses, precise for formatting)
    displaySeconds: Math.ceil(state.seconds),
    formattedTime: formatTime(state.seconds),
    // Violation state
    showViolationButton: violationState.showButton,
    violationGameTime: violationState.gameTimeAtViolation,
    // Actions
    reset,
    resetOffensiveRebound,
    setTime,
    handleViolationPause,
    dismissViolation,
    // Legacy compatibility (no-ops when using Convex sync)
    start: () => {},
    pause: () => {},
    toggle: () => {},
  };
}

export default useShotClock;
