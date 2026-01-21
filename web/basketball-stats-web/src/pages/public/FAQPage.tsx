import { Link } from "react-router-dom";
import SEOHead from "../../components/seo/SEOHead";
import FAQAccordion from "../../components/marketing/FAQAccordion";
import { faqData } from "../../data/faq";
import Icon from "../../components/Icon";

export default function FAQPage() {
  return (
    <>
      <SEOHead
        title="Frequently Asked Questions"
        description="Find answers to common questions about Basketball Stats, including features, pricing, mobile support, and more."
        keywords="basketball stats FAQ, help, support, questions, basketball app help"
      />

      {/* Header */}
      <section className="bg-white dark:bg-surface-900 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-surface-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-surface-600 dark:text-surface-400">
              Everything you need to know about Basketball Stats. Can&apos;t find the answer
              you&apos;re looking for? Feel free to contact our support team.
            </p>
          </div>

          {/* FAQ Accordion */}
          <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6 sm:p-8">
            <FAQAccordion items={faqData} />
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <p className="text-surface-600 dark:text-surface-400 mb-4">
              Still have questions? We&apos;re here to help.
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
                href="mailto:support@basketballstats.app"
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
