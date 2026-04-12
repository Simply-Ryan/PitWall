/**
 * Responsive Layout Utilities
 * 
 * Helpers for creating responsive, adaptive layouts that work across
 * different device sizes and orientations
 */

import { Dimensions, ScaledSize } from 'react-native';

/**
 * Get current device dimensions
 */
export const getDeviceDimensions = () => {
  return Dimensions.get('window');
};

/**
 * Device orientation type
 */
export type DeviceOrientation = 'portrait' | 'landscape';

/**
 * Get current device orientation
 */
export const getDeviceOrientation = (): DeviceOrientation => {
  const { width, height } = Dimensions.get('window');
  return width > height ? 'landscape' : 'portrait';
};

/**
 * Device size categories
 */
export type DeviceSize = 'small' | 'medium' | 'large' | 'xl';

/**
 * Categorize device by screen width
 */
export const getDeviceSize = (): DeviceSize => {
  const { width } = Dimensions.get('window');
  if (width < 375) return 'small';
  if (width < 414) return 'medium';
  if (width < 768) return 'large';
  return 'xl';
};

/**
 * Responsive text scaling
 */
export const getResponsiveFontSize = (
  baseSize: number,
  maxSize?: number
): number => {
  const { width } = Dimensions.get('window');
  const max = maxSize || baseSize * 1.5;

  // Scale font size proportionally to screen width
  const scaledSize = (baseSize * width) / 375; // 375 is iPhone 6/7/8 width

  return Math.min(scaledSize, max);
};

/**
 * Responsive spacing
 */
export const getResponsiveSpacing = (baseSpacing: number): number => {
  const { width } = Dimensions.get('window');
  const scaleFactor = Math.min(width / 375, 1.5); // Cap at 1.5x
  return Math.round(baseSpacing * scaleFactor);
};

/**
 * Get safe area padding (accounts for notches, etc.)
 */
export const getSafeAreaPadding = (
  top: number = 16,
  bottom: number = 16
): { paddingTop: number; paddingBottom: number } => {
  const { height } = Dimensions.get('window');
  // Rough estimation - in production, use react-native-safe-area-context
  const hasNotch = height > 812;

  return {
    paddingTop: hasNotch ? top + 20 : top,
    paddingBottom: hasNotch ? bottom + 10 : bottom,
  };
};

/**
 * Calculate columns for dynamic grid
 */
export const getGridColumns = (itemMinWidth: number = 150): number => {
  const { width } = Dimensions.get('window');
  const padding = 32; // Horizontal padding
  const availableWidth = width - padding;
  return Math.floor(availableWidth / itemMinWidth);
};

/**
 * Get responsive container width
 */
export const getContainerWidth = (maxWidth: number = 800): number => {
  const { width } = Dimensions.get('window');
  const padding = 32;
  const idealWidth = width - padding;
  return Math.min(idealWidth, maxWidth);
};

/**
 * Responsive breakpoints
 */
export const Breakpoints = {
  mobile: 375,
  mobileLarge: 414,
  tablet: 768,
  desktop: 1024,
};

/**
 * Check if currently on mobile device
 */
export const isMobileDevice = (): boolean => {
  const { width } = Dimensions.get('window');
  return width < Breakpoints.tablet;
};

/**
 * Check if currently on tablet
 */
export const isTabletDevice = (): boolean => {
  const { width } = Dimensions.get('window');
  return width >= Breakpoints.tablet && width < Breakpoints.desktop;
};

/**
 * Get responsive layout config
 */
export interface ResponsiveConfig {
  columns: number;
  itemWidth: number;
  padding: number;
  gap: number;
  fontSize: number;
}

export const getResponsiveConfig = (): ResponsiveConfig => {
  const size = getDeviceSize();
  const { width } = Dimensions.get('window');

  const configs: Record<DeviceSize, ResponsiveConfig> = {
    small: {
      columns: 2,
      itemWidth: (width - 32) / 2 - 4,
      padding: 12,
      gap: 8,
      fontSize: 13,
    },
    medium: {
      columns: 2,
      itemWidth: (width - 32) / 2 - 4,
      padding: 14,
      gap: 10,
      fontSize: 14,
    },
    large: {
      columns: 3,
      itemWidth: (width - 48) / 3 - 6,
      padding: 16,
      gap: 12,
      fontSize: 15,
    },
    xl: {
      columns: 4,
      itemWidth: (width - 64) / 4 - 8,
      padding: 20,
      gap: 16,
      fontSize: 16,
    },
  };

  return configs[size];
};

/**
 * Type-safe responsive style selector
 */
export const selectResponsive = <T,>(options: {
  small?: T;
  medium?: T;
  large?: T;
  xl?: T;
}): T => {
  const size = getDeviceSize();
  return options[size] || options.medium!;
};

/**
 * Listen to dimension changes
 */
export const onDimensionsChange = (
  callback: (dims: { window: ScaledSize }) => void
) => {
  const subscription = Dimensions.addEventListener('change', callback);
  return subscription;
};
