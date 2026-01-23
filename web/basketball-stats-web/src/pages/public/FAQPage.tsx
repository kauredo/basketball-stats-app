import { Link } from "react-router-dom";
import SEOHead from "../../components/seo/SEOHead";
import FAQAccordion from "../../components/marketing/FAQAccordion";
import { faqData } from "../../data/faq";
import Icon from "../../components/Icon";

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Basketball Stats?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Basketball Stats is a comprehensive platform for tracking and analyzing basketball game statistics. It allows coaches, players, and enthusiasts to record live game data, manage teams and leagues, and gain insights through advanced analytics like shot charts and player comparisons.",
      },
    },
    {
      "@type": "Question",
      name: "Is Basketball Stats free to use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes! Basketball Stats is currently free to use during our beta period. All core features including game tracking, team management, statistics, and analytics are available at no cost.",
      },
    },
    {
      "@type": "Question",
      name: "Can I track stats during a live game?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutely! Our live game tracking feature is designed for real-time stat recording. You can track points, rebounds, assists, steals, blocks, turnovers, fouls, and more as the game happens. The interface is optimized for quick input with large touch targets.",
      },
    },
    {
      "@type": "Question",
      name: "Is there a mobile app?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We're actively developing mobile apps for iOS and Android. The web application is fully responsive and works great on mobile browsers in the meantime. Sign up for updates to be notified when our mobile apps launch!",
      },
    },
    {
      "@type": "Question",
      name: "Is my data secure?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We take data security seriously. All data is encrypted in transit using HTTPS and at rest using industry-standard encryption. Your team and player data is private by default and only accessible to authorized members of your league.",
      },
    },
  ],
};

export default function FAQPage() {
  return (
    <>
      <SEOHead
        title="Frequently Asked Questions"
        description="Find answers to common questions about Basketball Stats, including features, pricing, mobile support, and more."
        keywords="basketball stats FAQ, help, support, questions, basketball app help"
        canonicalUrl="https://basketballstatsapp.com/faq"
        jsonLd={faqSchema}
      />

      {/* Header */}
      <section className="bg-white dark:bg-surface-900 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-surface-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-surface-600 dark:text-surface-400">
              Everything you need to know about Basketball Stats. Can't find the answer you're
              looking for? Feel free to contact our support team.
            </p>
          </div>

          {/* FAQ Accordion */}
          <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6 sm:p-8">
            <FAQAccordion items={faqData} />
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <p className="text-surface-600 dark:text-surface-400 mb-4">
              Still have questions? We're here to help.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
              >
                Get Started Free
                <Icon name="arrow-right" size={20} className="ml-2" />
              </Link>
              <a
                href="mailto:support@basketballstatsapp.com"
                className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-surface-700 dark:text-surface-300 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-lg transition-colors"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
