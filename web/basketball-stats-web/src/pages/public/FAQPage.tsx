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
      <section className="bg-white dark:bg-gray-900 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Everything you need to know about Basketball Stats. Can&apos;t find the answer you&apos;re
              looking for? Feel free to contact our support team.
            </p>
          </div>

          {/* FAQ Accordion */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
            <FAQAccordion items={faqData} />
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Still have questions? We&apos;re here to help.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
              >
                Get Started Free
                <Icon name="arrow-right" size={20} className="ml-2" />
              </Link>
              <a
                href="mailto:support@basketballstats.app"
                className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
