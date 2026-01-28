// Social media platform definitions for Basketball Stats App

/**
 * Social media platform definitions with metadata
 * Used for team social links forms and display
 */
export const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram", icon: "Instagram", placeholder: "https://instagram.com/teamname" },
  { key: "twitter", label: "X / Twitter", icon: "Twitter", placeholder: "https://x.com/teamname" },
  { key: "facebook", label: "Facebook", icon: "Facebook", placeholder: "https://facebook.com/teamname" },
  { key: "youtube", label: "YouTube", icon: "Youtube", placeholder: "https://youtube.com/@teamname" },
  { key: "tiktok", label: "TikTok", icon: "Music2", placeholder: "https://tiktok.com/@teamname" },
  { key: "linkedin", label: "LinkedIn", icon: "Linkedin", placeholder: "https://linkedin.com/company/teamname" },
] as const;

export type SocialPlatformKey = (typeof SOCIAL_PLATFORMS)[number]["key"];

export type SocialLinks = {
  [K in SocialPlatformKey]?: string;
};

/**
 * Get platform info by key
 */
export function getSocialPlatform(key: string) {
  return SOCIAL_PLATFORMS.find((p) => p.key === key);
}

/**
 * Validate a social media URL
 * Basic validation - checks for https and non-empty
 */
export function isValidSocialUrl(url: string | undefined): boolean {
  if (!url || url.trim() === "") return true; // Empty is valid (optional)
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Count how many social links are set
 */
export function countSocialLinks(links: SocialLinks | undefined): number {
  if (!links) return 0;
  return Object.values(links).filter((url) => url && url.trim() !== "").length;
}
