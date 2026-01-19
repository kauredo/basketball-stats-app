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
    <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onSelectQuarter(tab.value)}
          className={`
            px-2 py-1 rounded text-xs font-medium transition-all
            ${
              selectedQuarter === tab.value
                ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
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
