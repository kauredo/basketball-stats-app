import { useRef, useCallback } from "react";

// Declare webkitAudioContext for browser compatibility
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export interface FeedbackActions {
  confirm: () => void;
  made: () => void;
  missed: () => void;
  foul: () => void;
  foulOut: () => void;
  timeout: () => void;
  overtime: () => void;
  error: () => void;
}

/**
 * Hook for audio and haptic feedback during live game stat recording.
 * Provides distinct audio tones and vibration patterns for different actions.
 */
export function useFeedback(): FeedbackActions {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback(
    (frequency: number, duration: number, type: OscillatorType = "sine") => {
      try {
        const ctx = getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration);
      } catch {
        // Audio not supported - fail silently
      }
    },
    [getAudioContext]
  );

  const vibrate = useCallback((pattern: number | number[]) => {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }, []);

  const confirm = useCallback(() => {
    // Short success beep + vibration
    playTone(800, 0.1);
    vibrate(50);
  }, [playTone, vibrate]);

  const made = useCallback(() => {
    // Higher pitched success for made shots
    playTone(1000, 0.15);
    vibrate([30, 20, 30]);
  }, [playTone, vibrate]);

  const missed = useCallback(() => {
    // Lower pitched for missed
    playTone(300, 0.1);
    vibrate(30);
  }, [playTone, vibrate]);

  const foul = useCallback(() => {
    // Warning sound for fouls
    playTone(400, 0.2, "square");
    vibrate([50, 30, 50]);
  }, [playTone, vibrate]);

  const foulOut = useCallback(() => {
    // Alert sound for foul out
    playTone(200, 0.3, "sawtooth");
    vibrate([100, 50, 100, 50, 100]);
  }, [playTone, vibrate]);

  const timeout = useCallback(() => {
    // Double beep for timeout
    playTone(600, 0.1);
    setTimeout(() => playTone(600, 0.1), 150);
    vibrate([50, 50, 50]);
  }, [playTone, vibrate]);

  const overtime = useCallback(() => {
    // Special sound for overtime
    playTone(500, 0.2);
    setTimeout(() => playTone(700, 0.2), 200);
    setTimeout(() => playTone(900, 0.3), 400);
    vibrate([100, 50, 100, 50, 100]);
  }, [playTone, vibrate]);

  const error = useCallback(() => {
    // Error sound
    playTone(200, 0.3, "square");
    vibrate([100, 50, 100]);
  }, [playTone, vibrate]);

  return {
    confirm,
    made,
    missed,
    foul,
    foulOut,
    timeout,
    overtime,
    error,
  };
}
