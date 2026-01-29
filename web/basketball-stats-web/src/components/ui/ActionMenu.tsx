import React, { useState, useRef, useEffect } from "react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";

export interface ActionMenuItem {
  /** Unique identifier for the action */
  id: string;
  /** Display label */
  label: string;
  /** Icon component to show before label */
  icon?: React.ComponentType<{ className?: string }>;
  /** Click handler */
  onClick: () => void;
  /** Visual variant for destructive actions */
  variant?: "default" | "danger";
  /** Whether this item is disabled */
  disabled?: boolean;
}

interface ActionMenuProps {
  /** Array of menu items to display */
  items: ActionMenuItem[];
  /** Accessible label for the trigger button */
  ariaLabel?: string;
  /** Position of the dropdown relative to the trigger */
  position?: "left" | "right";
  /** Size variant */
  size?: "sm" | "md";
}

/**
 * ActionMenu - A three-dots dropdown menu for secondary actions
 *
 * Features:
 * - Keyboard accessible (Enter/Space to open, Escape to close, arrow keys to navigate)
 * - Click outside to close
 * - Proper focus management
 * - Touch-friendly targets (44px minimum)
 * - Dark mode support
 *
 * @example
 * <ActionMenu
 *   ariaLabel="Player actions"
 *   items={[
 *     { id: "edit", label: "Edit", icon: PencilIcon, onClick: handleEdit },
 *     { id: "delete", label: "Delete", icon: TrashIcon, onClick: handleDelete, variant: "danger" },
 *   ]}
 * />
 */
export function ActionMenu({
  items,
  ariaLabel = "Actions",
  position = "right",
  size = "md",
}: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        triggerRef.current?.focus();
        break;
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev + 1 >= items.length ? 0 : prev + 1;
          itemRefs.current[next]?.focus();
          return next;
        });
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev - 1 < 0 ? items.length - 1 : prev - 1;
          itemRefs.current[next]?.focus();
          return next;
        });
        break;
      case "Tab":
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
    }
  };

  // Focus first item when menu opens
  useEffect(() => {
    if (isOpen && focusedIndex >= 0) {
      itemRefs.current[focusedIndex]?.focus();
    }
  }, [isOpen, focusedIndex]);

  const handleItemClick = (item: ActionMenuItem) => {
    if (item.disabled) return;
    item.onClick();
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  const sizeClasses = {
    sm: "p-2",
    md: "p-2.5",
  };

  const iconSizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setFocusedIndex(0);
        }}
        onKeyDown={handleKeyDown}
        className={`${sizeClasses[size]} text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-surface-800`}
        aria-label={ariaLabel}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <EllipsisVerticalIcon className={iconSizeClasses[size]} />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          className={`absolute z-50 mt-1 ${position === "right" ? "right-0" : "left-0"} min-w-[160px] bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-lg py-1 animate-fade-in`}
          onKeyDown={handleKeyDown}
        >
          {items.map((item, index) => {
            const Icon = item.icon;
            const isDisabled = item.disabled;
            const isDanger = item.variant === "danger";

            return (
              <button
                key={item.id}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                type="button"
                role="menuitem"
                tabIndex={focusedIndex === index ? 0 : -1}
                onClick={() => handleItemClick(item)}
                disabled={isDisabled}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500
                  ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                  ${
                    isDanger
                      ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 focus:bg-red-50 dark:focus:bg-red-900/20"
                      : "text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 focus:bg-surface-100 dark:focus:bg-surface-700"
                  }
                `}
              >
                {Icon && (
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${isDanger ? "text-red-500 dark:text-red-400" : "text-surface-400 dark:text-surface-500"}`}
                  />
                )}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ActionMenu;
