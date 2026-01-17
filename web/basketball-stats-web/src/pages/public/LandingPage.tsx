import SEOHead from "../../components/seo/SEOHead";
import Hero from "../../components/marketing/Hero";
import Features from "../../components/marketing/Features";
import CTA from "../../components/marketing/CTA";

export default function LandingPage() {
  return (
    <>
      <SEOHead
        title="Track & Analyze Basketball Stats"
        description="Track basketball game statistics in real-time, analyze player performance, and gain insights to improve your team's game. Built for coaches, players, and enthusiasts."
        keywords="basketball statistics, game tracking, player analytics, sports stats, basketball app, coaching tools"
      />
      <Hero />
      <Features />
      <CTA />
    </>
  );
}
