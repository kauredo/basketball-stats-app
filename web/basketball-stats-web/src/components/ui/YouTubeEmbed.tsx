import { extractYouTubeId, getYouTubeEmbedUrl } from "@basketball-stats/shared";

interface YouTubeEmbedProps {
  url: string;
  title?: string;
  className?: string;
}

export function YouTubeEmbed({
  url,
  title = "Game Video",
  className = "",
}: YouTubeEmbedProps) {
  const videoId = extractYouTubeId(url);

  if (!videoId) {
    return (
      <div className={`bg-surface-100 dark:bg-surface-800 rounded-lg p-4 text-center text-surface-500 ${className}`}>
        Invalid YouTube URL
      </div>
    );
  }

  const embedUrl = getYouTubeEmbedUrl(videoId, { rel: false });

  return (
    <div className={`relative w-full ${className}`}>
      <div className="aspect-video">
        <iframe
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full rounded-lg"
        />
      </div>
    </div>
  );
}
