/**
 * RPM Display Component
 *
 * Shows current RPM with visual progress bar and redline warning
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface RPMDisplayProps {
  rpm: number;
  maxRPM: number;
}

export const RPMDisplay: React.FC<RPMDisplayProps> = ({ rpm, maxRPM }) => {
  // Calculate RPM percentage
  const rpmPercent = useMemo(() => Math.min((rpm / maxRPM) * 100, 100), [rpm, maxRPM]);

  // Determine color based on RPM percentage
  const barColor = useMemo(() => {
    if (rpmPercent < 50) return '#00FF00'; // Green
    if (rpmPercent < 80) return '#FFFF00'; // Yellow
    return '#FF0000'; // Red (redline zone)
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
    backgroundColor: '#111111',
    borderWidth: 2,
    borderColor: '#444444',
    borderRadius: 8,
    padding: 10,
    justifyContent: 'center',
  },

  label: {
    color: '#888888',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 6,
  },

  barContainer: {
    height: 16,
    backgroundColor: '#222222',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },

  barFill: {
    height: '100%',
    borderRadius: 4,
  },

  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  value: {
    fontSize: 14,
    fontWeight: 'bold',
  },

  maxRPM: {
    color: '#666666',
    fontSize: 10,
  },
});
