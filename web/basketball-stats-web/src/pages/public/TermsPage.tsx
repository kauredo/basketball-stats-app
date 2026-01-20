import SEOHead from "../../components/seo/SEOHead";

export default function TermsPage() {
  return (
    <>
      <SEOHead
        title="Terms of Service"
        description="Read the terms and conditions for using Basketball Stats services."
      />

      <section className="bg-white dark:bg-gray-900 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Terms of Service
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Last updated: January 2025</p>
          </div>

          {/* Content */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
            <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  1. Acceptance of Terms
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  By accessing and using Basketball Stats, you accept and agree to be bound by the
                  terms and provisions of this agreement. If you do not agree to these terms, please
                  do not use our services.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  2. Description of Service
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Basketball Stats provides a platform for tracking, recording, and analyzing
                  basketball game statistics. Our services include live game tracking, statistical
                  analysis, team management, and related features accessible through our website and
                  mobile applications.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  3. User Accounts
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  When you create an account with us, you must provide accurate, complete, and
                  current information. You are responsible for:
                </p>
                <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1">
                  <li>Maintaining the confidentiality of your account credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Notifying us immediately of any unauthorized use</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  4. Acceptable Use
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  You agree not to use the service to:
                </p>
                <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe upon the rights of others</li>
                  <li>Transmit harmful code or interfere with the service</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Use the service for any unlawful or fraudulent purpose</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  5. Intellectual Property
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  The service and its original content, features, and functionality are owned by
                  Basketball Stats and are protected by international copyright, trademark, patent,
                  trade secret, and other intellectual property laws. You retain ownership of any
                  data you input into the service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  6. Termination
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  We may terminate or suspend your account immediately, without prior notice or
                  liability, for any reason, including breach of these Terms. Upon termination, your
                  right to use the service will immediately cease. You may also delete your account
                  at any time through your account settings.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  7. Limitation of Liability
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  In no event shall Basketball Stats, its directors, employees, partners, agents,
                  suppliers, or affiliates be liable for any indirect, incidental, special,
                  consequential, or punitive damages, including loss of profits, data, or other
                  intangible losses, resulting from your use of the service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  8. Changes to Terms
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  We reserve the right to modify or replace these terms at any time. If a revision
                  is material, we will try to provide at least 30 days&apos; notice prior to any new
                  terms taking effect. Continued use of the service after changes constitutes
                  acceptance of the new terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  9. Contact Us
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  If you have any questions about these Terms, please contact us at{" "}
                  <a
                    href="mailto:legal@basketballstats.app"
                    className="text-orange-600 hover:text-orange-500"
                  >
                    legal@basketballstats.app
                  </a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
