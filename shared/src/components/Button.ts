// Button component utilities and styles
// This provides consistent styling for buttons across platforms

export interface ButtonProps {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

// Base button classes that work with both Tailwind (web) and NativeWind (mobile)
export const getButtonStyles = (props: ButtonProps = {}) => {
  const {
    variant = "primary",
    size = "md",
    disabled = false,
    loading = false,
    fullWidth = false,
  } = props;

  const baseClasses = [
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200",
    "focus:outline-none focus:ring-2 focus:ring-offset-2",
    fullWidth ? "w-full" : "",
    disabled || loading ? "opacity-50 cursor-not-allowed" : "active:transform active:scale-95",
  ]
    .filter(Boolean)
    .join(" ");

  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const variantClasses = {
    primary: [
      "bg-primary-500 text-white",
      disabled || loading ? "" : "hover:bg-primary-600 active:bg-primary-700",
      "focus:ring-primary-500",
    ].join(" "),

    secondary: [
      "bg-transparent border border-gray-300 text-gray-700",
      "dark:border-gray-600 dark:text-gray-300",
      disabled || loading ? "" : "hover:bg-gray-50 dark:hover:bg-gray-800",
      "focus:ring-primary-500",
    ].join(" "),

    danger: [
      "bg-red-600 text-white",
      disabled || loading ? "" : "hover:bg-red-700 active:bg-red-800",
      "focus:ring-red-500",
    ].join(" "),

    ghost: [
      "bg-transparent text-gray-600 dark:text-gray-400",
      disabled || loading ? "" : "hover:bg-gray-100 dark:hover:bg-gray-800",
      "focus:ring-primary-500",
    ].join(" "),
  };

  return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]}`;
};

// Loading spinner classes
export const getSpinnerStyles = (size: "sm" | "md" | "lg" = "md") => {
  const sizeMap = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return `${sizeMap[size]} animate-spin rounded-full border-2 border-transparent border-t-current border-r-current`;
};

// Icon size utilities
export const getIconSize = (size: "sm" | "md" | "lg" = "md") => {
  const sizeMap = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return sizeMap[size];
};
