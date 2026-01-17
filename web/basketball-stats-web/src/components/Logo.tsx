import React from "react";

interface LogoProps {
  variant?: "light" | "dark" | "auto";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
}

const sizeMap = {
  sm: { width: 24, height: 24, textSize: "text-sm" },
  md: { width: 32, height: 32, textSize: "text-base" },
  lg: { width: 40, height: 40, textSize: "text-lg" },
  xl: { width: 48, height: 48, textSize: "text-xl" },
};

/**
 * Logo component with dark/light theme support
 *
 * - variant="light": Use light logo (for dark backgrounds)
 * - variant="dark": Use dark logo (for light backgrounds)
 * - variant="auto": Automatically select based on system/app theme
 *
 * Logo files should be placed in /public/assets/:
 * - logo.png (dark logo for light backgrounds)
 * - logo-light.png (light logo for dark backgrounds)
 */
export default function Logo({
  variant = "light",
  size = "md",
  className = "",
  showText = true,
}: LogoProps) {
  const { width, height, textSize } = sizeMap[size];

  // For auto variant, we'd check theme context here
  // Currently defaulting to light (for dark backgrounds) since app is dark theme
  const effectiveVariant = variant === "auto" ? "light" : variant;

  // logo.png = dark logo (for light backgrounds)
  // logo-light.png = light logo (for dark backgrounds)
  const logoSrc = effectiveVariant === "light" ? "/assets/logo-light.png" : "/assets/logo.png";

  return (
    <div className={`flex items-center ${className}`}>
      <img
        src={logoSrc}
        alt="Basketball Stats"
        width={width}
        height={height}
        className="object-contain"
        onError={(e) => {
          // Fallback to text if image fails to load
          e.currentTarget.style.display = "none";
        }}
      />
      {showText && (
        <span className={`ml-2 font-bold text-gray-900 dark:text-white ${textSize}`}>
          Basketball Stats
        </span>
      )}
    </div>
  );
}

// Compact logo without text
export function LogoIcon({
  variant = "light",
  size = "md",
  className = "",
}: Omit<LogoProps, "showText">) {
  return <Logo variant={variant} size={size} className={className} showText={false} />;
}
