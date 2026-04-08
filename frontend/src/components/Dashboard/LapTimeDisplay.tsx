/**
 * Lap Time Display Component
 *
 * Shows current lap time, last lap time, and best lap time
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

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
          <Text style={[styles.smallTime, { color: '#00FF00' }]}>{bestLapDisplay}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
    borderWidth: 2,
    borderColor: '#444444',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'space-between',
  },

  currentSection: {
    alignItems: 'center',
    marginBottom: 10,
  },

  label: {
    color: '#888888',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },

  currentTime: {
    color: '#FFFFFF',
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
    backgroundColor: '#333333',
    marginHorizontal: 8,
  },

  smallLabel: {
    color: '#666666',
    fontSize: 8,
    fontWeight: 'bold',
    marginBottom: 2,
  },

  smallTime: {
    color: '#CCCCCC',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
});
