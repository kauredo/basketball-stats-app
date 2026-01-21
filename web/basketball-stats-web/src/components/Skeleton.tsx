import React from "react";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: "none" | "sm" | "md" | "lg" | "full";
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  width,
  height,
  rounded = "md",
}) => {
  const roundedClass = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  }[rounded];

  return (
    <div
      className={`animate-pulse bg-surface-100 dark:bg-surface-700 ${roundedClass} ${className}`}
      style={{ width, height }}
    />
  );
};

// Skeleton Card for game cards, player cards, etc.
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div
    className={`bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700 ${className}`}
  >
    <div className="flex items-center mb-4">
      <Skeleton width={48} height={48} rounded="full" className="mr-4" />
      <div className="flex-1">
        <Skeleton height={20} className="mb-2 w-3/4" />
        <Skeleton height={16} className="w-1/2" />
      </div>
    </div>
    <div className="space-y-3">
      <Skeleton height={16} className="w-full" />
      <Skeleton height={16} className="w-5/6" />
      <Skeleton height={16} className="w-4/6" />
    </div>
  </div>
);

// Skeleton for basketball court loading state
export const SkeletonCourt: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div
    className={`bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700 ${className}`}
  >
    <Skeleton height={24} className="mb-4 w-40" />
    <div className="relative">
      <Skeleton height={280} rounded="lg" className="w-full" />
      {/* Fake court lines overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="animate-pulse text-surface-600">
          <svg viewBox="0 0 100 60" className="w-32 h-20 opacity-30">
            <rect
              x="30"
              y="0"
              width="40"
              height="30"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
            <circle cx="50" cy="30" r="10" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="50" cy="10" r="2" fill="currentColor" />
          </svg>
        </div>
      </div>
    </div>
    <div className="flex justify-center space-x-6 mt-4">
      <Skeleton width={80} height={20} />
      <Skeleton width={80} height={20} />
      <Skeleton width={80} height={20} />
    </div>
  </div>
);

// Skeleton for statistics tables
export const SkeletonTable: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 4, className = "" }) => (
  <div
    className={`bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700 ${className}`}
  >
    <Skeleton height={24} className="mb-4 w-48" />
    <div className="overflow-hidden">
      {/* Header */}
      <div className="flex border-b border-surface-200 dark:border-surface-700 pb-3 mb-3">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className={`flex-1 ${i === 0 ? "flex-[2]" : ""}`}>
            <Skeleton height={12} className={i === 0 ? "w-24" : "w-10 mx-auto"} />
          </div>
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex py-3 border-b border-surface-200/50 dark:border-surface-700/50"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className={`flex-1 ${colIndex === 0 ? "flex-[2]" : ""}`}>
              <Skeleton height={16} className={colIndex === 0 ? "w-32" : "w-8 mx-auto"} />
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

// Skeleton for game list items
export const SkeletonGameCard: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div
    className={`bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700 ${className}`}
  >
    <div className="flex items-center justify-between">
      {/* Away Team */}
      <div className="flex items-center flex-1">
        <Skeleton width={40} height={40} rounded="full" className="mr-3" />
        <div>
          <Skeleton height={16} className="w-24 mb-1" />
          <Skeleton height={12} className="w-16" />
        </div>
      </div>

      {/* Score */}
      <div className="text-center mx-4">
        <Skeleton height={12} className="w-16 mb-2 mx-auto" />
        <div className="flex items-center space-x-2">
          <Skeleton width={32} height={32} />
          <Skeleton width={12} height={20} />
          <Skeleton width={32} height={32} />
        </div>
        <Skeleton height={10} className="w-12 mt-2 mx-auto" />
      </div>

      {/* Home Team */}
      <div className="flex items-center flex-1 justify-end">
        <div className="text-right">
          <Skeleton height={16} className="w-24 mb-1 ml-auto" />
          <Skeleton height={12} className="w-16 ml-auto" />
        </div>
        <Skeleton width={40} height={40} rounded="full" className="ml-3" />
      </div>
    </div>
  </div>
);

// Skeleton for player stats row
export const SkeletonPlayerRow: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div
    className={`flex items-center py-3 border-b border-surface-200 dark:border-surface-700 ${className}`}
  >
    <Skeleton width={32} height={32} rounded="full" className="mr-3" />
    <div className="flex-1">
      <Skeleton height={16} className="w-32 mb-1" />
      <Skeleton height={12} className="w-20" />
    </div>
    <div className="flex space-x-4">
      <Skeleton width={24} height={16} />
      <Skeleton width={24} height={16} />
      <Skeleton width={24} height={16} />
    </div>
  </div>
);

// Skeleton for stat buttons grid
export const SkeletonStatButtons: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div
    className={`bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700 ${className}`}
  >
    <Skeleton height={20} className="mb-4 w-32" />
    <div className="space-y-3">
      <Skeleton height={12} className="w-16 mb-2" />
      <div className="flex space-x-2">
        <Skeleton height={56} className="flex-1" rounded="lg" />
        <Skeleton height={56} className="flex-1" rounded="lg" />
        <Skeleton height={56} className="flex-1" rounded="lg" />
        <Skeleton height={56} className="flex-1" rounded="lg" />
      </div>
      <Skeleton height={12} className="w-16 mb-2 mt-4" />
      <div className="flex space-x-2">
        <Skeleton height={56} className="flex-1" rounded="lg" />
        <Skeleton height={56} className="flex-1" rounded="lg" />
        <Skeleton height={56} className="flex-1" rounded="lg" />
        <Skeleton height={56} className="flex-1" rounded="lg" />
      </div>
    </div>
  </div>
);

// Full page loading skeleton
export const SkeletonPage: React.FC = () => (
  <div className="min-h-screen bg-surface-50 dark:bg-surface-900 p-6">
    {/* Header */}
    <div className="flex items-center justify-between mb-6">
      <Skeleton height={32} className="w-48" />
      <div className="flex space-x-3">
        <Skeleton width={100} height={40} rounded="lg" />
        <Skeleton width={100} height={40} rounded="lg" />
      </div>
    </div>

    {/* Content Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SkeletonCourt />
      <SkeletonStatButtons />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <SkeletonTable rows={5} columns={4} />
      <SkeletonTable rows={5} columns={4} />
    </div>
  </div>
);

export default Skeleton;
