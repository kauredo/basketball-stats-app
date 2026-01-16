// Input component utilities and styles
// This provides consistent input styling across platforms

export interface InputProps {
  variant?: "default" | "outlined" | "filled";
  size?: "sm" | "md" | "lg";
  error?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

export const getInputStyles = (props: InputProps = {}) => {
  const {
    variant = "default",
    size = "md",
    error = false,
    disabled = false,
    fullWidth = false,
  } = props;

  const baseClasses = [
    "transition-colors duration-200",
    "focus:outline-none focus:ring-2 focus:ring-offset-1",
    fullWidth ? "w-full" : "",
    disabled ? "opacity-50 cursor-not-allowed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const sizeClasses = {
    sm: "px-3 py-2 text-sm rounded-md",
    md: "px-4 py-2.5 text-sm rounded-lg",
    lg: "px-4 py-3 text-base rounded-lg",
  };

  const variantClasses = {
    default: [
      "bg-white dark:bg-dark-800",
      "border border-gray-300 dark:border-dark-600",
      error
        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
        : "focus:border-primary-500 focus:ring-primary-500",
      "text-gray-900 dark:text-white",
      "placeholder-gray-500 dark:placeholder-gray-400",
    ].join(" "),

    outlined: [
      "bg-transparent",
      "border-2",
      error
        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
        : "border-gray-300 dark:border-dark-600 focus:border-primary-500 focus:ring-primary-500",
      "text-gray-900 dark:text-white",
      "placeholder-gray-500 dark:placeholder-gray-400",
    ].join(" "),

    filled: [
      "bg-gray-100 dark:bg-dark-700",
      "border border-transparent",
      error
        ? "bg-red-50 dark:bg-red-900/20 focus:ring-red-500"
        : "focus:bg-white dark:focus:bg-dark-800 focus:ring-primary-500",
      "text-gray-900 dark:text-white",
      "placeholder-gray-500 dark:placeholder-gray-400",
    ].join(" "),
  };

  return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]}`;
};

export const getLabelStyles = (error: boolean = false, disabled: boolean = false) => {
  return [
    "block text-sm font-medium mb-2",
    error ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-gray-300",
    disabled ? "opacity-50" : "",
  ]
    .filter(Boolean)
    .join(" ");
};

export const getErrorStyles = () => {
  return "mt-1 text-sm text-red-600 dark:text-red-400";
};

export const getHelpTextStyles = () => {
  return "mt-1 text-sm text-gray-500 dark:text-gray-400";
};
