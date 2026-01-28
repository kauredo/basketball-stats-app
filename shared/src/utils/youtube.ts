// YouTube URL parsing utilities for Basketball Stats App

/**
 * Extract YouTube video ID from various URL formats
 * Supports:
 * - youtu.be/VIDEO_ID
 * - youtube.com/watch?v=VIDEO_ID
 * - youtube.com/embed/VIDEO_ID
 * - youtube.com/live/VIDEO_ID
 * - youtube.com/shorts/VIDEO_ID
 *
 * @param url - YouTube URL string
 * @returns Video ID string or null if not a valid YouTube URL
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;

  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Generate YouTube embed URL from video ID
 * @param videoId - YouTube video ID
 * @param options - Optional embed parameters
 * @returns Embed URL string
 */
export function getYouTubeEmbedUrl(
  videoId: string,
  options?: {
    autoplay?: boolean;
    mute?: boolean;
    start?: number;
    rel?: boolean;
  }
): string {
  const params = new URLSearchParams();

  if (options?.autoplay) params.set("autoplay", "1");
  if (options?.mute) params.set("mute", "1");
  if (options?.start) params.set("start", String(options.start));
  if (options?.rel === false) params.set("rel", "0");

  const queryString = params.toString();
  return `https://www.youtube.com/embed/${videoId}${queryString ? `?${queryString}` : ""}`;
}

/**
 * Get YouTube thumbnail URL for a video
 * @param videoId - YouTube video ID
 * @param quality - Thumbnail quality
 * @returns Thumbnail URL string
 */
export function getYouTubeThumbnailUrl(
  videoId: string,
  quality: "default" | "medium" | "high" | "maxres" = "high"
): string {
  const qualityMap = {
    default: "default",
    medium: "mqdefault",
    high: "hqdefault",
    maxres: "maxresdefault",
  };

  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

/**
 * Validate if a URL is a valid YouTube URL
 * @param url - URL string to validate
 * @returns true if valid YouTube URL
 */
export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}
