import { Link } from "react-router-dom";
import SEOHead from "../../components/seo/SEOHead";
import Icon, { IconName } from "../../components/Icon";

interface Feature {
  icon: IconName;
  title: string;
  description: string;
  details: string[];
}

const features: Feature[] = [
  {
    icon: "play",
    title: "Live Game Tracking",
    description: "Record stats in real-time with an interface designed for the pace of live games.",
    details: [
      "Large touch targets for quick, accurate input",
      "Instant visual feedback on every action",
      "Track points, rebounds, assists, steals, blocks, turnovers, and fouls",
      "Quarter and game clock management",
      "Undo recent actions to fix mistakes",
    ],
  },
  {
    icon: "target",
    title: "Shot Charts",
    description: "Visualize shooting patterns with interactive court maps.",
    details: [
      "Tap court location to record shot attempts",
      "Color-coded made vs missed shots",
      "2-point and 3-point shot tracking",
      "Heat maps showing hot and cold zones",
      "Filter by player, quarter, or game",
    ],
  },
  {
    icon: "stats",
    title: "Player Statistics",
    description: "Comprehensive stats for every player across all games.",
    details: [
      "Per-game averages and totals",
      "Shooting percentages (FG%, 3P%, FT%)",
      "Advanced metrics and efficiency ratings",
      "Season-long trend tracking",
      "Individual player detail pages",
    ],
  },
  {
    icon: "activity",
    title: "Player Comparison",
    description: "Compare any players side-by-side to identify strengths.",
    details: [
      "Select any players from your league",
      "Compare across all statistical categories",
      "Visual bar charts for easy comparison",
      "Identify top performers at each position",
      "Track improvement over time",
    ],
  },
  {
    icon: "users",
    title: "Team Management",
    description: "Organize your teams, rosters, and staff in one place.",
    details: [
      "Create and manage multiple teams",
      "Add players with jersey numbers and positions",
      "Track player details (height, weight, birth date)",
      "Team-level statistics and records",
      "Easy roster updates throughout the season",
    ],
  },
  {
    icon: "trophy",
    title: "League Standings",
    description: "Automatic standings calculation based on game results.",
    details: [
      "Real-time standings updates",
      "Win/loss records and percentages",
      "Points for/against tracking",
      "Configurable tiebreaker rules",
      "Season and division support",
    ],
  },
  {
    icon: "users",
    title: "Role-Based Access",
    description: "Invite your team with appropriate permission levels.",
    details: [
      "Admin: Full league control",
      "Coach: Manage team roster and games",
      "Scorekeeper: Record live game stats",
      "Viewer: Read-only access to stats",
      "Easy invite codes for new members",
    ],
  },
  {
    icon: "activity",
    title: "Game Analysis",
    description: "Review games with detailed breakdowns and insights.",
    details: [
      "Complete play-by-play history",
      "Quarter-by-quarter scoring",
      "Individual player box scores",
      "Shot chart visualization per game",
      "Export game data to CSV",
    ],
  },
];

const comingSoon = [
  { title: "iOS App", description: "Native app optimized for courtside use" },
  { title: "Android App", description: "Full-featured mobile experience" },
  { title: "Advanced Analytics", description: "Deeper insights and trends" },
  { title: "Video Integration", description: "Link stats to game footage" },
];

export default function FeaturesPage() {
  return (
    <>
      <SEOHead
        title="Features"
        description="Explore all the features of Basketball Stats: live game tracking, shot charts, player statistics, team management, league standings, and more."
        keywords="basketball stats features, game tracking, shot charts, player statistics, team management, league standings"
        canonicalUrl="https://basketballstatsapp.com/features"
      />

      {/* Hero */}
      <section className="bg-white dark:bg-surface-900 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-surface-900 dark:text-white mb-6">
              Everything You Need to
              <span className="block text-primary-600">Track Basketball Stats</span>
            </h1>
            <p className="text-lg text-surface-600 dark:text-surface-400">
              From live game tracking to detailed analytics, Basketball Stats gives coaches and
              scorekeepers the tools they need to capture every play and analyze team performance.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6 sm:p-8"
              >
                <div className="flex items-start mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mr-4 flex-shrink-0">
                    <Icon name={feature.icon} size={24} className="text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-surface-900 dark:text-white">
                      {feature.title}
                    </h2>
                    <p className="text-surface-600 dark:text-surface-400 mt-1">
                      {feature.description}
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 ml-16">
                  {feature.details.map((detail) => (
                    <li key={detail} className="flex items-start text-sm">
                      <Icon
                        name="check"
                        size={16}
                        className="text-green-500 mr-2 mt-0.5 flex-shrink-0"
                      />
                      <span className="text-surface-600 dark:text-surface-400">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Coming Soon */}
          <div className="bg-surface-50 dark:bg-surface-800/50 rounded-2xl p-8 sm:p-10 mb-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
                Coming Soon
              </h2>
              <p className="text-surface-600 dark:text-surface-400">
                We're actively developing new features based on user feedback.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {comingSoon.map((item) => (
                <div
                  key={item.title}
                  className="bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 p-4"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 mr-2">
                      Soon
                    </span>
                    <h3 className="font-semibold text-surface-900 dark:text-white">{item.title}</h3>
                  </div>
                  <p className="text-sm text-surface-600 dark:text-surface-400">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">
              Ready to get started?
            </h2>
            <p className="text-surface-600 dark:text-surface-400 mb-6">
              All features are free during our beta period. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
              >
                Start Tracking Free
                <Icon name="arrow-right" size={20} className="ml-2" />
              </Link>
              <Link
                to="/pricing"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 text-base font-medium text-surface-700 dark:text-surface-300 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-lg transition-colors"
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
