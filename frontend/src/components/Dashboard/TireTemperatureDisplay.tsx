/**
 * Tire Temperature Display Component
 *
 * Shows tire temperatures for all four tires with inner/middle/outer zones
 * Layout:
 *    LF  RF
 *    LR  RR
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../utils/theme';
import type { TireData } from '@types/telemetry';

interface TireTemperatureDisplayProps {
  tires: TireData;
}

/**
 * Determines color based on tire temperature
 * Green: optimal (80-100°C), Yellow: warm (50-80°C), Red: hot (>100°C or <50°C)
 */
function getTemperatureColor(temp: number): string {
  if (temp < 50 || temp > 120) return COLORS.status.danger;
  if (temp < 70 || temp > 100) return COLORS.status.warning;
  return COLORS.status.success;
}

/**
 * Single tire display component
 */
const TireCell: React.FC<{
  label: string;
  temps: [number, number, number];
  wear: number;
}> = ({ label, temps, wear }) => {
  const avgTemp = useMemo(() => Math.round((temps[0] + temps[1] + temps[2]) / 3), [temps]);
  const avgColor = useMemo(() => getTemperatureColor(avgTemp), [avgTemp]);

  return (
    <View style={styles.tireCell}>
      <Text style={styles.tireLabel}>{label}</Text>

      {/* Temperature Display */}
      <Text style={[styles.tireTemp, { color: avgColor }]}>{avgTemp}°C</Text>

      {/* Wear Display */}
      <View style={styles.wearContainer}>
        <View style={[styles.wearBar, { width: `${wear * 100}%` }]} />
      </View>
      <Text style={styles.wearText}>{Math.round(wear * 100)}%</Text>

      {/* Inner/Middle/Outer breakdown */}
      <View style={styles.tempBreakdown}>
        <Text style={[styles.tempSmall, { color: getTemperatureColor(temps[0]) }]}>
          {Math.round(temps[0])}
        </Text>
        <Text style={[styles.tempSmall, { color: getTemperatureColor(temps[1]) }]}>
          {Math.round(temps[1])}
        </Text>
        <Text style={[styles.tempSmall, { color: getTemperatureColor(temps[2]) }]}>
          {Math.round(temps[2])}
        </Text>
      </View>
    </View>
  );
};

export const TireTemperatureDisplay: React.FC<TireTemperatureDisplayProps> = ({ tires }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>TIRE TEMPERATURES & WEAR</Text>

      <View style={styles.tiresGrid}>
        {/* Top Row: Left Front, Right Front */}
        <View style={styles.row}>
          <TireCell label="LF" temps={[tires.temperatureLF.inner, tires.temperatureLF.middle, tires.temperatureLF.outer]} wear={tires.wearLF} />
          <TireCell label="RF" temps={[tires.temperatureRF.inner, tires.temperatureRF.middle, tires.temperatureRF.outer]} wear={tires.wearRF} />
        </View>

        {/* Bottom Row: Left Rear, Right Rear */}
        <View style={styles.row}>
          <TireCell label="LR" temps={[tires.temperatureLR.inner, tires.temperatureLR.middle, tires.temperatureLR.outer]} wear={tires.wearLR} />
          <TireCell label="RR" temps={[tires.temperatureRR.inner, tires.temperatureRR.middle, tires.temperatureRR.outer]} wear={tires.wearRR} />
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendText}>Inner / Middle / Outer (°C)</Text>
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

  label: {
    color: COLORS.text.secondary,
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },

  tiresGrid: {
    gap: SPACING.sm,
  },

  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },

  tireCell: {
    flex: 1,
    backgroundColor: COLORS.backgrounds.secondary,
    borderWidth: 1,
    borderColor: COLORS.borders.default,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    alignItems: 'center',
  },

  tireLabel: {
    color: COLORS.text.secondary,
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },

  tireTemp: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },

  wearContainer: {
    width: '100%',
    height: 6,
    backgroundColor: COLORS.backgrounds.tertiary,
    borderRadius: BORDER_RADIUS.xs,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },

  wearBar: {
    height: '100%',
    backgroundColor: COLORS.accents.warning,
    borderRadius: BORDER_RADIUS.xs,
  },

  wearText: {
    color: COLORS.text.tertiary,
    fontSize: 9,
    marginBottom: SPACING.xs,
  },

  tempBreakdown: {
    flexDirection: 'row',
    gap: SPACING.xs,
    justifyContent: 'space-around',
    width: '100%',
  },

  tempSmall: {
    fontSize: 9,
    fontWeight: 'bold',
  },

  legend: {
    marginTop: SPACING.sm,
    alignItems: 'center',
  },

  legendText: {
    color: COLORS.text.tertiary,
    fontSize: 8,
  },
});
