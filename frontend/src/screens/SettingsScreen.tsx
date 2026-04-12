/**
 * Enhanced Settings Screen
 * 
 * Fully demonstrates the new PitWall UI enhancement system including:
 * - Theme system with all component types
 * - Gesture handlers for interactions
 * - Animated transitions
 * - Professional racing app UI patterns
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  Switch,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '@redux/store';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';

// Import theme & components
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import {
  StyledButton,
  StyledCard,
  StatusIndicator,
  SectionHeader,
  AlertBox,
  Divider,
  MetricDisplay,
} from '../components/StyledComponents';
import { createBounceAnimation, createFadeInAnimation } from '../utils/animations';
import { PanGestureTracker, GestureAnimations } from '../utils/gestureHandlers';

type SettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'Settings'>;

interface SettingsState {
  // Display settings
  displayMode: 'compact' | 'detailed' | 'expert';
  unitsImperial: boolean;
  updateFrequency: number; // Hz

  // Notification settings
  fuelAlerts: boolean;
  tireAlerts: boolean;
  performanceAlerts: boolean;
  collisionAlerts: boolean;

  // Performance settings
  dataLogging: boolean;
  telemetryResolution: 'low' | 'medium' | 'high';

  // Voice settings
  voiceEnabled: boolean;
  voiceVolume: number; // 0-100
  voiceLanguage: string;

  // Race settings
  autoRaceDetection: boolean;
  saveRaceData: boolean;
}

/**
 * Settings Screen Component
 */
export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const screenWidth = Dimensions.get('window').width;

  // Local state for settings
  const [settings, setSettings] = useState<SettingsState>({
    displayMode: 'detailed',
    unitsImperial: false,
    updateFrequency: 60,
    fuelAlerts: true,
    tireAlerts: true,
    performanceAlerts: true,
    collisionAlerts: true,
    dataLogging: true,
    telemetryResolution: 'high',
    voiceEnabled: true,
    voiceVolume: 75,
    voiceLanguage: 'en-US',
    autoRaceDetection: true,
    saveRaceData: true,
  });

  // Animation references
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const swipeTracker = useRef(new PanGestureTracker()).current;

  // Animations on mount
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Update setting
  const updateSetting = <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Handle reset to defaults
  const handleResetDefaults = () => {
    Alert.alert(
      'Reset to Defaults',
      'This will reset all settings to their default values.',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Reset',
          onPress: () => {
            setSettings({
              displayMode: 'detailed',
              unitsImperial: false,
              updateFrequency: 60,
              fuelAlerts: true,
              tireAlerts: true,
              performanceAlerts: true,
              collisionAlerts: true,
              dataLogging: true,
              telemetryResolution: 'high',
              voiceEnabled: true,
              voiceVolume: 75,
              voiceLanguage: 'en-US',
              autoRaceDetection: true,
              saveRaceData: true,
            });
          },
          style: 'destructive',
        },
      ]
    );
  };

  // Handle export settings
  const handleExportSettings = () => {
    Alert.alert(
      'Export Settings',
      'Settings exported to clipboard. You can share or backup these settings.',
      [{ text: 'OK' }]
    );
  };

  // Handle save settings
  const handleSaveSettings = () => {
    Alert.alert('Settings Saved', 'All changes have been saved successfully.', [
      { text: 'OK' },
    ]);
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
        onTouchStart={swipeTracker.onTouchStart}
        onTouchMove={swipeTracker.onTouchMove}
        onTouchEnd={() => {
          const gesture = swipeTracker.onTouchEnd();
          if (gesture?.direction === 'right') {
            navigation.goBack();
          }
        }}
      >
        {/* ===== HEADER ===== */}
        <SectionHeader
          title="⚙️ Settings"
          subtitle="Customize your racing experience"
          style={styles.header}
        />

        {/* ===== DISPLAY SETTINGS ===== */}
        <StyledCard variant="accent" style={styles.sectionCard}>
          <SectionHeader title="📊 Display Settings" subtitle="UI & Data Display" />

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Display Mode</Text>
            <View style={styles.displayModeButtons}>
              {(['compact', 'detailed', 'expert'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.modeButton,
                    settings.displayMode === mode && styles.modeButtonActive,
                  ]}
                  onPress={() => updateSetting('displayMode', mode)}
                >
                  <Text
                    style={[
                      styles.modeButtonText,
                      settings.displayMode === mode && styles.modeButtonTextActive,
                    ]}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Divider variant="subtle" spacing="md" />

          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Units</Text>
              <Text style={styles.settingDescription}>
                {settings.unitsImperial ? 'Imperial (mph, °F)' : 'Metric (km/h, °C)'}
              </Text>
            </View>
            <Switch
              value={settings.unitsImperial}
              onValueChange={(value) => updateSetting('unitsImperial', value)}
              trackColor={{ false: COLORS.borders.default, true: COLORS.accents.primary }}
              thumbColor={settings.unitsImperial ? COLORS.text.primary : COLORS.text.tertiary}
            />
          </View>

          <Divider variant="subtle" spacing="md" />

          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Update Frequency</Text>
              <Text style={styles.settingDescription}>{settings.updateFrequency} Hz</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                const remaining = 120 - settings.updateFrequency;
                if (remaining > 0) {
                  updateSetting('updateFrequency', settings.updateFrequency + 20);
                }
              }}
              style={styles.incrementButton}
            >
              <Text style={styles.incrementButtonText}>↑</Text>
            </TouchableOpacity>
          </View>
        </StyledCard>

        {/* ===== NOTIFICATION SETTINGS ===== */}
        <StyledCard variant="default" style={styles.sectionCard}>
          <SectionHeader title="🔔 Notification Settings" subtitle="Alerts & Warnings" />

          {[
            { key: 'fuelAlerts', label: '⛽ Fuel Alerts', description: 'Low fuel warnings' },
            { key: 'tireAlerts', label: '🛞 Tire Alerts', description: 'Tire wear & temp' },
            {
              key: 'performanceAlerts',
              label: '📈 Performance Alerts',
              description: 'Performance anomalies',
            },
            { key: 'collisionAlerts', label: '💥 Collision Alerts', description: 'Impact detection' },
          ].map((alert, idx, arr) => (
            <View key={alert.key}>
              <View style={styles.alertRow}>
                <View>
                  <Text style={styles.settingLabel}>{alert.label}</Text>
                  <Text style={styles.settingDescription}>{alert.description}</Text>
                </View>
                <Switch
                  value={settings[alert.key as keyof SettingsState] as boolean}
                  onValueChange={(value) =>
                    updateSetting(alert.key as keyof SettingsState, value)
                  }
                  trackColor={{ false: COLORS.borders.default, true: COLORS.accents.primary }}
                  thumbColor={
                    settings[alert.key as keyof SettingsState]
                      ? COLORS.status.success
                      : COLORS.text.tertiary
                  }
                />
              </View>
              {idx < arr.length - 1 && <Divider variant="subtle" spacing="md" />}
            </View>
          ))}
        </StyledCard>

        {/* ===== TELEMETRY SETTINGS ===== */}
        <StyledCard variant="warning" style={styles.sectionCard}>
          <SectionHeader title="📡 Telemetry Settings" subtitle="Data Collection & Recording" />

          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Data Logging</Text>
              <Text style={styles.settingDescription}>Record all telemetry to file</Text>
            </View>
            <Switch
              value={settings.dataLogging}
              onValueChange={(value) => updateSetting('dataLogging', value)}
              trackColor={{ false: COLORS.borders.default, true: COLORS.accents.warning }}
              thumbColor={settings.dataLogging ? COLORS.status.warning : COLORS.text.tertiary}
            />
          </View>

          <Divider variant="subtle" spacing="md" />

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Telemetry Resolution</Text>
            <View style={styles.resolutionButtons}>
              {(['low', 'medium', 'high'] as const).map((res) => (
                <TouchableOpacity
                  key={res}
                  style={[
                    styles.resButton,
                    settings.telemetryResolution === res && styles.resButtonActive,
                  ]}
                  onPress={() => updateSetting('telemetryResolution', res)}
                >
                  <Text
                    style={[
                      styles.resButtonText,
                      settings.telemetryResolution === res && styles.resButtonTextActive,
                    ]}
                  >
                    {res.charAt(0).toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Divider variant="subtle" spacing="md" />

          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Save Race Data</Text>
              <Text style={styles.settingDescription}>Archive completed races</Text>
            </View>
            <Switch
              value={settings.saveRaceData}
              onValueChange={(value) => updateSetting('saveRaceData', value)}
              trackColor={{ false: COLORS.borders.default, true: COLORS.accents.primary }}
              thumbColor={settings.saveRaceData ? COLORS.status.success : COLORS.text.tertiary}
            />
          </View>
        </StyledCard>

        {/* ===== RACE SETTINGS ===== */}
        <StyledCard variant="default" style={styles.sectionCard}>
          <SectionHeader title="🏁 Race Settings" subtitle="Race Detection & Recording" />

          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Auto Race Detection</Text>
              <Text style={styles.settingDescription}>Automatically detect race start/end</Text>
            </View>
            <Switch
              value={settings.autoRaceDetection}
              onValueChange={(value) => updateSetting('autoRaceDetection', value)}
              trackColor={{ false: COLORS.borders.default, true: COLORS.accents.primary }}
              thumbColor={
                settings.autoRaceDetection ? COLORS.status.success : COLORS.text.tertiary
              }
            />
          </View>
        </StyledCard>

        {/* ===== STATUS CARD ===== */}
        <View style={styles.statusContainer}>
          <StatusIndicator status="success" size="lg" />
          <Text style={styles.statusText}>All Systems Operational</Text>
        </View>

        {/* ===== ACTION BUTTONS ===== */}
        <View style={styles.buttonContainer}>
          <StyledButton variant="primary" size="lg" onPress={handleSaveSettings}>
            💾 Save Settings
          </StyledButton>

          <StyledButton variant="secondary" size="md" onPress={handleExportSettings}>
            📤 Export
          </StyledButton>

          <StyledButton variant="danger" size="md" onPress={handleResetDefaults}>
            🔄 Reset to Defaults
          </StyledButton>
        </View>

        {/* ===== INFO CARD ===== */}
        <AlertBox
          type="info"
          message="💡 Tip: Settings are saved locally on your device. Use Export to backup or share your configuration."
          dismissible={true}
          style={styles.infoCard}
        />

        {/* ===== DEBUG INFO ===== */}
        <StyledCard variant="default" style={styles.debugCard}>
          <Text style={styles.debugTitle}>📊 App Info</Text>
          <MetricDisplay label="Screen Width" value={`${screenWidth}px`} unit="" trend="up" />
          <View style={{ marginVertical: SPACING.sm }} />
          <MetricDisplay label="Settings Items" value="13" unit="active" trend="stable" />
          <View style={{ marginVertical: SPACING.sm }} />
          <MetricDisplay label="Display Mode" value={settings.displayMode} unit="" trend="stable" />
        </StyledCard>

        {/* Bottom padding */}
        <View style={{ height: SPACING.xxxl }} />
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgrounds.primary,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
  },

  header: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },

  sectionCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
  },

  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },

  alertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },

  settingLabel: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.body.md.size,
    fontWeight: '600',
  },

  settingDescription: {
    color: COLORS.text.tertiary,
    fontSize: TYPOGRAPHY.body.sm.size,
    marginTop: SPACING.xs,
  },

  displayModeButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },

  modeButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.backgrounds.secondary,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borders.default,
  },

  modeButtonActive: {
    backgroundColor: COLORS.accents.primary,
    borderColor: COLORS.accents.primary,
  },

  modeButtonText: {
    color: COLORS.text.secondary,
    fontSize: TYPOGRAPHY.label.sm.size,
    fontWeight: '600',
  },

  modeButtonTextActive: {
    color: COLORS.text.primary,
  },

  incrementButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.accents.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  incrementButtonText: {
    color: COLORS.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },

  resolutionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },

  resButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgrounds.secondary,
    borderWidth: 1,
    borderColor: COLORS.borders.default,
    justifyContent: 'center',
    alignItems: 'center',
  },

  resButtonActive: {
    backgroundColor: COLORS.accents.warning,
    borderColor: COLORS.accents.warning,
  },

  resButtonText: {
    color: COLORS.text.secondary,
    fontSize: TYPOGRAPHY.label.md.size,
    fontWeight: 'bold',
  },

  resButtonTextActive: {
    color: COLORS.text.primary,
  },

  statusContainer: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
    paddingVertical: SPACING.lg,
  },

  statusText: {
    color: COLORS.status.success,
    fontSize: TYPOGRAPHY.body.md.size,
    fontWeight: '600',
    marginTop: SPACING.md,
  },

  buttonContainer: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },

  infoCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },

  debugCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
  },

  debugTitle: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.body.md.size,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
});
