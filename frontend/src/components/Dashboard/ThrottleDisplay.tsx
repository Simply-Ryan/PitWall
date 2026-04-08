/**
 * Throttle/Brake Display Component
 *
 * Visualizes throttle and brake inputs side-by-side with bar indicators
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

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
            <View style={[styles.barFill, { width: `${throttlePercent}%`, backgroundColor: '#00FF00' }]} />
          </View>
          <Text style={[styles.controlValue, { color: '#00FF00' }]}>
            {Math.round(throttlePercent)}%
          </Text>
        </View>

        {/* Brake Control */}
        <View style={styles.controlColumn}>
          <Text style={styles.controlLabel}>BRAKE</Text>
          <View style={styles.barContainer}>
            <View style={[styles.barFill, { width: `${brakePercent}%`, backgroundColor: '#FF4444' }]} />
          </View>
          <Text style={[styles.controlValue, { color: '#FF4444' }]}>
            {Math.round(brakePercent)}%
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111111',
    borderWidth: 2,
    borderColor: '#444444',
    borderRadius: 8,
    padding: 12,
  },

  label: {
    color: '#888888',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 10,
  },

  controlsRow: {
    flexDirection: 'row',
    gap: 16,
  },

  controlColumn: {
    flex: 1,
  },

  controlLabel: {
    color: '#AAAAAA',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },

  barContainer: {
    height: 24,
    backgroundColor: '#222222',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },

  barFill: {
    height: '100%',
    borderRadius: 4,
  },

  controlValue: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
