import { useWindowDimensions } from "react-native";
import { DEVICE_BREAKPOINTS, TABLET_LAYOUT } from "@basketball-stats/shared";

export type DeviceType = "phone" | "tablet" | "largeTablet";

export interface DeviceInfo {
  /** The detected device type based on screen dimensions */
  deviceType: DeviceType;
  /** Convenience boolean for tablet detection (tablet or largeTablet) */
  isTablet: boolean;
  /** Whether device is in landscape orientation */
  isLandscape: boolean;
  /** Maximum court height for current device and orientation */
  courtMaxHeight: number;
  /** Maximum court width for current device and orientation */
  courtMaxWidth: number;
  /** Button panel width for landscape mode */
  buttonPanelWidth: number;
  /** Stat button heights for current device */
  statButtonCompactHeight: number;
  statButtonNormalHeight: number;
  /** Raw screen dimensions */
  screenWidth: number;
  screenHeight: number;
}

/**
 * Hook that detects device type (phone/tablet/largeTablet) and provides
 * device-aware layout values for adaptive UI.
 *
 * Device classification is based on the SHORTER screen dimension so that
 * tablets are detected correctly in both portrait and landscape orientations.
 *
 * Breakpoints:
 * - Phone: shorter dimension < 600dp
 * - Tablet: shorter dimension >= 600dp
 * - Large Tablet: shorter dimension >= 900dp
 */
export function useDeviceType(): DeviceInfo {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Use the shorter dimension for device classification
  // This ensures tablets are detected correctly in both orientations
  const shortDimension = Math.min(screenWidth, screenHeight);
  const isLandscape = screenWidth > screenHeight;

  // Determine device type
  let deviceType: DeviceType;
  if (shortDimension >= DEVICE_BREAKPOINTS.largeTablet) {
    deviceType = "largeTablet";
  } else if (shortDimension >= DEVICE_BREAKPOINTS.tablet) {
    deviceType = "tablet";
  } else {
    deviceType = "phone";
  }

  const isTablet = deviceType === "tablet" || deviceType === "largeTablet";

  // Get layout values for current device type
  const courtConfig = TABLET_LAYOUT.court[deviceType];
  const buttonPanelWidth = TABLET_LAYOUT.buttonPanel[deviceType];
  const statButtonConfig = TABLET_LAYOUT.statButton[deviceType];

  // Get court sizing based on orientation
  const courtMaxHeight = isLandscape
    ? courtConfig.maxHeightLandscape
    : courtConfig.maxWidthPortrait; // In portrait, maxWidth acts as the limit
  const courtMaxWidth = courtConfig.maxWidthPortrait;

  return {
    deviceType,
    isTablet,
    isLandscape,
    courtMaxHeight,
    courtMaxWidth,
    buttonPanelWidth,
    statButtonCompactHeight: statButtonConfig.compact,
    statButtonNormalHeight: statButtonConfig.normal,
    screenWidth,
    screenHeight,
  };
}

export default useDeviceType;
