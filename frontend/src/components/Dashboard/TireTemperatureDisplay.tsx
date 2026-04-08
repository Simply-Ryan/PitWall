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
import type { TireData } from '@types/telemetry';

interface TireTemperatureDisplayProps {
  tires: TireData;
}

/**
 * Determines color based on tire temperature
 * Green: optimal (80-100°C), Yellow: warm (50-80°C), Red: hot (>100°C or <50°C)
 */
function getTemperatureColor(temp: number): string {
  if (temp < 50 || temp > 120) return '#FF4444';
  if (temp < 70 || temp > 100) return '#FFFF00';
  return '#00FF00';
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
    backgroundColor: '#111111',
    borderWidth: 2,
    borderColor: '#444444',
    borderRadius: 8,
    padding: 12,
  },

  label: {
    color: '#888888',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 10,
  },

  tiresGrid: {
    gap: 8,
  },

  row: {
    flexDirection: 'row',
    gap: 8,
  },

  tireCell: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
  },

  tireLabel: {
    color: '#AAAAAA',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
  },

  tireTemp: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },

  wearContainer: {
    width: '100%',
    height: 6,
    backgroundColor: '#1A1A1A',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 2,
  },

  wearBar: {
    height: '100%',
    backgroundColor: '#FF6600',
    borderRadius: 3,
  },

  wearText: {
    color: '#666666',
    fontSize: 9,
    marginBottom: 4,
  },

  tempBreakdown: {
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'space-around',
    width: '100%',
  },

  tempSmall: {
    fontSize: 9,
    fontWeight: 'bold',
  },

  legend: {
    marginTop: 8,
    alignItems: 'center',
  },

  legendText: {
    color: '#666666',
    fontSize: 8,
  },
});
