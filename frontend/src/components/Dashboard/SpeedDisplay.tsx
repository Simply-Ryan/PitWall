/**
 * Speed Display Component
 *
 * Shows current speed prominently with large font
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SpeedDisplayProps {
  speed: number;
}

export const SpeedDisplay: React.FC<SpeedDisplayProps> = ({ speed }) => {
  // Format speed with units
  const displaySpeed = useMemo(() => Math.round(speed), [speed]);

  // Determine color based on speed thresholds
  const speedColor = useMemo(() => {
    if (speed < 10) return '#666666'; // Gray when stationary
    if (speed < 100) return '#FFFF00'; // Yellow for normal speeds
    if (speed < 180) return '#00FF00'; // Green for high speeds
    return '#FF0000'; // Red for very high speeds
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
    backgroundColor: '#111111',
    borderWidth: 2,
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  label: {
    color: '#888888',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },

  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },

  value: {
    fontSize: 32,
    fontWeight: 'bold',
    marginRight: 4,
  },

  unit: {
    color: '#CCCCCC',
    fontSize: 10,
    marginTop: 4,
  },
});
