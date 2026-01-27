import { useState, useEffect } from "react";

/**
 * Hook to detect if viewport is below a breakpoint.
 * Default breakpoint is 1024px (Tailwind's `lg`) to match existing grid behavior.
 *
 * Usage:
 * - `useIsMobile()` - returns true when viewport < 1024px
 * - `useIsMobile(768)` - returns true when viewport < 768px
 */
export function useIsMobile(breakpoint: number = 1024): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isMobile;
}
