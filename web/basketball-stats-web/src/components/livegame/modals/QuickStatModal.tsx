import React, { useRef } from "react";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import type { PlayerStat, StatType } from "../../../types/livegame";
import { BaseModal, ModalBody, ModalFooter, ModalCancelButton } from "../../ui/BaseModal";
import { PlayerListEmpty } from "../../ui/PlayerListItem";

interface QuickStatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecord: (playerId: Id<"players">) => void;
  statType: StatType | null;
  onCourtPlayers: PlayerStat[];
  homeTeamName?: string;
  awayTeamName?: string;
}

const STAT_INFO: Record<StatType, { label: string; bgClass: string; badgeClass: string }> = {
  assist: {
    label: "Assist",
    bgClass: "bg-purple-600",
    badgeClass: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
  },
  steal: {
    label: "Steal",
    bgClass: "bg-cyan-600",
    badgeClass: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300",
  },
  block: {
    label: "Block",
    bgClass: "bg-cyan-600",
    badgeClass: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300",
  },
  turnover: {
    label: "Turnover",
    bgClass: "bg-amber-600",
    badgeClass: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
  },
  foul: {
    label: "Foul",
    bgClass: "bg-red-600",
    badgeClass: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
  },
  freethrow: {
    label: "Free Throw",
    bgClass: "bg-green-600",
    badgeClass: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
  },
  rebound: {
    label: "Rebound",
    bgClass: "bg-blue-600",
    badgeClass: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  },
  shot2: {
    label: "2-Point Shot",
    bgClass: "bg-blue-600",
    badgeClass: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  },
  shot3: {
    label: "3-Point Shot",
    bgClass: "bg-purple-600",
    badgeClass: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
  },
};

const getStatInfo = (type: StatType) => {
  return (
    STAT_INFO[type] || {
      label: type,
      bgClass: "bg-surface-600",
      badgeClass: "bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300",
    }
  );
};

/**
 * Generic modal for recording non-shot stats like rebounds, assists, steals, etc.
 * Shows list of on-court players for selection.
 */
export const QuickStatModal: React.FC<QuickStatModalProps> = ({
  isOpen,
  onClose,
  onRecord,
  statType,
  onCourtPlayers,
  homeTeamName = "Home",
  awayTeamName = "Away",
}) => {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  if (!statType) return null;

  const { label, bgClass, badgeClass } = getStatInfo(statType);

  // Group players by team
  const homePlayers = onCourtPlayers.filter((p) => p.isHomeTeam);
  const awayPlayers = onCourtPlayers.filter((p) => !p.isHomeTeam);

  const renderPlayer = (player: PlayerStat) => {
    // Team-specific avatar colors: home = blue, away = orange
    const avatarBg = player.isHomeTeam
      ? "bg-blue-600"
      : "bg-orange-500";

    return (
      <button
        key={player.id}
        onClick={() => onRecord(player.playerId)}
        className="w-full flex items-center justify-between px-4 py-3 border-b border-surface-100 dark:border-surface-700 last:border-0 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${avatarBg} rounded-full flex items-center justify-center flex-shrink-0`}>
            <span className="text-white font-bold text-sm">#{player.player?.number}</span>
          </div>
          <div className="text-left">
            <div className="text-surface-900 dark:text-white font-medium text-sm">
              {player.player?.name}
            </div>
            <div className="text-surface-500 text-xs">
              {player.points} PTS
            </div>
          </div>
        </div>
        <div className={`px-3 py-1 text-sm font-medium rounded-lg ${badgeClass}`}>
          +{label.toUpperCase().slice(0, 3)}
        </div>
      </button>
    );
  };

  const renderTeamSection = (players: PlayerStat[], teamName: string, isHome: boolean) => {
    if (players.length === 0) return null;

    const headerBg = isHome
      ? "bg-blue-100 dark:bg-blue-900/30"
      : "bg-orange-100 dark:bg-orange-900/30";
    const headerText = isHome
      ? "text-blue-700 dark:text-blue-300"
      : "text-orange-700 dark:text-orange-300";

    return (
      <div key={isHome ? "home" : "away"}>
        <div className={`px-4 py-2 ${headerBg}`}>
          <span className={`text-xs font-bold uppercase tracking-wide ${headerText}`}>
            {teamName}
          </span>
        </div>
        {players.map(renderPlayer)}
      </div>
    );
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record ${label}`}
      initialFocusRef={cancelButtonRef}
    >
      {/* Custom header with dynamic background color */}
      <div className={`px-6 py-4 ${bgClass}`}>
        <h3 className="text-lg font-bold text-white">Record {label}</h3>
        <p className="text-white/80 text-sm">Select a player</p>
      </div>

      <ModalBody maxHeight="max-h-80">
        {onCourtPlayers.length === 0 ? (
          <PlayerListEmpty message="No players on court" />
        ) : (
          <>
            {renderTeamSection(homePlayers, homeTeamName, true)}
            {renderTeamSection(awayPlayers, awayTeamName, false)}
          </>
        )}
      </ModalBody>

      <ModalFooter>
        <ModalCancelButton onClick={onClose} />
      </ModalFooter>
    </BaseModal>
  );
};

export default QuickStatModal;
