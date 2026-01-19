import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from "expo-audio";

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
// In production, you would load actual .mp3 files from assets/sounds/

let soundEnabled = true;
let volume = 1.0;

// Cache for loaded sounds
const soundCache: Map<SoundType, AudioPlayer | null> = new Map();

// Initialize audio mode for mobile
export async function initializeAudio(): Promise<void> {
  try {
    await setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldRouteThroughEarpiece: false,
    });
  } catch (error) {
    console.warn("Failed to initialize audio:", error);
  }
}

// Load sound (placeholder - would load from assets in production)
async function loadSound(type: SoundType): Promise<AudioPlayer | null> {
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
  // const player = createAudioPlayer(soundFiles[type]);

  // For now, return null - haptics will provide feedback
  soundCache.set(type, null);
  return null;
}

export async function playSound(type: SoundType): Promise<void> {
  if (!soundEnabled) return;

  try {
    const player = await loadSound(type);
    if (player) {
      player.volume = volume;
      player.seekTo(0);
      player.play();
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

// Cleanup function to release all sounds
export async function unloadAllSounds(): Promise<void> {
  for (const [_, player] of soundCache) {
    if (player) {
      try {
        player.release();
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
