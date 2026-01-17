import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: "website" | "article";
  twitterCard?: "summary" | "summary_large_image";
  canonicalUrl?: string;
}

const DEFAULT_TITLE = "Basketball Stats - Track & Analyze Your Games";
const DEFAULT_DESCRIPTION =
  "Track basketball game statistics in real-time, analyze player performance, and gain insights to improve your team's game.";
const DEFAULT_OG_IMAGE = "/assets/og-image.png";

export default function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = "basketball, statistics, analytics, sports, game tracking, player stats",
  ogImage = DEFAULT_OG_IMAGE,
  ogType = "website",
  twitterCard = "summary_large_image",
  canonicalUrl,
}: SEOHeadProps) {
  const fullTitle = title ? `${title} | Basketball Stats` : DEFAULT_TITLE;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
    </Helmet>
  );
}
