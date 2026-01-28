import React, { useEffect, useRef } from "react";
import { useFocusTrap } from "../../hooks/useFocusTrap";

interface BaseModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal title for accessibility */
  title: string;
  /** Modal content */
  children: React.ReactNode;
  /** Maximum width variant */
  maxWidth?: "sm" | "md" | "lg" | "xl";
  /** Whether clicking the backdrop closes the modal */
  closeOnBackdropClick?: boolean;
  /** Whether pressing Escape closes the modal */
  closeOnEscape?: boolean;
  /** Optional ref to the element that should receive initial focus */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  /** Additional className for the modal container */
  className?: string;
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

/**
 * BaseModal - Foundation component for all modal dialogs
 *
 * Features:
 * - Focus trap for keyboard accessibility
 * - Escape key to close
 * - Click outside to close
 * - Proper ARIA attributes
 * - Dark mode support
 * - Consistent styling across all modals
 *
 * @example
 * <BaseModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   title="Confirm Action"
 * >
 *   <ModalHeader title="Confirm Action" subtitle="Are you sure?" />
 *   <ModalBody>Content here</ModalBody>
 *   <ModalFooter>
 *     <button onClick={onClose}>Cancel</button>
 *   </ModalFooter>
 * </BaseModal>
 */
export function BaseModal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "md",
  closeOnBackdropClick = true,
  closeOnEscape = true,
  initialFocusRef,
  className = "",
}: BaseModalProps) {
  const focusTrapRef = useFocusTrap(isOpen, { initialFocusRef });

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 sm:p-6 !mt-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={handleBackdropClick}
    >
      <div
        ref={focusTrapRef}
        className={`bg-white dark:bg-surface-800 rounded-2xl w-full ${maxWidthClasses[maxWidth]} border border-surface-200 dark:border-surface-700 overflow-hidden animate-scale-in ${className}`}
      >
        {/* Hidden title for screen readers if not using ModalHeader */}
        <h2 id="modal-title" className="sr-only">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}

interface ModalHeaderProps {
  /** Main title text */
  title: string;
  /** Optional subtitle text or element */
  subtitle?: React.ReactNode;
  /** Optional badge content (e.g., "+3 PTS") */
  badge?: React.ReactNode;
  /** Background color variant */
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "info";
  /** Whether to show a border at the bottom */
  bordered?: boolean;
}

const headerVariants = {
  default: "bg-surface-50 dark:bg-surface-900",
  primary: "bg-primary-600",
  success: "bg-status-completed",
  warning: "bg-status-paused",
  danger: "bg-status-active",
  info: "bg-status-scheduled",
};

const headerTextVariants = {
  default: {
    title: "text-surface-900 dark:text-white",
    subtitle: "text-surface-500 dark:text-surface-400",
  },
  primary: { title: "text-white", subtitle: "text-primary-200" },
  success: { title: "text-white", subtitle: "text-emerald-200" },
  warning: { title: "text-white", subtitle: "text-amber-200" },
  danger: { title: "text-white", subtitle: "text-red-200" },
  info: { title: "text-white", subtitle: "text-blue-200" },
};

/**
 * ModalHeader - Consistent header for modal dialogs
 */
export function ModalHeader({
  title,
  subtitle,
  badge,
  variant = "default",
  bordered = true,
}: ModalHeaderProps) {
  const textColors = headerTextVariants[variant];

  return (
    <div
      className={`px-6 py-4 ${headerVariants[variant]} ${
        bordered && variant === "default"
          ? "border-b border-surface-200 dark:border-surface-700"
          : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 id="modal-title" className={`text-lg font-bold ${textColors.title}`}>
            {title}
          </h3>
          {subtitle && <p className={`text-sm ${textColors.subtitle}`}>{subtitle}</p>}
        </div>
        {badge}
      </div>
    </div>
  );
}

interface ModalBodyProps {
  children: React.ReactNode;
  /** Whether content should scroll */
  scrollable?: boolean;
  /** Max height when scrollable */
  maxHeight?: string;
  /** Padding variant */
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
}

const bodyPadding = {
  none: "",
  sm: "p-2",
  md: "p-4",
  lg: "p-6",
};

/**
 * ModalBody - Content area for modal dialogs
 */
export function ModalBody({
  children,
  scrollable = true,
  maxHeight = "max-h-80",
  padding = "none",
  className = "",
}: ModalBodyProps) {
  return (
    <div
      className={`${scrollable ? `${maxHeight} overflow-y-auto` : ""} ${bodyPadding[padding]} ${className}`}
    >
      {children}
    </div>
  );
}

interface ModalFooterProps {
  children: React.ReactNode;
  /** Alignment of footer content */
  align?: "left" | "center" | "right" | "between";
  className?: string;
}

const footerAlign = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
  between: "justify-between",
};

/**
 * ModalFooter - Footer area for modal actions
 */
export function ModalFooter({ children, align = "center", className = "" }: ModalFooterProps) {
  return (
    <div
      className={`px-4 py-3 bg-surface-50 dark:bg-surface-900 border-t border-surface-200 dark:border-surface-700 flex ${footerAlign[align]} gap-2 ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * ModalCancelButton - Standard cancel button for modal footers
 */
export function ModalCancelButton({
  onClick,
  children = "Cancel",
}: {
  onClick: () => void;
  children?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="px-6 py-2.5 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-50 dark:focus:ring-offset-surface-900 rounded"
    >
      {children}
    </button>
  );
}

export default BaseModal;
