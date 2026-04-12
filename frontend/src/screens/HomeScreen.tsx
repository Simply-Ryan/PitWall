import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAppSelector, useAppDispatch } from '@redux/store';
import { setCurrentScreen } from '@redux/slices/uiSlice';
import { updateTelemetry, setConnected } from '@redux/slices/telemetrySlice';
import { startSession } from '@redux/slices/sessionSlice';
import type { RootNavigationProp } from '../App';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  TYPOGRAPHY,
  SHADOWS,
  COMMON_STYLES,
} from '../utils/theme';
import {
  StyledButton,
  StyledCard,
  StatusIndicator,
  MetricDisplay,
  SectionHeader,
  Divider,
  AlertBox,
} from '../components/StyledComponents';

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

/**
 * Home Screen Component
 * 
 * Shows connection status, session info, and navigation to Dashboard
 */
export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const telemetry = useAppSelector((state) => state.telemetry);
  const session = useAppSelector((state) => state.session);
  const ui = useAppSelector((state) => state.ui);

  useEffect(() => {
    dispatch(setCurrentScreen('Home'));
  }, [dispatch]);

  // Load sample telemetry data
  const handleLoadSampleTelemetry = () => {
    dispatch(setConnected(true));
    dispatch(startSession({
      id: 'sample-session-001',
      name: 'Practice Session',
      game: 'iRacing',
    }));

    // Mock telemetry data
    dispatch(updateTelemetry({
      timestamp: Date.now(),
      sessionId: 'sample-session-001',
      vehicle: {
        speed: 250,
        rpm: 7500,
        gear: 5,
        maxRPM: 8000,
        controls: {
          throttle: 0.85,
          brake: 0,
          clutch: 0,
          steering: 0.05,
        },
        fuel: {
          level: 45.5,
          capacity: 60,
          consumed: 2.1,
        },
      },
      tires: {
        temperatureLF: { inner: 92, middle: 95, outer: 88 },
        temperatureRF: { inner: 90, middle: 94, outer: 86 },
        temperatureLR: { inner: 85, middle: 88, outer: 82 },
        temperatureRR: { inner: 86, middle: 89, outer: 83 },
        wearLF: 0.35,
        wearRF: 0.32,
        wearLR: 0.28,
        wearRR: 0.30,
        pressureLF: 28.5,
        pressureRF: 28.4,
        pressureLR: 30.2,
        pressureRR: 30.1,
      },
      lap: {
        currentLap: 15,
        lapTime: 125450,
        lastLapTime: 125320,
        bestLapTime: 124950,
        deltaToLap: 500,
        deltaToSessionBest: 500,
        isInLap: true,
        isValidLap: true,
      },
      simulator: 'iRacing',
    }));

    // Navigate to dashboard
    setTimeout(() => {
      navigation.navigate('Dashboard');
    }, 500);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium Header */}
        <View style={styles.premiumHeader}>
          <Text style={styles.mainTitle}>🏁 PITWALL</Text>
          <Text style={styles.mainSubtitle}>Simracing Telemetry Hub</Text>
          <View style={styles.headerDivider} />
        </View>

        {/* Status Overview Section */}
        <SectionHeader title="Connection Status" subtitle="System Overview" />
        <View style={styles.statusGrid}>
          <StyledCard variant="default">
            <Text style={styles.statusCardLabel}>Connection</Text>
            <StatusIndicator
              status={telemetry.isConnected ? 'safe' : 'danger'}
              label={telemetry.isConnected ? 'CONNECTED' : 'DISCONNECTED'}
              size="lg"
              style={{ marginTop: SPACING.md }}
            />
          </StyledCard>

          <StyledCard variant="default">
            <Text style={styles.statusCardLabel}>Session</Text>
            <StatusIndicator
              status={session.isRecording ? 'warning' : 'info'}
              label={session.isRecording ? 'RECORDING' : 'IDLE'}
              size="lg"
              style={{ marginTop: SPACING.md }}
            />
            {session.isRecording && (
              <>
                <Text style={[styles.sessionDetailText, { marginTop: SPACING.md }]}>
                  {session.name || 'Unnamed Session'}
                </Text>
                <Text style={styles.sessionDetailText}>{session.game}</Text>
              </>
            )}
          </StyledCard>
        </View>

        {/* Live Telemetry Section */}
        {telemetry.data && (
          <>
            <SectionHeader title="Live Telemetry" subtitle="Real-time Vehicle Data" style={{ marginTop: SPACING.xxl }} />
            <StyledCard variant="accent" title="Vehicle Performance">
              <View style={styles.metricsGrid}>
                <MetricDisplay
                  label="Speed"
                  value={telemetry.data.vehicle.speed.toString()}
                  unit="km/h"
                />
                <MetricDisplay
                  label="RPM"
                  value={telemetry.data.vehicle.rpm.toString()}
                />
                <MetricDisplay
                  label="Gear"
                  value={telemetry.data.vehicle.gear.toString()}
                />
                <MetricDisplay
                  label="Throttle"
                  value={Math.round(telemetry.data.vehicle.controls.throttle * 100).toString()}
                  unit="%"
                />
              </View>

              <Divider variant="accent" spacing="md" />

              <View style={styles.metricsGrid}>
                <MetricDisplay
                  label="Fuel Level"
                  value={telemetry.data.vehicle.fuel.level.toFixed(1)}
                  unit="L"
                />
                <MetricDisplay
                  label="Current Lap"
                  value={`#${telemetry.data.lap.currentLap}`}
                />
              </View>
            </StyledCard>
          </>
        )}

        {/* Error Display */}
        {telemetry.error && (
          <View style={{ marginTop: SPACING.lg }}>
            <AlertBox
              type="error"
              message={telemetry.error}
              onDismiss={() => {}}
            />
          </View>
        )}

        {/* Actions Section */}
        <SectionHeader title="Navigation" subtitle="Quick Access" style={{ marginTop: SPACING.xxl }} />

        <StyledButton
          label="Dashboard with Sample Data"
          variant="primary"
          size="lg"
          fullWidth
          icon="📊"
          onPress={handleLoadSampleTelemetry}
        />

        {telemetry.isConnected && telemetry.data && (
          <StyledButton
            label="Dashboard (Live Data)"
            variant="secondary"
            size="lg"
            fullWidth
            icon="📊"
            style={{ marginTop: SPACING.md }}
            onPress={() => navigation.navigate('Dashboard')}
          />
        )}

        <StyledButton
          label="Voice Settings"
          variant="secondary"
          size="lg"
          fullWidth
          icon="🎙️"
          style={{ marginTop: SPACING.md }}
          onPress={() => navigation.navigate('VoiceSettings')}
        />

        <StyledButton
          label="Settings"
          variant="secondary"
          size="lg"
          fullWidth
          icon="⚙️"
          style={{ marginTop: SPACING.md }}
          onPress={() => navigation.navigate('Settings')}
        />

        {/* Fuel Strategy Button */}
        <StyledButton
          label="Fuel Strategy"
          variant="secondary"
          size="lg"
          fullWidth
          icon="⛽"
          style={{ marginTop: SPACING.md, marginBottom: SPACING.xxxl }}
          onPress={() => navigation.navigate('FuelStrategy')}
        />

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>v1.0.0 • Professional Simracing Platform</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...COMMON_STYLES.screenContainer,
  },

  scrollView: {
    ...COMMON_STYLES.scrollView,
  },

  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },

  // Premium Header
  premiumHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
    paddingVertical: SPACING.xl,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border.primary,
  },

  mainTitle: {
    ...TYPOGRAPHY.heading.h1,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },

  mainSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
  },

  headerDivider: {
    width: 60,
    height: 2,
    backgroundColor: COLORS.accent.cyan,
    marginTop: SPACING.lg,
    borderRadius: 1,
  },

  // Status Grid
  statusGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },

  statusCardLabel: {
    fontSize: 12,
    fontWeight: 'bold' as const,
    color: COLORS.text.secondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  },

  sessionDetailText: {
    fontSize: 13,
    color: COLORS.text.secondary,
    fontWeight: '500' as const,
  },

  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    width: '100%',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.primary,
    marginTop: SPACING.xxl,
  },

  footerText: {
    fontSize: 11,
    color: COLORS.text.tertiary,
    letterSpacing: 0.5,
    fontWeight: '500' as const,
  },
});

