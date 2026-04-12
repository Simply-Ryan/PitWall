/**
 * Voice Settings Screen
 * 
 * Allows users to configure voice notifications including:
 * - Enable/disable voice feedback
 * - Volume and speech rate control
 * - Notification type preferences
 * - Voice selection
 */

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Pressable,
} from 'react-native';
import Slider from '@react-native-community/slider';
import VoiceService from '../services/VoiceService';
import { useVoice } from '../hooks/useVoice';
import { VoiceNotificationType } from '../types/voice';
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
  SectionHeader,
  Divider,
} from '../components/StyledComponents';

export const VoiceSettingsScreen: React.FC = () => {
  const { voiceSettings, updateSettings } = useVoice();
  const [testMessage, setTestMessage] = useState('');

  const handleToggleNotificationType = (type: VoiceNotificationType) => {
    const types = new Set(voiceSettings.notificationTypes);
    if (types.has(type)) {
      types.delete(type);
    } else {
      types.add(type);
    }
    updateSettings({ notificationTypes: types });
  };

  const handleTestSpeak = async () => {
    const message =
      testMessage || `Test message at ${voiceSettings.rate}x speed`;
    try {
      await VoiceService.speak({
        id: 'test',
        type: VoiceNotificationType.CUSTOM,
        message,
        timestamp: Date.now(),
        priority: 'low',
        spoken: false,
      });
      Alert.alert('Test', 'Speaking test message...');
    } catch (error) {
      Alert.alert('Error', 'Failed to speak test message');
    }
  };

  const notificationOptions = [
    { type: VoiceNotificationType.UPSHIFT, label: 'Upshift Callouts' },
    { type: VoiceNotificationType.DOWNSHIFT, label: 'Downshift Callouts' },
    { type: VoiceNotificationType.REDLINE_WARNING, label: 'Redline Warnings' },
    { type: VoiceNotificationType.LOW_FUEL, label: 'Low Fuel Warnings' },
    { type: VoiceNotificationType.FUEL_CRITICAL, label: 'Critical Fuel' },
    { type: VoiceNotificationType.TIRE_COLD, label: 'Cold Tire Warnings' },
    { type: VoiceNotificationType.TIRE_HOT, label: 'Hot Tire Warnings' },
    {
      type: VoiceNotificationType.NEW_PERSONAL_BEST,
      label: 'Personal Best Records',
    },
    { type: VoiceNotificationType.BRAKE_HARD, label: 'Hard Braking' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Premium Header */}
        <View style={styles.premiumHeader}>
          <Text style={styles.screenTitle}>🎙️ VOICE SETTINGS</Text>
          <Text style={styles.screenSubtitle}>Callout Customization</Text>
        </View>

        {/* Master Enable/Disable */}
        <View style={styles.sectionContainer}>
          <SectionHeader title="Voice Notifications" subtitle="Main Control" />
          <StyledCard variant="default">
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Enable Voice Feedback</Text>
              <Switch
                value={voiceSettings.enabled}
                onValueChange={(value) => updateSettings({ enabled: value })}
                trackColor={{
                  false: COLORS.border.primary,
                  true: COLORS.accent.cyan,
                }}
                thumbColor={
                  voiceSettings.enabled ? COLORS.accent.cyan : COLORS.text.secondary
                }
              />
            </View>
          </StyledCard>
        </View>

        {/* Volume Control */}
        <View style={styles.sectionContainer}>
          <SectionHeader title="Volume Control" subtitle="Notification Loudness" />
          <StyledCard variant="default">
            <View style={styles.controlContainer}>
              <View style={styles.controlHeader}>
                <Text style={styles.controlLabel}>Master Volume</Text>
                <Text style={styles.controlValue}>{Math.round(voiceSettings.volume * 100)}%</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                step={0.05}
                value={voiceSettings.volume}
                onValueChange={(value) => updateSettings({ volume: value })}
                minimumTrackTintColor={COLORS.accent.cyan}
                maximumTrackTintColor={COLORS.border.primary}
                thumbTintColor={COLORS.accent.cyan}
              />
            </View>
          </StyledCard>
        </View>

        {/* Speech Rate Control */}
        <View style={styles.sectionContainer}>
          <SectionHeader title="Speech Rate" subtitle="Playback Speed" />
          <StyledCard variant="default">
            <View style={styles.controlContainer}>
              <View style={styles.controlHeader}>
                <Text style={styles.controlLabel}>Speech Speed</Text>
                <Text style={styles.controlValue}>{voiceSettings.rate.toFixed(1)}x</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0.5}
                maximumValue={2}
                step={0.1}
                value={voiceSettings.rate}
                onValueChange={(value) => updateSettings({ rate: value })}
                minimumTrackTintColor={COLORS.accent.cyan}
                maximumTrackTintColor={COLORS.border.primary}
                thumbTintColor={COLORS.accent.cyan}
              />
              <Text style={styles.helperText}>Range: 0.5x (slower) to 2.0x (faster)</Text>
            </View>
          </StyledCard>
        </View>

        {/* Pitch Control */}
        <View style={styles.sectionContainer}>
          <SectionHeader title="Pitch" subtitle="Voice Tone" />
          <StyledCard variant="default">
            <View style={styles.controlContainer}>
              <View style={styles.controlHeader}>
                <Text style={styles.controlLabel}>Voice Pitch</Text>
                <Text style={styles.controlValue}>{voiceSettings.pitch.toFixed(1)}x</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0.5}
                maximumValue={2}
                step={0.1}
                value={voiceSettings.pitch}
                onValueChange={(value) => updateSettings({ pitch: value })}
                minimumTrackTintColor={COLORS.accent.cyan}
                maximumTrackTintColor={COLORS.border.primary}
                thumbTintColor={COLORS.accent.cyan}
              />
            </View>
          </StyledCard>
        </View>

        {/* Throttling Control */}
        <View style={styles.sectionContainer}>
          <SectionHeader
            title="Callout Throttling"
            subtitle="Reduce Notification Spam"
          />
          <StyledCard variant="default">
            <View style={styles.controlContainer}>
              <View style={styles.controlHeader}>
                <Text style={styles.controlLabel}>Min Between Callouts</Text>
                <Text style={styles.controlValue}>
                  {Math.round(voiceSettings.minTimeBetweenCallouts)}ms
                </Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={200}
                maximumValue={2000}
                step={100}
                value={voiceSettings.minTimeBetweenCallouts}
                onValueChange={(value) =>
                  updateSettings({ minTimeBetweenCallouts: value })
                }
                minimumTrackTintColor={COLORS.accent.cyan}
                maximumTrackTintColor={COLORS.border.primary}
                thumbTintColor={COLORS.accent.cyan}
              />
              <Text style={styles.helperText}>
                Minimum time between similar callouts to avoid spam
              </Text>
            </View>
          </StyledCard>
        </View>

        {/* Muting Options */}
        <View style={styles.sectionContainer}>
          <SectionHeader title="Muting Options" subtitle="Context-Aware Silence" />
          <StyledCard variant="default">
            <View style={styles.mutingOptions}>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Mute During Hard Braking</Text>
                <Switch
                  value={voiceSettings.muteWhenBraking}
                  onValueChange={(value) =>
                    updateSettings({ muteWhenBraking: value })
                  }
                  trackColor={{
                    false: COLORS.border.primary,
                    true: COLORS.accent.cyan,
                  }}
                  thumbColor={
                    voiceSettings.muteWhenBraking
                      ? COLORS.accent.cyan
                      : COLORS.text.secondary
                  }
                />
              </View>
              <Divider variant="light" spacing="md" />
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Mute at High Throttle</Text>
                <Switch
                  value={voiceSettings.muteWhenThrottling}
                  onValueChange={(value) =>
                    updateSettings({ muteWhenThrottling: value })
                  }
                  trackColor={{
                    false: COLORS.border.primary,
                    true: COLORS.accent.cyan,
                  }}
                  thumbColor={
                    voiceSettings.muteWhenThrottling
                      ? COLORS.accent.cyan
                      : COLORS.text.secondary
                  }
                />
              </View>
            </View>
          </StyledCard>
        </View>

        {/* Notification Preferences */}
        <View style={styles.sectionContainer}>
          <SectionHeader title="Notification Types" subtitle="Enable/Disable Callouts" />
          <StyledCard variant="default">
            <View style={styles.notificationGrid}>
              {notificationOptions.map((option, index) => (
                <Pressable
                  key={option.type}
                  style={({ pressed }) => [
                    styles.checkboxRow,
                    pressed && styles.checkboxRowPressed,
                  ]}
                  onPress={() => handleToggleNotificationType(option.type)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      voiceSettings.notificationTypes.has(option.type) &&
                        styles.checkboxChecked,
                    ]}
                  >
                    {voiceSettings.notificationTypes.has(option.type) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>{option.label}</Text>
                </Pressable>
              ))}
            </View>
          </StyledCard>
        </View>

        {/* Test Speaker */}
        <View style={styles.sectionContainer}>
          <SectionHeader title="Test Voice" subtitle="Preview Settings" />
          <StyledButton
            label="Test Speaker"
            variant="success"
            size="lg"
            fullWidth
            icon="🔊"
            onPress={handleTestSpeak}
          />
        </View>

        {/* Info */}
        <View style={styles.sectionContainer}>
          <StyledCard variant="default">
            <Text style={styles.infoText}>
              💡 Voice callouts are automatically triggered during racing based on
              real-time telemetry data. Customize above to personalize your racing
              experience and improve your performance on track.
            </Text>
          </StyledCard>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...COMMON_STYLES.screenContainer,
  },

  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },

  // Premium Header
  premiumHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
    paddingBottom: SPACING.xl,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border.primary,
  },

  screenTitle: {
    ...TYPOGRAPHY.heading.h2,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
    letterSpacing: 2,
  },

  screenSubtitle: {
    fontSize: 13,
    color: COLORS.text.secondary,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
  },

  // Section Container
  sectionContainer: {
    marginBottom: SPACING.xl,
  },

  // Setting Row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
  },

  settingLabel: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontWeight: '500' as const,
    flex: 1,
  },

  // Control Container
  controlContainer: {
    gap: SPACING.md,
  },

  controlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },

  controlLabel: {
    fontSize: 13,
    color: COLORS.text.secondary,
    fontWeight: 'bold' as const,
    letterSpacing: 0.5,
  },

  controlValue: {
    fontSize: 14,
    color: COLORS.accent.cyan,
    fontWeight: 'bold' as const,
  },

  slider: {
    width: '100%',
    height: 40,
  },

  helperText: {
    fontSize: 11,
    color: COLORS.text.tertiary,
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },

  // Muting Options
  mutingOptions: {
    gap: SPACING.md,
  },

  // Notification Grid
  notificationGrid: {
    gap: SPACING.md,
  },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },

  checkboxRowPressed: {
    opacity: 0.7,
  },

  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: COLORS.accent.cyan,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkboxChecked: {
    backgroundColor: COLORS.accent.cyan,
  },

  checkmark: {
    color: COLORS.background.primary,
    fontSize: 14,
    fontWeight: 'bold' as const,
  },

  checkboxLabel: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontWeight: '500' as const,
    flex: 1,
  },

  // Info Text
  infoText: {
    fontSize: 13,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
    lineHeight: 20,
    fontWeight: '500' as const,
  },

  // Spacer
  spacer: {
    height: SPACING.xxxl,
  },
});
