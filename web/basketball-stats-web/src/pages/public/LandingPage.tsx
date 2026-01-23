import SEOHead from "../../components/seo/SEOHead";
import Hero from "../../components/marketing/Hero";
import Features from "../../components/marketing/Features";
import CTA from "../../components/marketing/CTA";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Basketball Stats",
  url: "https://basketballstatsapp.com",
  logo: "https://basketballstatsapp.com/assets/logo.png",
  description:
    "Track basketball game statistics in real-time, analyze player performance, and gain insights to improve your team's game.",
  sameAs: [],
};

const softwareAppSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Basketball Stats",
  operatingSystem: "Web, iOS, Android",
  applicationCategory: "SportsApplication",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  description:
    "Track basketball game statistics in real-time, analyze player performance, and gain insights to improve your team's game.",
  featureList: [
    "Live game tracking",
    "Advanced analytics",
    "Team management",
    "League standings",
    "Shot charts",
    "Player comparison",
  ],
};

export default function LandingPage() {
  return (
    <>
      <SEOHead
        title="Track & Analyze Basketball Stats"
        description="Track basketball game statistics in real-time, analyze player performance, and gain insights to improve your team's game. Built for coaches, players, and enthusiasts."
        keywords="basketball statistics, game tracking, player analytics, sports stats, basketball app, coaching tools"
        canonicalUrl="https://basketballstatsapp.com/"
        jsonLd={{
          "@context": "https://schema.org",
          "@graph": [organizationSchema, softwareAppSchema],
        }}
      />
      <Hero />
      <Features />
      <CTA />
    </>
  );
}
