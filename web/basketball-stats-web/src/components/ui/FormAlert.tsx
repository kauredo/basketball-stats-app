import React from "react";
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

type AlertType = "error" | "success" | "warning" | "info";

interface FormAlertProps {
  /** Alert message */
  message: string | null | undefined;
  /** Alert type determines color scheme */
  type?: AlertType;
  /** Whether to show an icon */
  showIcon?: boolean;
  /** Additional className */
  className?: string;
}

const alertStyles: Record<AlertType, string> = {
  error:
    "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800 text-red-800 dark:text-red-300",
  success:
    "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300",
  warning:
    "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300",
  info: "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300",
};

const alertIcons: Record<AlertType, React.FC<{ className?: string }>> = {
  error: XCircleIcon,
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
};

/**
 * FormAlert - Consistent alert component for form feedback
 *
 * Features:
 * - Four variants: error, success, warning, info
 * - Optional icon
 * - Proper accessibility attributes
 * - Dark mode support
 *
 * @example
 * <FormAlert message={error} type="error" />
 * <FormAlert message="Saved successfully!" type="success" />
 */
export function FormAlert({
  message,
  type = "error",
  showIcon = true,
  className = "",
}: FormAlertProps) {
  if (!message) return null;

  const Icon = alertIcons[type];

  return (
    <div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      className={`border px-4 py-3 rounded-xl flex items-start gap-3 ${alertStyles[type]} ${className}`}
    >
      {showIcon && <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />}
      <span className="text-sm">{message}</span>
    </div>
  );
}

/**
 * FormFieldError - Inline error message for form fields
 */
export function FormFieldError({
  message,
  className = "",
}: {
  message: string | null | undefined;
  className?: string;
}) {
  if (!message) return null;

  return (
    <p className={`mt-1.5 text-sm text-red-600 dark:text-red-400 ${className}`} role="alert">
      {message}
    </p>
  );
}

/**
 * FormFieldHint - Helper text for form fields
 */
export function FormFieldHint({
  message,
  className = "",
}: {
  message: string;
  className?: string;
}) {
  return (
    <p className={`mt-1.5 text-sm text-surface-500 dark:text-surface-400 ${className}`}>
      {message}
    </p>
  );
}

export default FormAlert;
