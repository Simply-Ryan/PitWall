/**
 * Dashboard Screen
 *
 * Screen wrapper for the Smart Dashboard HUD
 * Displays real-time telemetry with professional racing interface
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Dashboard } from '@components/Dashboard';

/**
 * Dashboard Screen - Displays the Smart Dashboard HUD
 */
export const DashboardScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Dashboard />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
