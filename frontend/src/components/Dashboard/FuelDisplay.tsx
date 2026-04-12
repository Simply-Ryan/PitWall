/**
 * Fuel Display Component
 *
 * Shows current fuel level, capacity, and consumption rate
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../utils/theme';

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
    if (fuelPercent > 50) return COLORS.status.success; // Green
    if (fuelPercent > 20) return COLORS.status.warning; // Yellow
    return COLORS.status.danger; // Red - low fuel
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
    backgroundColor: COLORS.backgrounds.primary,
    borderWidth: 2,
    borderColor: COLORS.borders.accent,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },

  header: {
    marginBottom: SPACING.md,
  },

  label: {
    color: COLORS.text.secondary,
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },

  fuelBarContainer: {
    height: 12,
    backgroundColor: COLORS.backgrounds.secondary,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },

  fuelBar: {
    height: '100%',
    borderRadius: BORDER_RADIUS.sm,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  infoSection: {
    alignItems: 'center',
  },

  infoLabel: {
    color: COLORS.text.secondary,
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },

  infoValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});

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
