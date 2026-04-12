/**
 * Throttle/Brake Display Component
 *
 * Visualizes throttle and brake inputs side-by-side with bar indicators
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../utils/theme';

interface ThrottleDisplayProps {
  throttle: number; // 0-1
  brake: number; // 0-1
}

export const ThrottleDisplay: React.FC<ThrottleDisplayProps> = ({ throttle, brake }) => {
  const throttlePercent = useMemo(() => throttle * 100, [throttle]);
  const brakePercent = useMemo(() => brake * 100, [brake]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>THROTTLE / BRAKE</Text>

      <View style={styles.controlsRow}>
        {/* Throttle Control */}
        <View style={styles.controlColumn}>
          <Text style={styles.controlLabel}>THROTTLE</Text>
          <View style={styles.barContainer}>
            <View style={[styles.barFill, { width: `${throttlePercent}%`, backgroundColor: COLORS.status.success }]} />
          </View>
          <Text style={[styles.controlValue, { color: COLORS.status.success }]}>
            {Math.round(throttlePercent)}%
          </Text>
        </View>

        {/* Brake Control */}
        <View style={styles.controlColumn}>
          <Text style={styles.controlLabel}>BRAKE</Text>
          <View style={styles.barContainer}>
            <View style={[styles.barFill, { width: `${brakePercent}%`, backgroundColor: COLORS.status.danger }]} />
          </View>
          <Text style={[styles.controlValue, { color: COLORS.status.danger }]}>
            {Math.round(brakePercent)}%
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.backgrounds.primary,
    borderWidth: 2,
    borderColor: COLORS.borders.accent,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },

  label: {
    color: COLORS.text.secondary,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },

  controlsRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },

  controlColumn: {
    flex: 1,
  },

  controlLabel: {
    color: COLORS.text.secondary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },

  barContainer: {
    height: 24,
    backgroundColor: COLORS.backgrounds.secondary,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },

  barFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.sm,
  },

  controlValue: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
