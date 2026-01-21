import { useState, useEffect, useCallback, useRef } from "react";
import { useMutation } from "convex/react";
import * as Haptics from "expo-haptics";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { playSound } from "../utils/soundManager";

export interface ShotClockState {
  seconds: number;
  isRunning: boolean;
  isWarning: boolean;
  isViolation: boolean;
}

interface ViolationState {
  showButton: boolean;
  gameTimeAtViolation: number | null;
}

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
  // Local-only options
  initialSeconds?: number;
  offensiveReboundReset?: number;
  warningThreshold?: number;
  violationButtonDuration?: number; // How long to show violation button (ms)
  onViolation?: () => void;
  enableSound?: boolean;
  enableHaptics?: boolean;
}

/**
 * Hook for managing shot clock state with Convex sync.
 * Features:
 * - Syncs with Convex for cross-instance coordination
 * - Warning state at 5 seconds (configurable)
 * - Violation state at 0 seconds with retroactive pause option
 * - Sound and haptic feedback
 * - Reset to 24 or 14 seconds
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
  enableSound = true,
  enableHaptics = true,
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
  const lastWarningRef = useRef<number | null>(null);
  const hasPlayedViolationRef = useRef(false);
  // Store game time in ref to avoid re-creating interval when it changes
  const gameTimeRef = useRef<number | undefined>(gameTimeRemainingSeconds);

  // Convex mutations
  const resetShotClockMutation = useMutation(api.games.resetShotClock);
  const retroactivePauseMutation = useMutation(api.games.retroactivePause);

  // Play feedback
  const playFeedback = useCallback(
    async (type: "warning" | "violation") => {
      if (enableSound) {
        try {
          if (type === "violation") {
            await playSound("buzzer");
          } else {
            await playSound("whistle");
          }
        } catch (e) {
          // Sound playback failed, continue silently
        }
      }
      if (enableHaptics) {
        if (type === "violation") {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      }
    },
    [enableSound, enableHaptics]
  );

  // Keep game time ref updated
  useEffect(() => {
    gameTimeRef.current = gameTimeRemainingSeconds;
  }, [gameTimeRemainingSeconds]);

  // Sync with server state when it changes
  useEffect(() => {
    if (serverSeconds === undefined) return;

    // Calculate current seconds based on server state
    let currentSeconds = serverSeconds;
    if (serverStartedAt && serverIsRunning) {
      const elapsed = (Date.now() - serverStartedAt) / 1000;
      currentSeconds = Math.max(0, serverSeconds - elapsed);
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
  }, [serverSeconds, serverStartedAt, serverIsRunning, warningThreshold]);

  // Client-side interval for smooth display updates when running
  useEffect(() => {
    // Always clear existing interval first to prevent stacking
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!serverIsRunning || serverStartedAt === undefined || serverSeconds === undefined) {
      return;
    }

    // Update display every 100ms for smooth countdown
    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - serverStartedAt) / 1000;
      const currentSeconds = Math.max(0, serverSeconds - elapsed);
      const roundedSeconds = Math.ceil(currentSeconds);
      const isWarning = roundedSeconds <= warningThreshold && roundedSeconds > 0;
      const isViolation = roundedSeconds === 0;

      setState((prev) => {
        // Play warning sound when entering warning zone
        if (isWarning && !prev.isWarning && lastWarningRef.current !== roundedSeconds) {
          lastWarningRef.current = roundedSeconds;
          if (roundedSeconds === warningThreshold) {
            playFeedback("warning");
          }
        }

        // Handle violation - show button and play feedback
        if (isViolation && !hasPlayedViolationRef.current) {
          hasPlayedViolationRef.current = true;
          onViolation?.();
          playFeedback("violation");

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
    serverStartedAt,
    serverSeconds,
    warningThreshold,
    onViolation,
    playFeedback,
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
      // Haptic feedback for action
      if (enableHaptics) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Failed to retroactively pause:", error);
    }

    // Hide the button
    setViolationState({ showButton: false, gameTimeAtViolation: null });
    if (violationTimeoutRef.current) {
      clearTimeout(violationTimeoutRef.current);
    }
  }, [gameId, token, violationState.gameTimeAtViolation, retroactivePauseMutation, enableHaptics]);

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
