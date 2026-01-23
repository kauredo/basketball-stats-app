import { Link } from "react-router-dom";
import SEOHead from "../../components/seo/SEOHead";
import Icon from "../../components/Icon";

const values = [
  {
    icon: "play",
    title: "Speed First",
    description:
      "Every tap matters during a live game. We obsess over making stat recording as fast as possible.",
  },
  {
    icon: "stats",
    title: "Data Clarity",
    description:
      "Numbers tell stories. We present statistics clearly so you can make informed decisions.",
  },
  {
    icon: "users",
    title: "Team Focused",
    description:
      "Basketball is a team sport. Our tools help everyone contribute, from coaches to scorekeepers.",
  },
];

const forWho = [
  {
    title: "Coaches",
    description:
      "Make data-driven decisions about lineups, substitutions, and strategy based on real performance data.",
  },
  {
    title: "Scorekeepers",
    description:
      "Record stats quickly and accurately with an interface designed for the pace of live games.",
  },
  {
    title: "League Administrators",
    description:
      "Manage multiple teams, track standings, and keep everyone organized throughout the season.",
  },
  {
    title: "Players & Parents",
    description:
      "Track individual progress, identify areas for improvement, and celebrate achievements.",
  },
];

export default function AboutPage() {
  return (
    <>
      <SEOHead
        title="About Us"
        description="Learn about Basketball Stats - the platform built by basketball enthusiasts for coaches, players, and fans who want to track and analyze game statistics."
        keywords="about basketball stats, basketball tracking app, sports statistics platform, coaching tools"
        canonicalUrl="https://basketballstatsapp.com/about"
      />

      {/* Hero Section */}
      <section className="bg-white dark:bg-surface-900 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-sm font-medium mb-6">
              Currently in Beta
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-surface-900 dark:text-white mb-6">
              Professional Stats Tracking
              <span className="block text-primary-600">For Every Level of Play</span>
            </h1>
            <p className="text-lg text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
              Basketball Stats brings the analytical tools used by professional teams to youth
              leagues, recreational leagues, and competitive programs everywhere.
            </p>
          </div>

          {/* Mission */}
          <div className="bg-surface-50 dark:bg-surface-800/50 rounded-2xl p-8 sm:p-10 mb-16">
            <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">
              Our Mission
            </h2>
            <p className="text-lg text-surface-600 dark:text-surface-400 mb-6">
              We believe every basketball team deserves access to the same quality of statistical
              analysis that NBA teams use. Our mission is to democratize basketball analytics by
              building tools that are powerful enough for serious analysis, yet simple enough to use
              courtside during a fast-paced game.
            </p>
            <p className="text-surface-600 dark:text-surface-400">
              Whether you're coaching a middle school team, running a recreational league, or
              managing a competitive travel program, Basketball Stats gives you the insights you
              need to help your players improve and your team succeed.
            </p>
          </div>

          {/* Our Story */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-6">Our Story</h2>
            <div className="space-y-4 text-surface-600 dark:text-surface-400">
              <p>
                Basketball Stats started with a simple frustration: why is it so hard to track game
                statistics without expensive software or clunky spreadsheets?
              </p>
              <p>
                As coaches and developers who love the game, we found ourselves scribbling stats on
                paper, losing track of who had how many fouls, and spending hours after games trying
                to make sense of our notes. We knew there had to be a better way.
              </p>
              <p>
                So we built one. We designed Basketball Stats from the ground up for the reality of
                live games: big touch targets for quick input, instant feedback so you know your tap
                registered, and smart defaults that minimize the number of decisions you need to
                make in the moment.
              </p>
              <p>
                Today, we're in beta and actively developing new features based on feedback from
                coaches and scorekeepers like you. Every feature we build is tested courtside, in
                real games, because that's where it matters.
              </p>
            </div>
          </div>

          {/* Values */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-8 text-center">
              What We Value
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {values.map((value) => (
                <div
                  key={value.title}
                  className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                    <Icon name={value.icon as any} size={20} className="text-primary-600" />
                  </div>
                  <h3 className="font-semibold text-surface-900 dark:text-white mb-2">
                    {value.title}
                  </h3>
                  <p className="text-sm text-surface-600 dark:text-surface-400">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Who It's For */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-8 text-center">
              Built For
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {forWho.map((item) => (
                <div
                  key={item.title}
                  className="flex items-start p-4 bg-surface-50 dark:bg-surface-800/50 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mr-4 flex-shrink-0 mt-0.5">
                    <Icon name="check" size={14} className="text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-surface-900 dark:text-white mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-surface-600 dark:text-surface-400">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Beta Note */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 mb-16">
            <div className="flex items-start">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mr-4 flex-shrink-0">
                <Icon name="activity" size={20} className="text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">
                  We're in Beta
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-300 mb-3">
                  Basketball Stats is actively being developed. We're adding new features regularly
                  and would love your feedback. During beta, all features are free to use.
                </p>
                <Link
                  to="/contact"
                  className="text-sm font-medium text-amber-700 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300"
                >
                  Share your feedback →
                </Link>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">
              Ready to elevate your game?
            </h2>
            <p className="text-surface-600 dark:text-surface-400 mb-6">
              Join coaches and scorekeepers who are already using Basketball Stats to track their
              teams.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
              >
                Get Started Free
                <Icon name="arrow-right" size={20} className="ml-2" />
              </Link>
              <Link
                to="/pricing"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-base font-medium text-surface-700 dark:text-surface-300 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-lg transition-colors"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
