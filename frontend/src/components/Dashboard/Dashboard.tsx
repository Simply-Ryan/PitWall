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
import { useVoice } from '@hooks/useVoice';
import { SpeedDisplay } from './SpeedDisplay';
import { GearDisplay } from './GearDisplay';
import { RPMDisplay } from './RPMDisplay';
import { ThrottleDisplay } from './ThrottleDisplay';
import { DeltaDisplay } from './DeltaDisplay';
import { TireTemperatureDisplay } from './TireTemperatureDisplay';
import { FuelDisplay } from './FuelDisplay';
import { LapTimeDisplay } from './LapTimeDisplay';
import { COLORS, SPACING, BORDER_RADIUS, COMMON_STYLES } from '../../utils/theme';

/**
 * Smart Dashboard HUD component
 * Displays real-time telemetry data in a professional racing-style interface
 */
export const Dashboard: React.FC = () => {
  const { data, isConnected, error } = useTelemetry();
  const { isEnabled: voiceEnabled, isSpeaking, queueSize } = useVoice();

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
            {voiceEnabled && (
              <View style={[styles.voiceIndicator, isSpeaking && styles.voiceSpeaking]}>
                <Text style={styles.voiceText}>
                  🎙️ {isSpeaking ? 'Speaking' : `Queue: ${queueSize}`}
                </Text>
              </View>
            )}
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
    backgroundColor: COLORS.background.primary,
    padding: SPACING.md,
    justifyContent: 'space-between',
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.md,
    flexWrap: 'wrap',
  },

  controlsRow: {
    marginBottom: SPACING.lg,
  },

  lapDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    gap: SPACING.md,
    flexWrap: 'wrap',
  },

  tiresRow: {
    marginBottom: SPACING.lg,
  },

  fuelRow: {
    marginBottom: SPACING.md,
  },

  connectionIndicator: {
    backgroundColor: COLORS.status.success,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.accent.cyan,
  },

  connectionText: {
    color: COLORS.text.primary,
    fontSize: 11,
    fontWeight: 'bold' as const,
    letterSpacing: 0.5,
  },

  voiceIndicator: {
    backgroundColor: COLORS.accent.teal,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.accent.cyan,
  },

  voiceSpeaking: {
    backgroundColor: COLORS.accent.orange,
    borderColor: COLORS.status.warning,
  },

  voiceText: {
    color: COLORS.text.primary,
    fontSize: 11,
    fontWeight: 'bold' as const,
    letterSpacing: 0.5,
  },

  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  placeholderText: {
    color: COLORS.text.secondary,
    fontSize: 16,
    marginBottom: SPACING.lg,
  },

  errorText: {
    color: COLORS.status.danger,
    fontSize: 13,
    marginTop: SPACING.md,
  },
});
