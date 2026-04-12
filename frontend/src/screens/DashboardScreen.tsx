/**
 * Dashboard Screen
 *
 * Screen wrapper for the Smart Dashboard HUD
 * Displays real-time telemetry with professional racing interface
 * Also provides quick access to strategy tools and settings
 */

import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { Dashboard } from '@components/Dashboard';
import { RootNavigationProp } from '../App';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, ANIMATION } from '../utils/theme';

/**
 * Dashboard Screen - Displays the Smart Dashboard HUD
 */
export const DashboardScreen: React.FC<{ navigation?: RootNavigationProp }> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Dashboard />
      
      {/* Quick Access Bar */}
      <View style={styles.quickAccessBar}>
        <PressableButton
          icon="⛽"
          label="FUEL"
          onPress={() => navigation?.navigate('FuelStrategy')}
        />
        
        <PressableButton
          icon="🎙️"
          label="VOICE"
          onPress={() => navigation?.navigate('VoiceSettings')}
        />
        
        <PressableButton
          icon="🏠"
          label="HOME"
          onPress={() => navigation?.navigate('Home')}
        />
      </View>
    </View>
  );
};

/**
 * Quick Access Button Component
 */
interface PressableButtonProps {
  icon: string;
  label: string;
  onPress: () => void;
}

const PressableButton: React.FC<PressableButtonProps> = ({ icon, label, onPress }) => {
  return (
    <Pressable
      style={({ pressed }) => [styles.quickAccessButton, pressed && styles.quickAccessButtonPressed]}
      onPress={onPress}
    >
      <Text style={styles.quickAccessButtonIcon}>{icon}</Text>
      <Text style={styles.quickAccessButtonText}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  
  quickAccessBar: {
    position: 'absolute',
    bottom: SPACING.lg,
    left: SPACING.lg,
    right: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.background.secondary,
    borderTopWidth: 2,
    borderTopColor: COLORS.accent.cyan,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    ...SHADOWS.lg,
  },
  
  quickAccessButton: {
    flex: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  
  quickAccessButtonPressed: {
    backgroundColor: COLORS.background.tertiary,
    borderColor: COLORS.accent.cyan,
    ...SHADOWS.md,
  },
  
  quickAccessButtonIcon: {
    fontSize: 18,
  },
  
  quickAccessButtonText: {
    color: COLORS.accent.cyan,
    fontSize: 10,
    fontWeight: 'bold' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
