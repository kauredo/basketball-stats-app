import { Audio } from "expo-av";

export type SoundType =
  | "made"
  | "missed"
  | "foul"
  | "foulOut"
  | "timeout"
  | "overtime"
  | "buzzer"
  | "whistle";

// Sound configuration
// Using Audio.Sound.createAsync with generated tones since we don't have actual sound files
// In production, you would load actual .mp3 files from assets/sounds/

let soundEnabled = true;
let volume = 1.0;

// Cache for loaded sounds
const soundCache: Map<SoundType, Audio.Sound | null> = new Map();

// Initialize audio mode for mobile
export async function initializeAudio(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  } catch (error) {
    console.warn("Failed to initialize audio:", error);
  }
}

// Generate a simple beep sound programmatically
// In production, replace with actual sound file loading
async function createBeepSound(frequency: number, duration: number): Promise<Audio.Sound | null> {
  try {
    // Note: In a production app, you would load actual sound files:
    // const { sound } = await Audio.Sound.createAsync(require('../../assets/sounds/made.mp3'));
    // For now, we'll just return null and rely on haptics for feedback
    return null;
  } catch (error) {
    console.warn("Failed to create sound:", error);
    return null;
  }
}

// Load sound (placeholder - would load from assets in production)
async function loadSound(type: SoundType): Promise<Audio.Sound | null> {
  if (soundCache.has(type)) {
    return soundCache.get(type) || null;
  }

  // In production, you would load actual sound files like:
  // const soundFiles: Record<SoundType, any> = {
  //   made: require('../../assets/sounds/made.mp3'),
  //   missed: require('../../assets/sounds/missed.mp3'),
  //   foul: require('../../assets/sounds/foul.mp3'),
  //   foulOut: require('../../assets/sounds/foulOut.mp3'),
  //   timeout: require('../../assets/sounds/timeout.mp3'),
  //   overtime: require('../../assets/sounds/overtime.mp3'),
  //   buzzer: require('../../assets/sounds/buzzer.mp3'),
  //   whistle: require('../../assets/sounds/whistle.mp3'),
  // };
  // const { sound } = await Audio.Sound.createAsync(soundFiles[type]);

  // For now, return null - haptics will provide feedback
  soundCache.set(type, null);
  return null;
}

export async function playSound(type: SoundType): Promise<void> {
  if (!soundEnabled) return;

  try {
    const sound = await loadSound(type);
    if (sound) {
      await sound.setVolumeAsync(volume);
      await sound.setPositionAsync(0);
      await sound.playAsync();
    }
  } catch (error) {
    console.warn(`Failed to play sound ${type}:`, error);
  }
}

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
}

export function getSoundEnabled(): boolean {
  return soundEnabled;
}

export function setVolume(vol: number): void {
  volume = Math.max(0, Math.min(1, vol));
}

export function getVolume(): number {
  return volume;
}

// Cleanup function to unload all sounds
export async function unloadAllSounds(): Promise<void> {
  for (const [_, sound] of soundCache) {
    if (sound) {
      try {
        await sound.unloadAsync();
      } catch (error) {
        console.warn("Failed to unload sound:", error);
      }
    }
  }
  soundCache.clear();
}

// Preload all sounds for faster playback
export async function preloadSounds(): Promise<void> {
  const soundTypes: SoundType[] = [
    "made",
    "missed",
    "foul",
    "foulOut",
    "timeout",
    "overtime",
    "buzzer",
    "whistle",
  ];

  await Promise.all(soundTypes.map((type) => loadSound(type)));
}

export default {
  initializeAudio,
  playSound,
  setSoundEnabled,
  getSoundEnabled,
  setVolume,
  getVolume,
  unloadAllSounds,
  preloadSounds,
};
