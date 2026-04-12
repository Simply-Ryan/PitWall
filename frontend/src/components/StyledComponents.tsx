/**
 * Styled Components for PitWall Racing Interface
 * 
 * Reusable UI components with consistent professional styling
 */

import React from 'react';
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  ViewStyle,
  TextStyle,
  PressableProps,
  ViewProps,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY, ANIMATION } from '../utils/theme';

/**
 * Primary Button Component - For main actions
 */
interface StyledButtonProps extends PressableProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: string;
  disabled?: boolean;
}

export const StyledButton: React.FC<StyledButtonProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  disabled = false,
  style,
  ...props
}) => {
  const variantStyles = {
    primary: styles.buttonPrimary,
    secondary: styles.buttonSecondary,
    danger: styles.buttonDanger,
    success: styles.buttonSuccess,
  };

  const sizeStyles = {
    sm: styles.buttonSmall,
    md: styles.buttonMedium,
    lg: styles.buttonLarge,
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && styles.buttonFullWidth,
        pressed && styles.buttonPressed,
        disabled && styles.buttonDisabled,
        style,
      ]}
      disabled={disabled}
      {...props}
    >
      <Text style={styles.buttonText}>
        {icon && `${icon} `}
        {label}
      </Text>
    </Pressable>
  );
};

/**
 * Card Component - For content containers
 */
interface StyledCardProps extends ViewProps {
  variant?: 'default' | 'accent' | 'warning' | 'danger';
  title?: string;
  children: React.ReactNode;
}

export const StyledCard: React.FC<StyledCardProps> = ({
  variant = 'default',
  title,
  children,
  style,
  ...props
}) => {
  const variantStyles = {
    default: styles.cardDefault,
    accent: styles.cardAccent,
    warning: styles.cardWarning,
    danger: styles.cardDanger,
  };

  return (
    <View style={[styles.card, variantStyles[variant], style]} {...props}>
      {title && <Text style={styles.cardTitle}>{title}</Text>}
      {children}
    </View>
  );
};

/**
 * Status Indicator Component
 */
interface StatusIndicatorProps extends ViewProps {
  status: 'safe' | 'warning' | 'danger' | 'info';
  label: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  size = 'md',
  style,
  ...props
}) => {
  const statusColors = {
    safe: COLORS.status.success,
    warning: COLORS.status.warning,
    danger: COLORS.status.danger,
    info: COLORS.status.info,
  };

  const sizeStyles = {
    sm: { indicatorSize: 8, textSize: 12 },
    md: { indicatorSize: 12, textSize: 14 },
    lg: { indicatorSize: 16, textSize: 16 },
  };

  const { indicatorSize, textSize } = sizeStyles[size];

  return (
    <View style={[styles.statusContainer, style]} {...props}>
      <View
        style={[
          styles.statusDot,
          { width: indicatorSize, height: indicatorSize, backgroundColor: statusColors[status] },
        ]}
      />
      <Text style={[styles.statusLabel, { fontSize: textSize, color: statusColors[status] }]}>
        {label}
      </Text>
    </View>
  );
};

/**
 * Metric Display Component
 */
interface MetricDisplayProps extends ViewProps {
  label: string;
  value: string;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
}

export const MetricDisplay: React.FC<MetricDisplayProps> = ({
  label,
  value,
  unit,
  trend,
  style,
  ...props
}) => {
  const trendColors = {
    up: COLORS.status.danger,
    down: COLORS.status.success,
    stable: COLORS.text.secondary,
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    stable: '→',
  };

  return (
    <View style={[styles.metricContainer, style]} {...props}>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={styles.metricValueContainer}>
        <Text style={styles.metricValue}>{value}</Text>
        {unit && <Text style={styles.metricUnit}>{unit}</Text>}
      </View>
      {trend && (
        <Text style={[styles.metricTrend, { color: trendColors[trend] }]}>
          {trendIcons[trend]}
        </Text>
      )}
    </View>
  );
};

/**
 * Section Header Component
 */
interface SectionHeaderProps extends ViewProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  action,
  style,
  ...props
}) => {
  return (
    <View style={[styles.sectionHeader, style]} {...props}>
      <View style={styles.sectionHeaderLeft}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      </View>
      {action && <View>{action}</View>}
    </View>
  );
};

/**
 * Grid Layout Component
 */
interface GridLayoutProps extends ViewProps {
  columns: number;
  gap?: number;
  children: React.ReactNode;
}

export const GridLayout: React.FC<GridLayoutProps> = ({
  columns,
  gap = SPACING.md,
  children,
  style,
  ...props
}) => {
  return (
    <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap }, style]} {...props}>
      {React.Children.map(children, (child) => (
        <View style={{ width: `${100 / columns}%`, paddingEnd: gap / 2, paddingBottom: gap / 2 }}>
          {child}
        </View>
      ))}
    </View>
  );
};

/**
 * Alert Box Component
 */
interface AlertBoxProps extends ViewProps {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  onDismiss?: () => void;
}

export const AlertBox: React.FC<AlertBoxProps> = ({
  type,
  message,
  onDismiss,
  style,
  ...props
}) => {
  const typeColors = {
    info: COLORS.status.info,
    success: COLORS.status.success,
    warning: COLORS.status.warning,
    error: COLORS.status.danger,
  };

  const typeIcons = {
    info: 'ℹ️',
    success: '✓',
    warning: '⚠️',
    error: '✕',
  };

  return (
    <View
      style={[styles.alertBox, { borderLeftColor: typeColors[type] }, style]}
      {...props}
    >
      <View style={styles.alertContent}>
        <Text style={{ fontSize: 16, marginRight: SPACING.md }}>
          {typeIcons[type]}
        </Text>
        <Text style={[styles.alertMessage, { color: COLORS.text.primary }]}>
          {message}
        </Text>
      </View>
      {onDismiss && (
        <Pressable onPress={onDismiss}>
          <Text style={styles.alertDismiss}>✕</Text>
        </Pressable>
      )}
    </View>
  );
};

/**
 * Divider Component
 */
interface DividerProps extends ViewProps {
  variant?: 'light' | 'dark' | 'accent';
  spacing?: 'sm' | 'md' | 'lg';
}

export const Divider: React.FC<DividerProps> = ({
  variant = 'light',
  spacing = 'md',
  style,
  ...props
}) => {
  const variantColors = {
    light: COLORS.border.light,
    dark: COLORS.border.primary,
    accent: COLORS.border.outline,
  };

  const spacingValues = {
    sm: SPACING.sm,
    md: SPACING.md,
    lg: SPACING.lg,
  };

  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: variantColors[variant],
          marginVertical: spacingValues[spacing],
        },
        style,
      ]}
      {...props}
    />
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // ========== BUTTONS ==========
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.md,
  },

  buttonPrimary: {
    backgroundColor: COLORS.accent.cyan,
  },

  buttonSecondary: {
    backgroundColor: COLORS.background.tertiary,
    borderWidth: 2,
    borderColor: COLORS.accent.cyan,
  },

  buttonDanger: {
    backgroundColor: COLORS.status.danger,
  },

  buttonSuccess: {
    backgroundColor: COLORS.status.success,
  },

  buttonSmall: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },

  buttonMedium: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },

  buttonLarge: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },

  buttonFullWidth: {
    width: '100%',
  },

  buttonPressed: {
    opacity: 0.7,
    ...SHADOWS.lg,
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  buttonText: {
    color: COLORS.text.primary,
    fontWeight: 'bold' as const,
    fontSize: 14,
    letterSpacing: 0.5,
  },

  // ========== CARDS ==========
  card: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },

  cardDefault: {
    backgroundColor: COLORS.background.surface,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
  },

  cardAccent: {
    backgroundColor: COLORS.background.surface,
    borderWidth: 2,
    borderColor: COLORS.accent.cyan,
  },

  cardWarning: {
    backgroundColor: COLORS.background.surface,
    borderWidth: 2,
    borderColor: COLORS.status.warning,
  },

  cardDanger: {
    backgroundColor: COLORS.background.surface,
    borderWidth: 2,
    borderColor: COLORS.status.danger,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
    letterSpacing: 1,
  },

  // ========== STATUS INDICATOR ==========
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },

  statusDot: {
    borderRadius: BORDER_RADIUS.full,
    shadowColor: '#00D9FF',
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },

  statusLabel: {
    fontWeight: 'bold' as const,
    letterSpacing: 0.5,
  },

  // ========== METRIC DISPLAY ==========
  metricContainer: {
    backgroundColor: COLORS.background.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
  },

  metricLabel: {
    fontSize: 11,
    color: COLORS.text.tertiary,
    fontWeight: 'bold' as const,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
  },

  metricValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.sm,
  },

  metricValue: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: COLORS.accent.cyan,
  },

  metricUnit: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontWeight: '600' as const,
  },

  metricTrend: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    marginTop: SPACING.sm,
  },

  // ========== SECTION HEADER ==========
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },

  sectionHeaderLeft: {
    flex: 1,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: COLORS.text.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: SPACING.sm,
  },

  // ========== ALERT BOX ==========
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background.surface,
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 4,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },

  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  alertMessage: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500' as const,
  },

  alertDismiss: {
    fontSize: 18,
    color: COLORS.text.secondary,
    fontWeight: 'bold' as const,
    marginLeft: SPACING.md,
  },

  // ========== DIVIDER ==========
  divider: {
    height: 1,
    width: '100%',
  },
});
