import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAppSelector, useAppDispatch } from '@redux/store';
import { setCurrentScreen } from '@redux/slices/uiSlice';
import { updateTelemetry, setConnected } from '@redux/slices/telemetrySlice';
import { startSession } from '@redux/slices/sessionSlice';
import type { RootNavigationProp } from '../App';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';

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
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🏁 PitWall</Text>
          <Text style={styles.subtitle}>Simracing Telemetry Hub</Text>
        </View>

        {/* Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>

          {/* Connection Status */}
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Connection</Text>
            <Text
              style={[styles.statusValue, telemetry.isConnected ? styles.statusConnected : styles.statusDisconnected]}
            >
              {telemetry.isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </Text>
          </View>

          {/* Session Status */}
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Session</Text>
            {session.isRecording ? (
              <View>
                <Text style={styles.statusRecording}>🔴 RECORDING</Text>
                <Text style={styles.sessionInfo}>{session.name || 'Unnamed'}</Text>
                <Text style={styles.sessionInfo}>{session.game}</Text>
              </View>
            ) : (
              <Text style={styles.statusIdle}>⚪ Idle</Text>
            )}
          </View>
        </View>

        {/* Live Telemetry Section */}
        {telemetry.data && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Live Telemetry</Text>

            <View style={styles.telemRow}>
              <View style={styles.telemCell}>
                <Text style={styles.telemLabel}>Speed</Text>
                <Text style={styles.telemValue}>{telemetry.data.vehicle.speed} km/h</Text>
              </View>
              <View style={styles.telemCell}>
                <Text style={styles.telemLabel}>Gear</Text>
                <Text style={styles.telemValue}>{telemetry.data.vehicle.gear}</Text>
              </View>
              <View style={styles.telemCell}>
                <Text style={styles.telemLabel}>RPM</Text>
                <Text style={styles.telemValue}>{telemetry.data.vehicle.rpm}</Text>
              </View>
            </View>

            <View style={styles.telemRow}>
              <View style={styles.telemCell}>
                <Text style={styles.telemLabel}>Throttle</Text>
                <Text style={styles.telemValue}>{Math.round(telemetry.data.vehicle.controls.throttle * 100)}%</Text>
              </View>
              <View style={styles.telemCell}>
                <Text style={styles.telemLabel}>Fuel</Text>
                <Text style={styles.telemValue}>{telemetry.data.vehicle.fuel.level.toFixed(1)}L</Text>
              </View>
              <View style={styles.telemCell}>
                <Text style={styles.telemLabel}>Lap</Text>
                <Text style={styles.telemValue}>#{telemetry.data.lap.currentLap}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Error Display */}
        {telemetry.error && (
          <View style={styles.errorSection}>
            <Text style={styles.errorTitle}>Error</Text>
            <Text style={styles.errorMessage}>{telemetry.error}</Text>
          </View>
        )}

        {/* Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={handleLoadSampleTelemetry}
          >
            <Text style={styles.buttonText}>📊 View Dashboard (with Sample Data)</Text>
          </TouchableOpacity>

          {telemetry.isConnected && telemetry.data && (
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate('Dashboard')}
            >
              <Text style={styles.buttonText}>📊 View Dashboard (Live Data)</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: 16,
  },

  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 16,
  },

  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 14,
    color: '#AAAAAA',
  },

  section: {
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#CCCCCC',
    marginBottom: 12,
  },

  statusItem: {
    backgroundColor: '#111111',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },

  statusLabel: {
    color: '#888888',
    fontSize: 12,
    marginBottom: 4,
  },

  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  statusConnected: {
    color: '#00FF00',
  },

  statusDisconnected: {
    color: '#FF4444',
  },

  statusRecording: {
    color: '#FF0000',
    fontSize: 16,
    fontWeight: 'bold',
  },

  statusIdle: {
    color: '#AAAAAA',
    fontSize: 14,
  },

  sessionInfo: {
    color: '#CCCCCC',
    fontSize: 12,
    marginTop: 4,
  },

  telemRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },

  telemCell: {
    flex: 1,
    backgroundColor: '#111111',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
  },

  telemLabel: {
    color: '#888888',
    fontSize: 11,
    marginBottom: 4,
  },

  telemValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  errorSection: {
    backgroundColor: '#330000',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF0000',
    padding: 12,
    marginBottom: 20,
  },

  errorTitle: {
    color: '#FF4444',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },

  errorMessage: {
    color: '#FFAAAA',
    fontSize: 12,
  },

  button: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    alignItems: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
        </View>
      )}

      {/* Development Notes */}
      <View style={styles.footer}>
        <Text style={styles.note}>v0.1.0 - Phase 1: Foundation</Text>
        <Text style={styles.note}>Phase 2 coming soon: Live Dashboard</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 40,
  },
  statusSection: {
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
    paddingBottom: 15,
  },
  label: {
    fontSize: 12,
    color: '#666666',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  status: {
    fontSize: 16,
    fontWeight: '600',
  },
  connected: {
    color: '#00FF00',
  },
  disconnected: {
    color: '#FF0000',
  },
  recording: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF0000',
  },
  idle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888888',
  },
  telemSection: {
    marginBottom: 30,
    backgroundColor: '#111111',
    padding: 15,
    borderRadius: 8,
  },
  telemData: {
    fontSize: 14,
    color: '#CCCCCC',
    marginTop: 8,
    fontFamily: 'Courier New',
  },
  footer: {
    marginTop: 50,
    borderTopWidth: 1,
    borderTopColor: '#222222',
    paddingTop: 15,
  },
  note: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 4,
  },
});
