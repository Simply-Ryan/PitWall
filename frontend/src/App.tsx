import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Provider } from 'react-redux';
import { store } from '@redux/store';
import { HomeScreen, DashboardScreen } from '@screens';

/**
 * Navigation stack parameter list
 * Defines all available screens and their parameters
 */
export type RootStackParamList = {
  Home: undefined;
  Dashboard: undefined;
};

/**
 * Type-safe navigation prop
 */
export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Root application component
 *
 * Sets up Redux provider, navigation, and status bar configuration
 */
export const App: React.FC = () => {
  useEffect(() => {
    // TODO: Initialize application state and connections
    // - Connect to Telemetry Bridge WebSocket
    // - Verify backend API availability
    // - Load user preferences
  }, []);

  return (
    <Provider store={store}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            gestureEnabled: false,
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ animationEnabled: false }}
          />
          <Stack.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{ animationEnabled: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
};

export default App;
