import React from "react";

interface QuarterFilterTabsProps {
  currentQuarter: number;
  selectedQuarter: number | "all";
  onSelectQuarter: (quarter: number | "all") => void;
}

/**
 * Tabs for filtering play-by-play events by quarter.
 */
export const QuarterFilterTabs: React.FC<QuarterFilterTabsProps> = ({
  currentQuarter,
  selectedQuarter,
  onSelectQuarter,
}) => {
  const quarters = Math.max(4, currentQuarter);
  const tabs: { value: number | "all"; label: string }[] = [
    { value: "all", label: "All" },
    ...Array.from({ length: quarters }, (_, i) => ({
      value: i + 1,
      label: i < 4 ? `Q${i + 1}` : `OT${i - 3}`,
    })),
  ];

  return (
    <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg" role="tablist" aria-label="Filter by quarter">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onSelectQuarter(tab.value)}
          role="tab"
          aria-selected={selectedQuarter === tab.value}
          aria-controls={`quarter-panel-${tab.value}`}
          className={`
            min-h-[44px] min-w-[44px] px-3 py-2 rounded text-sm font-medium transition-all
            focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1
            ${
              selectedQuarter === tab.value
                ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-600/50"
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default QuarterFilterTabs;
