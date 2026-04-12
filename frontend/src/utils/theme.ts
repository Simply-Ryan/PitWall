/**
 * Theme Configuration and Styling System
 * 
 * Centralized theme constants and styling utilities for consistent
 * professional racing interface design across all screens
 */

export const COLORS = {
  // Core backgrounds
  background: {
    primary: '#0A0E27',    // Deep dark blue-black
    secondary: '#111827',   // Secondary surface
    tertiary: '#1a1f3a',   // Tertiary surface
    surface: '#151b2f',    // Card/container surface
  },

  // Accents (modern racing palette)
  accent: {
    neon: '#00FF00',       // Bright neon green - alerts/active
    cyan: '#00D9FF',       // Cyan accent - primary interactive
    orange: '#FF8B00',     // Orange accent - warnings
    teal: '#00A5A5',       // Teal accent - secondary interactive
  },

  // Status colors
  status: {
    success: '#00FF00',    // Green for success/safe
    warning: '#FFFF00',    // Yellow for warning
    danger: '#FF4444',     // Red for danger/critical
    info: '#00D9FF',       // Cyan for info
  },

  // Text colors
  text: {
    primary: '#FFFFFF',    // Main text
    secondary: '#B0B0B0',  // Secondary text
    tertiary: '#808080',   // Tertiary/muted text
    muted: '#5A6B7D',      // Muted text
  },

  // Borders and dividers
  border: {
    primary: '#22334F',    // Blue-tinted dark border
    secondary: '#2d3e54',  // Lighter border
    light: '#3d4e66',      // Light border
    outline: '#00D9FF',    // Accent border (cyan)
  },

  // Gradients (for backgrounds and accent effects)
  gradient: {
    primary: ['#0A0E27', '#151b2f'],      // Primary gradient
    accent: ['#00D9FF', '#00A5A5'],       // Cyan gradient
    warning: ['#FF8B00', '#FF4444'],      // Warning gradient
    success: ['#00FF00', '#00A5A5'],      // Success gradient
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const TYPOGRAPHY = {
  heading: {
    h1: {
      fontSize: 36,
      fontWeight: 'bold' as const,
      letterSpacing: 2,
    },
    h2: {
      fontSize: 28,
      fontWeight: 'bold' as const,
      letterSpacing: 1.5,
    },
    h3: {
      fontSize: 20,
      fontWeight: 'bold' as const,
      letterSpacing: 1,
    },
  },
  body: {
    large: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
    normal: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    small: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 18,
    },
  },
  label: {
    large: {
      fontSize: 14,
      fontWeight: 'bold' as const,
      letterSpacing: 0.5,
    },
    normal: {
      fontSize: 12,
      fontWeight: 'bold' as const,
      letterSpacing: 1,
    },
    small: {
      fontSize: 10,
      fontWeight: 'bold' as const,
      letterSpacing: 1.5,
    },
  },
};

export const SHADOWS = {
  sm: {
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  md: {
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  lg: {
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  xl: {
    elevation: 12,
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const ANIMATION = {
  quick: 150,
  normal: 300,
  slow: 500,
};

/**
 * Common Style Presets
 */
export const COMMON_STYLES = {
  // Screen container
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },

  // Scroll view
  scrollView: {
    flex: 1,
  },

  // Screen header
  screenHeader: {
    backgroundColor: COLORS.background.secondary,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },

  // Section container
  sectionContainer: {
    marginVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },

  // Card/Container
  card: {
    backgroundColor: COLORS.background.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    padding: SPACING.lg,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: COLORS.border.primary,
    marginVertical: SPACING.md,
  },
};

/**
 * Theme Context for React components
 * Provides centralized access to theme values
 */
export const getStatusColor = (status: 'safe' | 'warning' | 'danger' | 'info'): string => {
  return COLORS.status[status];
};

export const getAccentColor = (type: 'primary' | 'secondary' | 'warning'): string => {
  switch (type) {
    case 'primary':
      return COLORS.accent.cyan;
    case 'secondary':
      return COLORS.accent.teal;
    case 'warning':
      return COLORS.accent.orange;
    default:
      return COLORS.accent.neon;
  }
};
