import React from "react";

interface PlayerInfo {
  name?: string;
  number?: number;
}

interface PlayerListItemProps {
  /** Player information */
  player: PlayerInfo | null;
  /** Optional stats to display below name */
  stats?: string;
  /** Click handler */
  onClick?: () => void;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Whether to show action buttons instead of being clickable */
  actions?: React.ReactNode;
  /** Whether this item is selected */
  selected?: boolean;
  /** Whether this item is disabled */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

const sizeConfig = {
  sm: {
    avatar: "w-8 h-8",
    avatarText: "text-xs",
    nameText: "text-sm",
    statsText: "text-xs",
    padding: "px-3 py-2",
  },
  md: {
    avatar: "w-10 h-10",
    avatarText: "text-sm",
    nameText: "text-sm",
    statsText: "text-xs",
    padding: "px-4 py-3",
  },
  lg: {
    avatar: "w-12 h-12",
    avatarText: "text-base",
    nameText: "text-base",
    statsText: "text-sm",
    padding: "px-4 py-4",
  },
};

/**
 * PlayerListItem - Reusable player row for selection lists
 *
 * Used in modals for shot recording, assists, rebounds, etc.
 *
 * @example
 * // Simple clickable player
 * <PlayerListItem
 *   player={{ name: "John Doe", number: 23 }}
 *   stats="15 PTS"
 *   onClick={() => selectPlayer(id)}
 * />
 *
 * // With action buttons
 * <PlayerListItem
 *   player={player}
 *   stats={`${player.points} PTS`}
 *   actions={
 *     <>
 *       <button onClick={() => onMade()}>MADE</button>
 *       <button onClick={() => onMissed()}>MISS</button>
 *     </>
 *   }
 * />
 */
export function PlayerListItem({
  player,
  stats,
  onClick,
  actions,
  size = "md",
  selected = false,
  disabled = false,
  className = "",
}: PlayerListItemProps) {
  const config = sizeConfig[size];
  const isClickable = !!onClick && !actions;

  const content = (
    <>
      {/* Avatar with number */}
      <div
        className={`${config.avatar} bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0`}
      >
        <span className={`text-white font-bold ${config.avatarText}`}>
          #{player?.number ?? "?"}
        </span>
      </div>

      {/* Player info */}
      <div className="flex-1 min-w-0">
        <div className={`text-surface-900 dark:text-white font-medium ${config.nameText} truncate`}>
          {player?.name ?? "Unknown Player"}
        </div>
        {stats && <div className={`text-surface-500 ${config.statsText}`}>{stats}</div>}
      </div>

      {/* Actions */}
      {actions && <div className="flex gap-2 flex-shrink-0">{actions}</div>}
    </>
  );

  const baseClassName = `flex items-center gap-3 ${config.padding} border-b border-surface-100 dark:border-surface-700 last:border-0 ${className}`;

  if (isClickable) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${baseClassName} w-full text-left transition-colors hover:bg-surface-50 dark:hover:bg-surface-700/50 focus:outline-none focus:bg-surface-100 dark:focus:bg-surface-700 ${
          selected ? "bg-primary-50 dark:bg-primary-900/20" : ""
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {content}
      </button>
    );
  }

  return <div className={baseClassName}>{content}</div>;
}

/**
 * PlayerListEmpty - Empty state for player lists
 */
export function PlayerListEmpty({ message = "No players available" }: { message?: string }) {
  return <div className="p-8 text-center text-surface-500 dark:text-surface-400">{message}</div>;
}

/**
 * MadeButton - Standard "MADE" action button
 */
export function MadeButton({
  onClick,
  disabled = false,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 bg-status-completed hover:brightness-110 text-white text-sm font-bold rounded-lg transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-status-completed focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-surface-800 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      MADE
    </button>
  );
}

/**
 * MissButton - Standard "MISS" action button
 */
export function MissButton({
  onClick,
  disabled = false,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 bg-status-active hover:brightness-110 text-white text-sm font-bold rounded-lg transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-status-active focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-surface-800 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      MISS
    </button>
  );
}

export default PlayerListItem;
