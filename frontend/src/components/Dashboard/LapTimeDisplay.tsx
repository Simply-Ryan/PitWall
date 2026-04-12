/**
 * Lap Time Display Component
 *
 * Shows current lap time, last lap time, and best lap time
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../utils/theme';

interface LapTimeDisplayProps {
  lapTime: number; // milliseconds
  lastLapTime: number | null; // milliseconds
  bestLapTime: number | null; // milliseconds
}

/**
 * Formats milliseconds to MM:SS.mmm format
 */
function formatLapTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = Math.floor(ms % 1000);

  return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

export const LapTimeDisplay: React.FC<LapTimeDisplayProps> = ({
  lapTime,
  lastLapTime,
  bestLapTime,
}) => {
  const currentLapDisplay = useMemo(() => formatLapTime(lapTime), [lapTime]);
  const lastLapDisplay = useMemo(
    () => (lastLapTime ? formatLapTime(lastLapTime) : '--:--.-'),
    [lastLapTime]
  );
  const bestLapDisplay = useMemo(
    () => (bestLapTime ? formatLapTime(bestLapTime) : '--:--.-'),
    [bestLapTime]
  );

  return (
    <View style={styles.container}>
      {/* Current Lap Time (Largest) */}
      <View style={styles.currentSection}>
        <Text style={styles.label}>CURRENT LAP</Text>
        <Text style={styles.currentTime}>{currentLapDisplay}</Text>
      </View>

      {/* Last and Best Lap Times (Smaller) */}
      <View style={styles.comparisonRow}>
        <View style={styles.comparisonSection}>
          <Text style={styles.smallLabel}>LAST LAP</Text>
          <Text style={styles.smallTime}>{lastLapDisplay}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.comparisonSection}>
          <Text style={styles.smallLabel}>BEST LAP</Text>
          <Text style={[styles.smallTime, { color: COLORS.status.success }]}>{bestLapDisplay}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgrounds.primary,
    borderWidth: 2,
    borderColor: COLORS.borders.accent,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    justifyContent: 'space-between',
  },

  currentSection: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },

  label: {
    color: COLORS.text.secondary,
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },

  currentTime: {
    color: COLORS.text.primary,
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },

  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },

  comparisonSection: {
    flex: 1,
    alignItems: 'center',
  },

  divider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.borders.default,
    marginHorizontal: SPACING.sm,
  },

  smallLabel: {
    color: COLORS.text.tertiary,
    fontSize: 8,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },

  smallTime: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
});
