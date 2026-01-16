// Modal component utilities and styles
// This provides consistent modal styling across platforms

export interface ModalProps {
  size?: "sm" | "md" | "lg" | "xl" | "full";
  variant?: "default" | "centered" | "drawer";
  backdrop?: "default" | "blur" | "dark";
}

export const getModalBackdropStyles = (backdrop: "default" | "blur" | "dark" = "default") => {
  const baseClasses = "fixed inset-0 z-50 flex items-center justify-center p-4";

  const backdropMap = {
    default: "bg-black/50",
    blur: "bg-black/30 backdrop-blur-sm",
    dark: "bg-black/70",
  };

  return `${baseClasses} ${backdropMap[backdrop]}`;
};

export const getModalContainerStyles = (props: ModalProps = {}) => {
  const { size = "md", variant = "default" } = props;

  const baseClasses = [
    "relative w-full",
    "bg-white dark:bg-dark-800",
    "rounded-lg shadow-xl",
    "border border-gray-200 dark:border-dark-700",
    "animate-fade-in",
  ].join(" ");

  const sizeMap = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
    full: "max-w-full h-full",
  };

  const variantClasses = {
    default: "max-h-[90vh] overflow-hidden",
    centered: "max-h-[90vh] overflow-hidden",
    drawer: "h-full",
  };

  return `${baseClasses} ${sizeMap[size]} ${variantClasses[variant]}`;
};

export const getModalHeaderStyles = () => {
  return [
    "flex items-center justify-between",
    "p-6 pb-4",
    "border-b border-gray-200 dark:border-dark-700",
  ].join(" ");
};

export const getModalTitleStyles = () => {
  return "text-lg font-semibold text-gray-900 dark:text-white";
};

export const getModalCloseButtonStyles = () => {
  return [
    "p-2 -m-2",
    "text-gray-400 hover:text-gray-600",
    "dark:text-gray-500 dark:hover:text-gray-300",
    "rounded-lg transition-colors",
    "hover:bg-gray-100 dark:hover:bg-dark-700",
  ].join(" ");
};

export const getModalBodyStyles = (scrollable: boolean = true) => {
  return ["p-6", scrollable ? "overflow-y-auto max-h-96" : ""].filter(Boolean).join(" ");
};

export const getModalFooterStyles = () => {
  return [
    "flex justify-end space-x-3",
    "p-6 pt-4",
    "border-t border-gray-200 dark:border-dark-700",
  ].join(" ");
};

// Form modal specific styles
export const getFormSectionStyles = () => {
  return "space-y-4";
};

export const getFormFieldStyles = () => {
  return "space-y-2";
};

export const getFormGridStyles = (cols: 2 | 3 = 2) => {
  const colsMap = {
    2: "grid grid-cols-1 md:grid-cols-2 gap-4",
    3: "grid grid-cols-1 md:grid-cols-3 gap-4",
  };

  return colsMap[cols];
};
