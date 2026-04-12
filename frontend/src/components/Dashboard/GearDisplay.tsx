/**
 * Gear Display Component
 *
 * Shows current gear with color coding (red = neutral, blue = reverse, green = forward)
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../utils/theme';

interface GearDisplayProps {
  gear: number;
}

export const GearDisplay: React.FC<GearDisplayProps> = ({ gear }) => {
  // Determine gear display and color
  const { gearText, gearColor } = useMemo(() => {
    if (gear === 0) {
      return { gearText: 'N', gearColor: COLORS.status.warning };
    }
    if (gear === -1) {
      return { gearText: 'R', gearColor: COLORS.accent.teal };
    }
    return { gearText: String(gear), gearColor: COLORS.status.success };
  }, [gear]);

  return (
    <View style={[styles.container, { borderColor: gearColor }]}>
      <Text style={styles.label}>GEAR</Text>
      <Text style={[styles.gear, { color: gearColor }]}>{gearText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.surface,
    borderWidth: 2,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
    ...SHADOWS.md,
  },

  label: {
    color: COLORS.text.secondary,
    fontSize: 10,
    fontWeight: 'bold' as const,
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },

  gear: {
    fontSize: 28,
    fontWeight: 'bold' as const,
  },
});
