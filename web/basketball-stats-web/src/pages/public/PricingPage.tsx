import { Link } from "react-router-dom";
import SEOHead from "../../components/seo/SEOHead";
import Icon from "../../components/Icon";

const features = [
  { name: "Live game tracking", included: true },
  { name: "Shot charts with location mapping", included: true },
  { name: "Player statistics & averages", included: true },
  { name: "Team management", included: true },
  { name: "League standings", included: true },
  { name: "Player comparison tools", included: true },
  { name: "Role-based access control", included: true },
  { name: "CSV data export", included: true },
  { name: "Unlimited games", included: true },
  { name: "Unlimited players", included: true },
];

const comingSoon = [
  { name: "iOS mobile app", status: "In Development" },
  { name: "Android mobile app", status: "In Development" },
  { name: "Advanced analytics dashboard", status: "Planned" },
  { name: "Season-over-season comparisons", status: "Planned" },
];

export default function PricingPage() {
  return (
    <>
      <SEOHead
        title="Pricing"
        description="Basketball Stats is free during our beta period. Get access to all features including live game tracking, shot charts, and analytics at no cost."
        keywords="basketball stats pricing, free basketball app, sports tracking cost, basketball analytics pricing"
        canonicalUrl="https://basketballstatsapp.com/pricing"
      />

      <section className="bg-white dark:bg-surface-900 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium mb-6">
              <Icon name="check" size={16} className="mr-2" />
              Free During Beta
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-surface-900 dark:text-white mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
              We're in beta and focused on building the best basketball stats platform. During this
              period, all features are completely free.
            </p>
          </div>

          {/* Pricing Card */}
          <div className="max-w-lg mx-auto mb-16">
            <div className="bg-white dark:bg-surface-800 rounded-2xl border-2 border-primary-500 shadow-xl overflow-hidden">
              {/* Card Header */}
              <div className="bg-primary-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Beta Access</h2>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium text-white">
                    Current Plan
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 sm:p-8">
                {/* Price */}
                <div className="flex items-baseline mb-6">
                  <span className="text-5xl font-bold text-surface-900 dark:text-white">$0</span>
                  <span className="ml-2 text-surface-500 dark:text-surface-400">/month</span>
                </div>

                <p className="text-surface-600 dark:text-surface-400 mb-8">
                  Full access to all features while we're in beta. Help us shape the future of
                  basketball stat tracking!
                </p>

                {/* Features List */}
                <div className="space-y-3 mb-8">
                  {features.map((feature) => (
                    <div key={feature.name} className="flex items-center">
                      <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3 flex-shrink-0">
                        <Icon name="check" size={12} className="text-green-600" />
                      </div>
                      <span className="text-surface-700 dark:text-surface-300">{feature.name}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Link
                  to="/signup"
                  className="block w-full text-center px-6 py-3 text-base font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                >
                  Get Started Free
                </Link>

                <p className="text-center text-sm text-surface-500 dark:text-surface-400 mt-4">
                  No credit card required
                </p>
              </div>
            </div>
          </div>

          {/* Coming Soon Section */}
          <div className="bg-surface-50 dark:bg-surface-800/50 rounded-xl border border-surface-200 dark:border-surface-700 p-6 sm:p-8 mb-16">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mr-4">
                <Icon name="activity" size={20} className="text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
                  Coming Soon
                </h3>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  Features we're actively working on
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {comingSoon.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between p-3 bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700"
                >
                  <span className="text-surface-700 dark:text-surface-300">{item.name}</span>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-sm text-surface-500 dark:text-surface-400 mt-4">
              Want to be notified when new features launch?{" "}
              <Link to="/signup" className="text-primary-600 hover:text-primary-500 font-medium">
                Create an account
              </Link>{" "}
              and we'll keep you updated.
            </p>
          </div>

          {/* Future Pricing Note */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-3">
              What happens after beta?
            </h3>
            <p className="text-surface-600 dark:text-surface-400 max-w-2xl mx-auto mb-6">
              We plan to always offer a generous free tier for casual users and small teams. When we
              introduce paid plans, they'll be for advanced features like detailed analytics, larger
              organizations, and premium support. Beta users will be grandfathered into special
              pricing as a thank you for early support.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center text-primary-600 hover:text-primary-500 font-medium"
            >
              Have questions? Contact us
              <Icon name="arrow-right" size={16} className="ml-1" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
