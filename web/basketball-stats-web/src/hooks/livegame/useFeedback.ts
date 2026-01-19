import { useRef, useCallback } from "react";

interface FeedbackMethods {
  confirm: () => void;
  made: () => void;
  missed: () => void;
  foul: () => void;
  foulOut: () => void;
  timeout: () => void;
  overtime: () => void;
  error: () => void;
  shotClockWarning: () => void;
  buzzer: () => void;
}

/**
 * Custom hook for audio and haptic feedback during live game stat recording.
 * Uses Web Audio API for sounds and Vibration API for haptics.
 */
export function useFeedback(): FeedbackMethods {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      )();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback(
    (frequency: number, duration: number, type: OscillatorType = "sine", volume: number = 0.1) => {
      try {
        const ctx = getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;
        gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration);
      } catch {
        // Audio not supported or blocked
      }
    },
    [getAudioContext]
  );

  const vibrate = useCallback((pattern: number | number[]) => {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }, []);

  // Short success beep + vibration
  const confirm = useCallback(() => {
    playTone(800, 0.1);
    vibrate(50);
  }, [playTone, vibrate]);

  // Higher pitched success for made shots
  const made = useCallback(() => {
    playTone(1000, 0.15);
    vibrate([30, 20, 30]);
  }, [playTone, vibrate]);

  // Lower pitched for missed
  const missed = useCallback(() => {
    playTone(300, 0.1);
    vibrate(30);
  }, [playTone, vibrate]);

  // Warning sound for fouls
  const foul = useCallback(() => {
    playTone(400, 0.2, "square");
    vibrate([50, 30, 50]);
  }, [playTone, vibrate]);

  // Alert sound for foul out
  const foulOut = useCallback(() => {
    playTone(200, 0.3, "sawtooth");
    vibrate([100, 50, 100, 50, 100]);
  }, [playTone, vibrate]);

  // Double beep for timeout
  const timeout = useCallback(() => {
    playTone(600, 0.1);
    setTimeout(() => playTone(600, 0.1), 150);
    vibrate([50, 50, 50]);
  }, [playTone, vibrate]);

  // Special sound for overtime - rising tone sequence
  const overtime = useCallback(() => {
    playTone(500, 0.2);
    setTimeout(() => playTone(700, 0.2), 200);
    setTimeout(() => playTone(900, 0.3), 400);
    vibrate([100, 50, 100, 50, 100]);
  }, [playTone, vibrate]);

  // Error sound
  const error = useCallback(() => {
    playTone(200, 0.3, "square");
    vibrate([100, 50, 100]);
  }, [playTone, vibrate]);

  // Shot clock warning at 5 seconds
  const shotClockWarning = useCallback(() => {
    playTone(880, 0.15, "square", 0.15);
    vibrate(30);
  }, [playTone, vibrate]);

  // End of quarter/game buzzer
  const buzzer = useCallback(() => {
    playTone(220, 0.8, "sawtooth", 0.2);
    vibrate([200, 100, 200]);
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
    shotClockWarning,
    buzzer,
  };
}

export default useFeedback;
