/**
 * Smart Dashboard HUD - Main Component
 *
 * Real-time telemetry visualization with gear, speed, throttle/brake displays,
 * delta tracking, and tire temperature monitoring
 *
 * Layout:
 * ┌─────────────────────────────────┐
 * │  SPEED │ GEAR │ RPM               │
 * │  Throttle/Brake visualization    │
 * │  Delta to Best │ Current Lap Time │
 * │  Tire Temps (LF, RF, LR, RR)     │
 * │  Fuel Level                       │
 * └─────────────────────────────────┘
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTelemetry } from '@hooks/useTelemetry';
import { SpeedDisplay } from './SpeedDisplay';
import { GearDisplay } from './GearDisplay';
import { RPMDisplay } from './RPMDisplay';
import { ThrottleDisplay } from './ThrottleDisplay';
import { DeltaDisplay } from './DeltaDisplay';
import { TireTemperatureDisplay } from './TireTemperatureDisplay';
import { FuelDisplay } from './FuelDisplay';
import { LapTimeDisplay } from './LapTimeDisplay';

/**
 * Smart Dashboard HUD component
 * Displays real-time telemetry data in a professional racing-style interface
 */
export const Dashboard: React.FC = () => {
  const { data, isConnected, error } = useTelemetry();

  // Memoize layout to prevent unnecessary re-renders
  const shouldShowTelemetry = useMemo(() => data !== null && isConnected, [data, isConnected]);

  if (!isConnected) {
    return (
      <View style={styles.fullContainer}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>🔴 Waiting for telemetry connection...</Text>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.fullContainer}>
      {/* Main content */}
      {shouldShowTelemetry && data ? (
        <>
          {/* Top Row: Speed, Gear, RPM, Connection Status */}
          <View style={styles.topRow}>
            <SpeedDisplay speed={data.vehicle.speed} />
            <GearDisplay gear={data.vehicle.gear} />
            <RPMDisplay rpm={data.vehicle.rpm} maxRPM={data.vehicle.maxRPM} />
            <View style={styles.connectionIndicator}>
              <Text style={styles.connectionText}>✓ Connected</Text>
            </View>
          </View>

          {/* Throttle / Brake Visualization */}
          <View style={styles.controlsRow}>
            <ThrottleDisplay
              throttle={data.vehicle.controls.throttle}
              brake={data.vehicle.controls.brake}
            />
          </View>

          {/* Lap Data Row: Delta and Current Lap Time */}
          <View style={styles.lapDataRow}>
            <DeltaDisplay
              delta={data.lap.deltaToSessionBest}
              lapNumber={data.lap.currentLap}
              isInLap={data.lap.isInLap}
            />
            <LapTimeDisplay
              lapTime={data.lap.lapTime}
              lastLapTime={data.lap.lastLapTime}
              bestLapTime={data.lap.bestLapTime}
            />
          </View>

          {/* Tire Temperatures */}
          <View style={styles.tiresRow}>
            <TireTemperatureDisplay tires={data.tires} />
          </View>

          {/* Fuel Status */}
          <View style={styles.fuelRow}>
            <FuelDisplay
              fuelLevel={data.vehicle.fuel.level}
              fuelCapacity={data.vehicle.fuel.capacity}
              fuelConsumed={data.vehicle.fuel.consumed}
            />
          </View>
        </>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>🔄 Loading telemetry data...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 12,
    justifyContent: 'space-between',
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },

  controlsRow: {
    marginBottom: 16,
  },

  lapDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 10,
  },

  tiresRow: {
    marginBottom: 16,
  },

  fuelRow: {
    marginBottom: 8,
  },

  connectionIndicator: {
    backgroundColor: '#00AA00',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },

  connectionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  placeholderText: {
    color: '#CCCCCC',
    fontSize: 18,
    marginBottom: 12,
  },

  errorText: {
    color: '#FF4444',
    fontSize: 14,
    marginTop: 8,
  },
});
