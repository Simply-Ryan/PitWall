/**
 * Delta Display Component
 *
 * Shows delta to session best lap with color coding (green = faster, red = slower)
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../utils/theme';

interface DeltaDisplayProps {
  delta: number; // milliseconds (positive = slower, negative = faster)
  lapNumber: number;
  isInLap: boolean;
}

/**
 * Formats milliseconds to MM:SS.mmm format
 */
function formatDelta(ms: number): string {
  const absMs = Math.abs(ms);
  const minutes = Math.floor(absMs / 60000);
  const seconds = Math.floor((absMs % 60000) / 1000);
  const milliseconds = Math.floor(absMs % 1000);

  const sign = ms < 0 ? '-' : '+';
  return `${sign}${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

export const DeltaDisplay: React.FC<DeltaDisplayProps> = ({ delta, lapNumber, isInLap }) => {
  const { deltaText, deltaColor } = useMemo(() => {
    if (Math.abs(delta) < 10) {
      // Very close to best
      return { deltaText: formatDelta(delta), deltaColor: COLORS.text.primary };
    }
    if (delta < 0) {
      // Faster than best
      return { deltaText: formatDelta(delta), deltaColor: COLORS.status.success };
    }
    // Slower than best
    return { deltaText: formatDelta(delta), deltaColor: COLORS.status.danger };
  }, [delta]);

  const lapStatus = useMemo(() => {
    return isInLap ? '🔴 RECORDING' : '⚪ IDLE';
  }, [isInLap]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>LAP</Text>
        <Text style={styles.lapNumber}>#{lapNumber}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>DELTA TO BEST</Text>
        <Text style={[styles.deltaValue, { color: deltaColor }]}>{deltaText}</Text>
        <Text style={styles.status}>{lapStatus}</Text>
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

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },

  label: {
    color: COLORS.text.secondary,
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  lapNumber: {
    color: COLORS.text.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },

  content: {
    alignItems: 'center',
  },

  deltaValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
    fontFamily: 'monospace',
  },

  status: {
    color: COLORS.text.secondary,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
    marginVertical: 6,
    fontFamily: 'monospace',
  },

  status: {
    color: '#888888',
    fontSize: 10,
  },
});
