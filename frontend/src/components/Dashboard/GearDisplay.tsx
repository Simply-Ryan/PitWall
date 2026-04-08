/**
 * Gear Display Component
 *
 * Shows current gear with color coding (red = neutral, blue = reverse, green = forward)
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface GearDisplayProps {
  gear: number;
}

export const GearDisplay: React.FC<GearDisplayProps> = ({ gear }) => {
  // Determine gear display and color
  const { gearText, gearColor } = useMemo(() => {
    if (gear === 0) {
      return { gearText: 'N', gearColor: '#FF0000' }; // Red for Neutral
    }
    if (gear === -1) {
      return { gearText: 'R', gearColor: '#0088FF' }; // Blue for Reverse
    }
    return { gearText: String(gear), gearColor: '#00FF00' }; // Green for forward gears
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
    backgroundColor: '#111111',
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },

  label: {
    color: '#888888',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },

  gear: {
    fontSize: 28,
    fontWeight: 'bold',
  },
});
