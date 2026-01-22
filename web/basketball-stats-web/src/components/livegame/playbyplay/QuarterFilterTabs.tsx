import React from "react";

interface QuarterFilterTabsProps {
  currentQuarter: number;
  selectedQuarter: number | "all";
  onSelectQuarter: (quarter: number | "all") => void;
}

/**
 * Pill-style tabs for filtering play-by-play events by quarter.
 * Matches mobile design with dynamic OT support.
 */
export const QuarterFilterTabs: React.FC<QuarterFilterTabsProps> = ({
  currentQuarter,
  selectedQuarter,
  onSelectQuarter,
}) => {
  // Dynamic quarter tabs based on current quarter (supports OT)
  const numPeriods = Math.max(4, currentQuarter);
  const tabs: { value: number | "all"; label: string }[] = [
    { value: "all", label: "All" },
    { value: 1, label: "Q1" },
    { value: 2, label: "Q2" },
    { value: 3, label: "Q3" },
    { value: 4, label: "Q4" },
  ];

  // Add dynamic OT tabs
  for (let i = 5; i <= numPeriods; i++) {
    tabs.push({ value: i, label: `OT${i - 4}` });
  }

  return (
    <div
      className="flex items-center gap-2 px-3 py-2"
      role="tablist"
      aria-label="Filter by quarter"
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onSelectQuarter(tab.value)}
          role="tab"
          aria-selected={selectedQuarter === tab.value}
          aria-controls={`quarter-panel-${tab.value}`}
          className={`
            px-3 py-1.5 rounded-full text-xs font-semibold transition-all
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1
            ${
              selectedQuarter === tab.value
                ? "bg-primary-500 text-white"
                : "bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-300 dark:hover:bg-surface-600"
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
