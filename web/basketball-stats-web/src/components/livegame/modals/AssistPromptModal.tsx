import React, { useRef } from "react";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { PlayerStat } from "../../../types/livegame";
import { BaseModal, ModalHeader, ModalBody, ModalFooter } from "../../ui/BaseModal";
import { PlayerListEmpty } from "../../ui/PlayerListItem";

interface AssistPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssist: (playerId: Id<"players">) => void;
  onNoAssist: () => void;
  scorerName: string;
  scorerNumber: number;
  shotType: string;
  points: number;
  teammates: PlayerStat[];
}

/**
 * Modal that appears after a made shot to record an assist.
 * Shows scorer info and list of teammates to select the assister.
 */
export const AssistPromptModal: React.FC<AssistPromptModalProps> = ({
  isOpen,
  onClose,
  onAssist,
  onNoAssist,
  scorerName,
  scorerNumber,
  points,
  teammates,
}) => {
  const noAssistButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Assist?"
      initialFocusRef={noAssistButtonRef}
    >
      <ModalHeader
        title="Assist?"
        subtitle={`#${scorerNumber} ${scorerName} scored ${points}PT`}
        variant="success"
        badge={
          <div className="px-3 py-1 bg-white/20 rounded-full text-white text-sm font-bold">
            +{points} PTS
          </div>
        }
      />

      <ModalBody maxHeight="max-h-80">
        {/* Section header */}
        <div className="px-4 py-2 bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700">
          <span className="text-xs text-surface-500 uppercase">Who assisted?</span>
        </div>

        {teammates.length === 0 ? (
          <PlayerListEmpty message="No other players on court" />
        ) : (
          teammates.map((player) => (
            <button
              key={player.id}
              onClick={() => onAssist(player.playerId)}
              className="w-full flex items-center justify-between px-4 py-3 border-b border-surface-100 dark:border-surface-700 last:border-0 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">#{player.player?.number}</span>
                </div>
                <div className="text-left">
                  <div className="text-surface-900 dark:text-white font-medium text-sm">
                    {player.player?.name}
                  </div>
                  <div className="text-surface-500 text-xs">{player.assists} AST</div>
                </div>
              </div>
              <div className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium rounded-lg">
                +AST
              </div>
            </button>
          ))
        )}
      </ModalBody>

      <ModalFooter align="between" className="gap-2">
        <button
          ref={noAssistButtonRef}
          onClick={onNoAssist}
          className="flex-1 py-2.5 bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300 font-medium rounded-lg hover:bg-surface-300 dark:hover:bg-surface-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-50 dark:focus:ring-offset-surface-900"
        >
          No Assist
        </button>
        <button
          onClick={onClose}
          className="flex-1 py-2.5 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-50 dark:focus:ring-offset-surface-900"
        >
          Cancel
        </button>
      </ModalFooter>
    </BaseModal>
  );
};

export default AssistPromptModal;
