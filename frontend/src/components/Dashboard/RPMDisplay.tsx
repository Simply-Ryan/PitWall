/**
 * RPM Display Component
 *
 * Shows current RPM with visual progress bar and redline warning
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../utils/theme';

interface RPMDisplayProps {
  rpm: number;
  maxRPM: number;
}

export const RPMDisplay: React.FC<RPMDisplayProps> = ({ rpm, maxRPM }) => {
  // Calculate RPM percentage
  const rpmPercent = useMemo(() => Math.min((rpm / maxRPM) * 100, 100), [rpm, maxRPM]);

  // Determine color based on RPM percentage
  const barColor = useMemo(() => {
    if (rpmPercent < 50) return COLORS.status.success;
    if (rpmPercent < 80) return COLORS.status.warning;
    return COLORS.status.danger;
  }, [rpmPercent]);

  const displayRPM = useMemo(() => Math.round(rpm), [rpm]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>RPM</Text>

      {/* RPM Bar Visualization */}
      <View style={styles.barContainer}>
        <View style={[styles.barFill, { width: `${rpmPercent}%`, backgroundColor: barColor }]} />
      </View>

      {/* RPM Value */}
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: barColor }]}>{displayRPM}</Text>
        <Text style={styles.maxRPM}>{maxRPM}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.surface,
    borderWidth: 2,
    borderColor: COLORS.border.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    justifyContent: 'center',
    ...SHADOWS.md,
  },

  label: {
    color: COLORS.text.secondary,
    fontSize: 10,
    fontWeight: 'bold' as const,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },

  barContainer: {
    height: 16,
    backgroundColor: COLORS.background.tertiary,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },

  barFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.sm,
  },

  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  value: {
    fontSize: 14,
    fontWeight: 'bold' as const,
  },

  maxRPM: {
    color: COLORS.text.tertiary,
    fontSize: 10,
  },
});
