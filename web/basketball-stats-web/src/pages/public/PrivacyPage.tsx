import SEOHead from "../../components/seo/SEOHead";

export default function PrivacyPage() {
  return (
    <>
      <SEOHead
        title="Privacy Policy"
        description="Learn how Basketball Stats collects, uses, and protects your personal information."
      />

      <section className="bg-white dark:bg-gray-900 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Privacy Policy
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: January 2025
            </p>
          </div>

          {/* Content */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
            <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  1. Information We Collect
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  We collect information you provide directly to us, such as when you create an
                  account, use our services, or contact us for support.
                </p>
                <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1">
                  <li>Account information (name, email address, password)</li>
                  <li>Profile information (team affiliations, role)</li>
                  <li>Game and statistics data you input</li>
                  <li>Communications with our support team</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  2. How We Use Your Information
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  We use the information we collect to:
                </p>
                <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Send technical notices, updates, and support messages</li>
                  <li>Respond to your comments, questions, and requests</li>
                  <li>Monitor and analyze trends, usage, and activities</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  3. Information Sharing
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  We do not sell, trade, or otherwise transfer your personal information to outside
                  parties. This does not include trusted third parties who assist us in operating
                  our website, conducting our business, or servicing you, so long as those parties
                  agree to keep this information confidential.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  4. Data Security
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  We implement appropriate technical and organizational security measures to protect
                  your personal information against unauthorized access, alteration, disclosure, or
                  destruction. All data is encrypted in transit and at rest using industry-standard
                  encryption protocols.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  5. Your Rights
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  You have the right to:
                </p>
                <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1">
                  <li>Access and receive a copy of your personal data</li>
                  <li>Rectify or update your personal information</li>
                  <li>Request deletion of your personal data</li>
                  <li>Object to processing of your personal information</li>
                  <li>Data portability</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  6. Cookies
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  We use cookies and similar tracking technologies to track activity on our service
                  and hold certain information. Cookies are files with a small amount of data which
                  may include an anonymous unique identifier. You can instruct your browser to
                  refuse all cookies or to indicate when a cookie is being sent.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  7. Contact Us
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  If you have any questions about this Privacy Policy, please contact us at{" "}
                  <a
                    href="mailto:privacy@basketballstats.app"
                    className="text-orange-600 hover:text-orange-500"
                  >
                    privacy@basketballstats.app
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
