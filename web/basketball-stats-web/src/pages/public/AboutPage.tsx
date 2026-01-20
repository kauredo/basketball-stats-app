import { Link } from "react-router-dom";
import SEOHead from "../../components/seo/SEOHead";
import Icon from "../../components/Icon";

export default function AboutPage() {
  return (
    <>
      <SEOHead
        title="About Us"
        description="Learn about Basketball Stats - the platform built by basketball enthusiasts for coaches, players, and fans who want to track and analyze game statistics."
      />

      <section className="bg-white dark:bg-gray-900 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              About Basketball Stats
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Built by basketball enthusiasts, for basketball enthusiasts.
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Our Mission
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Basketball Stats was created with a simple mission: to make professional-grade
                  statistics tracking accessible to everyone. Whether you&apos;re coaching a youth
                  league, playing in a recreational league, or managing a competitive team, we
                  believe you deserve the same powerful tools that professional teams use.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  What We Offer
                </h2>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li className="flex items-start">
                    <Icon
                      name="check"
                      size={20}
                      className="text-green-500 mr-2 mt-0.5 flex-shrink-0"
                    />
                    <span>Real-time game tracking with an intuitive interface</span>
                  </li>
                  <li className="flex items-start">
                    <Icon
                      name="check"
                      size={20}
                      className="text-green-500 mr-2 mt-0.5 flex-shrink-0"
                    />
                    <span>Comprehensive player and team statistics</span>
                  </li>
                  <li className="flex items-start">
                    <Icon
                      name="check"
                      size={20}
                      className="text-green-500 mr-2 mt-0.5 flex-shrink-0"
                    />
                    <span>Visual shot charts to analyze shooting patterns</span>
                  </li>
                  <li className="flex items-start">
                    <Icon
                      name="check"
                      size={20}
                      className="text-green-500 mr-2 mt-0.5 flex-shrink-0"
                    />
                    <span>League management with automatic standings</span>
                  </li>
                  <li className="flex items-start">
                    <Icon
                      name="check"
                      size={20}
                      className="text-green-500 mr-2 mt-0.5 flex-shrink-0"
                    />
                    <span>Player comparison tools for performance analysis</span>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Our Story
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Basketball Stats started as a passion project by a group of coaches and developers
                  who were frustrated with the lack of affordable, easy-to-use statistics tracking
                  tools. We built the platform we wished existed - one that combines powerful
                  analytics with a user-friendly interface that anyone can use, even courtside
                  during a fast-paced game.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">Ready to elevate your game?</p>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
            >
              Get Started Free
              <Icon name="arrow-right" size={20} className="ml-2" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
