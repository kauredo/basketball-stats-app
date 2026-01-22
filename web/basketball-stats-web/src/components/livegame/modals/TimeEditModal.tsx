import React, { useState, useEffect, useRef } from "react";
import {
  BaseModal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCancelButton,
} from "../../ui/BaseModal";

interface TimeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Current time in seconds (can include decimals for shot clock) */
  currentSeconds: number;
  /** Maximum time in seconds (for validation) */
  maxSeconds?: number;
  /** Callback when time is saved */
  onSave: (seconds: number) => void;
  /** Modal title */
  title: string;
  /** Whether this is a game clock (MM:SS) or shot clock (SS.T - seconds.tenths) */
  mode: "game" | "shot";
}

/**
 * Modal for manually editing game clock or shot clock time
 * - Game clock: MM:SS format (minutes:seconds)
 * - Shot clock: SS.T format (seconds.tenths)
 */
export function TimeEditModal({
  isOpen,
  onClose,
  currentSeconds,
  maxSeconds,
  onSave,
  title,
  mode,
}: TimeEditModalProps) {
  // For game clock: minutes and seconds
  // For shot clock: seconds and tenths
  const [primaryValue, setPrimaryValue] = useState(0);
  const [secondaryValue, setSecondaryValue] = useState(0);
  const primaryRef = useRef<HTMLInputElement>(null);
  const secondaryRef = useRef<HTMLInputElement>(null);

  // Initialize values when modal opens
  useEffect(() => {
    if (isOpen) {
      if (mode === "game") {
        // Game clock: minutes:seconds
        setPrimaryValue(Math.floor(currentSeconds / 60));
        setSecondaryValue(Math.floor(currentSeconds % 60));
      } else {
        // Shot clock: seconds.tenths
        const wholeSec = Math.floor(currentSeconds);
        const tenths = Math.floor((currentSeconds - wholeSec) * 10);
        setPrimaryValue(Math.min(wholeSec, maxSeconds ?? 24));
        setSecondaryValue(tenths);
      }
    }
  }, [isOpen, currentSeconds, mode, maxSeconds]);

  const handleSave = () => {
    let totalSeconds: number;

    if (mode === "game") {
      // Game clock: minutes * 60 + seconds
      totalSeconds = primaryValue * 60 + secondaryValue;
    } else {
      // Shot clock: seconds + tenths/10
      totalSeconds = primaryValue + secondaryValue / 10;
    }

    // Enforce max if provided
    if (maxSeconds !== undefined) {
      totalSeconds = Math.min(totalSeconds, maxSeconds);
    }

    totalSeconds = Math.max(0, totalSeconds);
    onSave(totalSeconds);
    onClose();
  };

  const handlePrimaryChange = (value: string) => {
    const num = parseInt(value) || 0;
    if (mode === "game") {
      // Minutes: 0-99
      setPrimaryValue(Math.max(0, Math.min(99, num)));
    } else {
      // Seconds: 0-maxSeconds (default 24)
      setPrimaryValue(Math.max(0, Math.min(maxSeconds ?? 24, num)));
    }
  };

  const handleSecondaryChange = (value: string) => {
    const num = parseInt(value) || 0;
    if (mode === "game") {
      // Seconds: 0-59
      setSecondaryValue(Math.max(0, Math.min(59, num)));
    } else {
      // Tenths: 0-9
      setSecondaryValue(Math.max(0, Math.min(9, num)));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    }
  };

  // Quick set buttons for shot clock (sets to full seconds, 0 tenths)
  const shotClockPresets = [24, 14, 10, 5];

  const handlePreset = (value: number) => {
    setPrimaryValue(value);
    setSecondaryValue(0);
  };

  // Format current time for display
  const formatCurrentTime = () => {
    if (mode === "game") {
      const mins = Math.floor(currentSeconds / 60);
      const secs = Math.floor(currentSeconds % 60);
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    } else {
      const wholeSec = Math.floor(currentSeconds);
      const tenths = Math.floor((currentSeconds - wholeSec) * 10);
      return `${wholeSec}.${tenths}`;
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="sm"
      initialFocusRef={primaryRef}
    >
      <ModalHeader title={title} />
      <ModalBody padding="lg" scrollable={false}>
        <div className="space-y-4">
          {/* Time input */}
          <div className="flex items-center justify-center gap-2">
            <div className="flex flex-col items-center">
              <input
                ref={primaryRef}
                type="number"
                min="0"
                max={mode === "game" ? 99 : (maxSeconds ?? 24)}
                value={primaryValue}
                onChange={(e) => handlePrimaryChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-20 h-16 text-center text-3xl font-mono font-bold bg-surface-100 dark:bg-surface-700 border border-surface-300 dark:border-surface-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-surface-900 dark:text-white"
              />
              <span className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                {mode === "game" ? "MIN" : "SEC"}
              </span>
            </div>
            <span className="text-3xl font-bold text-surface-400 dark:text-surface-500 pb-5">
              {mode === "game" ? ":" : "."}
            </span>
            <div className="flex flex-col items-center">
              <input
                ref={secondaryRef}
                type="number"
                min="0"
                max={mode === "game" ? 59 : 9}
                value={secondaryValue}
                onChange={(e) => handleSecondaryChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className={`h-16 text-center text-3xl font-mono font-bold bg-surface-100 dark:bg-surface-700 border border-surface-300 dark:border-surface-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-surface-900 dark:text-white ${
                  mode === "game" ? "w-20" : "w-14"
                }`}
              />
              <span className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                {mode === "game" ? "SEC" : "TENTHS"}
              </span>
            </div>
          </div>

          {/* Quick presets for shot clock */}
          {mode === "shot" && (
            <div className="flex justify-center gap-2">
              {shotClockPresets.map((preset) => (
                <button
                  key={preset}
                  onClick={() => handlePreset(preset)}
                  className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                    primaryValue === preset && secondaryValue === 0
                      ? "bg-primary-500 text-white"
                      : "bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-300 dark:hover:bg-surface-600"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          )}

          {/* Current time display */}
          <p className="text-center text-sm text-surface-500 dark:text-surface-400">
            Current: {formatCurrentTime()}
          </p>
        </div>
      </ModalBody>
      <ModalFooter align="between">
        <ModalCancelButton onClick={onClose} />
        <button
          onClick={handleSave}
          className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Set Time
        </button>
      </ModalFooter>
    </BaseModal>
  );
}

export default TimeEditModal;
