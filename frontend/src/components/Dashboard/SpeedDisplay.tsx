/**
 * Speed Display Component
 *
 * Shows current speed prominently with large font
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../utils/theme';

interface SpeedDisplayProps {
  speed: number;
}

export const SpeedDisplay: React.FC<SpeedDisplayProps> = ({ speed }) => {
  // Format speed with units
  const displaySpeed = useMemo(() => Math.round(speed), [speed]);

  // Determine color based on speed thresholds
  const speedColor = useMemo(() => {
    if (speed < 10) return COLORS.text.tertiary;
    if (speed < 100) return COLORS.status.warning;
    if (speed < 180) return COLORS.status.success;
    return COLORS.status.danger;
  }, [speed]);

  return (
    <View style={[styles.container, { borderColor: speedColor }]}>
      <Text style={styles.label}>SPEED</Text>
      <View style={styles.valueContainer}>
        <Text style={[styles.value, { color: speedColor }]}>{displaySpeed}</Text>
        <Text style={styles.unit}>km/h</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.surface,
    borderWidth: 2,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },

  label: {
    color: COLORS.text.secondary,
    fontSize: 10,
    fontWeight: 'bold' as const,
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },

  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },

  value: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    marginRight: SPACING.xs,
  },

  unit: {
    color: COLORS.text.secondary,
    fontSize: 10,
    marginTop: SPACING.xs,
  },
});
