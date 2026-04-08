/**
 * Fuel Display Component
 *
 * Shows current fuel level, capacity, and consumption rate
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface FuelDisplayProps {
  fuelLevel: number; // liters
  fuelCapacity: number; // liters
  fuelConsumed: number; // liters consumed this lap
}

export const FuelDisplay: React.FC<FuelDisplayProps> = ({
  fuelLevel,
  fuelCapacity,
  fuelConsumed,
}) => {
  const fuelPercent = useMemo(() => (fuelLevel / fuelCapacity) * 100, [fuelLevel, fuelCapacity]);

  const fuelColor = useMemo(() => {
    if (fuelPercent > 50) return '#00FF00'; // Green
    if (fuelPercent > 20) return '#FFFF00'; // Yellow
    return '#FF4444'; // Red - low fuel
  }, [fuelPercent]);

  const displayLevel = useMemo(() => fuelLevel.toFixed(1), [fuelLevel]);
  const displayConsumed = useMemo(() => fuelConsumed.toFixed(2), [fuelConsumed]);

  return (
    <View style={styles.container}>
      {/* Fuel Bar */}
      <View style={styles.header}>
        <Text style={styles.label}>FUEL</Text>
        <View style={styles.fuelBarContainer}>
          <View style={[styles.fuelBar, { width: `${fuelPercent}%`, backgroundColor: fuelColor }]} />
        </View>
      </View>

      {/* Fuel Info Row */}
      <View style={styles.infoRow}>
        <View style={styles.infoSection}>
          <Text style={styles.infoLabel}>LEVEL</Text>
          <Text style={[styles.infoValue, { color: fuelColor }]}>{displayLevel}L</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoLabel}>CAPACITY</Text>
          <Text style={styles.infoValue}>{fuelCapacity.toFixed(1)}L</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoLabel}>LAP AVG</Text>
          <Text style={styles.infoValue}>{displayConsumed}L</Text>
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
    padding: 10,
  },

  header: {
    marginBottom: 10,
  },

  label: {
    color: '#888888',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 6,
  },

  fuelBarContainer: {
    height: 12,
    backgroundColor: '#222222',
    borderRadius: 4,
    overflow: 'hidden',
  },

  fuelBar: {
    height: '100%',
    borderRadius: 4,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  infoSection: {
    alignItems: 'center',
  },

  infoLabel: {
    color: '#666666',
    fontSize: 8,
    fontWeight: 'bold',
    marginBottom: 2,
  },

  infoValue: {
    color: '#CCCCCC',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
