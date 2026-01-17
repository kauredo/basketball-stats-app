import Icon, { IconName } from "../Icon";

interface Feature {
  icon: IconName;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: "play",
    title: "Live Game Tracking",
    description:
      "Record stats in real-time during games with our intuitive interface. Track points, rebounds, assists, and more.",
  },
  {
    icon: "stats",
    title: "Advanced Analytics",
    description:
      "Get detailed insights into player and team performance with comprehensive statistical analysis.",
  },
  {
    icon: "users",
    title: "Team Management",
    description:
      "Easily manage multiple teams, players, and leagues all in one place with role-based access.",
  },
  {
    icon: "trophy",
    title: "League Standings",
    description:
      "Automatic standings calculation with customizable point systems and tiebreaker rules.",
  },
  {
    icon: "target",
    title: "Shot Charts",
    description:
      "Visualize shooting patterns with interactive shot charts showing made and missed attempts.",
  },
  {
    icon: "activity",
    title: "Player Comparison",
    description:
      "Compare player statistics side-by-side to identify strengths and areas for improvement.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-gray-50 dark:bg-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Everything You Need to Track Basketball Stats
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Powerful features designed for coaches, players, and basketball enthusiasts.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700 transition-colors group"
            >
              <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors">
                <Icon name={feature.icon} size={24} className="text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
