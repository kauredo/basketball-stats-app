import { Link } from "react-router-dom";
import Icon from "../Icon";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white dark:bg-gray-900">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-orange-100 dark:bg-orange-900/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-orange-50 dark:bg-orange-900/10 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-sm font-medium mb-8">
            <Icon name="basketball" size={16} className="mr-2" />
            Real-time game tracking
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white tracking-tight">
            Track Your Basketball
            <span className="block text-orange-600">Statistics Like a Pro</span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Record live game stats, analyze player performance, and gain insights to improve your
            team's game. Built for coaches, players, and basketball enthusiasts.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors shadow-lg shadow-orange-600/25"
            >
              Get Started Free
              <Icon name="arrow-right" size={20} className="ml-2" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 text-base font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Log in
            </Link>
          </div>

          {/* Feature highlights instead of vanity metrics */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { icon: "play", label: "Real-time tracking", desc: "Record stats as the game happens" },
              { icon: "stats", label: "Detailed analytics", desc: "Shot charts & player comparisons" },
              { icon: "users", label: "Team management", desc: "Multiple leagues & seasons" },
            ].map((feature) => (
              <div
                key={feature.label}
                className="p-5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-left"
              >
                <Icon name={feature.icon as any} size={24} className="text-orange-600 mb-2" />
                <div className="font-semibold text-gray-900 dark:text-white">{feature.label}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{feature.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
