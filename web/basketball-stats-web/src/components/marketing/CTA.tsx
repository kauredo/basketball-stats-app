import { Link } from "react-router-dom";
import Icon from "../Icon";

export default function CTA() {
  return (
    <section className="py-24 bg-white dark:bg-surface-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-primary-600 px-8 py-16 sm:px-16 sm:py-20">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary-500 opacity-50" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-primary-700 opacity-50" />
          </div>

          <div className="relative text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Elevate Your Game?
            </h2>
            <p className="text-lg text-primary-100 max-w-2xl mx-auto mb-8">
              Start tracking your team's performance today. Record live game stats, analyze player
              data, and gain insights to take your game to the next level.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 text-base font-medium text-primary-600 bg-white hover:bg-primary-50 rounded-lg transition-colors"
              >
                Start Tracking Free
                <Icon name="arrow-right" size={20} className="ml-2" />
              </Link>
              <Link
                to="/faq"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white border-2 border-white/30 hover:border-white/50 rounded-lg transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
