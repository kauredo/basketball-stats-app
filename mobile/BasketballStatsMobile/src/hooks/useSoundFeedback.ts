import { useCallback, useEffect, useRef } from "react";
import * as Haptics from "expo-haptics";
import {
  playSound,
  initializeAudio,
  preloadSounds,
  unloadAllSounds,
  setSoundEnabled,
  getSoundEnabled,
  type SoundType,
} from "../utils/soundManager";

interface SoundFeedbackOptions {
  enableSound?: boolean;
  enableHaptics?: boolean;
}

interface SoundFeedbackActions {
  made: () => Promise<void>;
  missed: () => Promise<void>;
  foul: () => Promise<void>;
  foulOut: () => Promise<void>;
  timeout: () => Promise<void>;
  overtime: () => Promise<void>;
  buzzer: () => Promise<void>;
  whistle: () => Promise<void>;
  success: () => Promise<void>;
  error: () => Promise<void>;
  selection: () => Promise<void>;
  setSoundEnabled: (enabled: boolean) => void;
  isSoundEnabled: () => boolean;
}

export function useSoundFeedback(options: SoundFeedbackOptions = {}): SoundFeedbackActions {
  const { enableSound = true, enableHaptics = true } = options;
  const isInitialized = useRef(false);

  useEffect(() => {
    const init = async () => {
      if (!isInitialized.current) {
        await initializeAudio();
        await preloadSounds();
        isInitialized.current = true;
      }
    };

    if (enableSound) {
      init();
    }

    return () => {
      // Cleanup on unmount
      unloadAllSounds();
    };
  }, [enableSound]);

  const playFeedback = useCallback(
    async (
      soundType: SoundType,
      hapticType?: Haptics.ImpactFeedbackStyle | Haptics.NotificationFeedbackType
    ) => {
      const promises: Promise<void>[] = [];

      if (enableSound) {
        promises.push(playSound(soundType));
      }

      if (enableHaptics && hapticType !== undefined) {
        if (
          hapticType === Haptics.NotificationFeedbackType.Success ||
          hapticType === Haptics.NotificationFeedbackType.Warning ||
          hapticType === Haptics.NotificationFeedbackType.Error
        ) {
          promises.push(Haptics.notificationAsync(hapticType));
        } else {
          promises.push(Haptics.impactAsync(hapticType as Haptics.ImpactFeedbackStyle));
        }
      }

      await Promise.all(promises);
    },
    [enableSound, enableHaptics]
  );

  const made = useCallback(async () => {
    await playFeedback("made", Haptics.NotificationFeedbackType.Success);
  }, [playFeedback]);

  const missed = useCallback(async () => {
    await playFeedback("missed", Haptics.ImpactFeedbackStyle.Light);
  }, [playFeedback]);

  const foul = useCallback(async () => {
    await playFeedback("foul", Haptics.ImpactFeedbackStyle.Medium);
  }, [playFeedback]);

  const foulOut = useCallback(async () => {
    await playFeedback("foulOut", Haptics.NotificationFeedbackType.Error);
  }, [playFeedback]);

  const timeout = useCallback(async () => {
    await playFeedback("timeout", Haptics.ImpactFeedbackStyle.Heavy);
  }, [playFeedback]);

  const overtime = useCallback(async () => {
    await playFeedback("overtime", Haptics.NotificationFeedbackType.Warning);
  }, [playFeedback]);

  const buzzer = useCallback(async () => {
    await playFeedback("buzzer", Haptics.NotificationFeedbackType.Warning);
  }, [playFeedback]);

  const whistle = useCallback(async () => {
    await playFeedback("whistle", Haptics.ImpactFeedbackStyle.Heavy);
  }, [playFeedback]);

  const success = useCallback(async () => {
    if (enableHaptics) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [enableHaptics]);

  const error = useCallback(async () => {
    if (enableHaptics) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [enableHaptics]);

  const selection = useCallback(async () => {
    if (enableHaptics) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [enableHaptics]);

  return {
    made,
    missed,
    foul,
    foulOut,
    timeout,
    overtime,
    buzzer,
    whistle,
    success,
    error,
    selection,
    setSoundEnabled,
    isSoundEnabled: getSoundEnabled,
  };
}

export default useSoundFeedback;
