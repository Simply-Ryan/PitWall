# Quick Start - Building Your First Enhanced Screen

This guide shows you how to build a new screen using all the utilities in under 5 minutes.

## Step 1: Create Your Screen File

Create `frontend/src/screens/MyNewScreen.tsx`:

```typescript
import React, { useRef, useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, Animated } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';

// Theme
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, COMMON_STYLES } from '../utils/theme';

// Components
import { StyledButton, StyledCard, SectionHeader, AlertBox } from '../components/StyledComponents';

// Animations
import { createFadeInAnimation } from '../utils/animations';

// Data service
import { telemetryDataService } from '../services/TelemetryDataService';

type MyNewScreenProps = NativeStackScreenProps<RootStackParamList, 'MyNewScreen'>;

export const MyNewScreen: React.FC<MyNewScreenProps> = ({ navigation }) => {
  // Setup animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Get formatted data
  const summary = telemetryDataService.getDashboardSummary();
  const alerts = telemetryDataService.getActiveAlerts();

  // Animate on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  if (!summary) {
    return (
      <View style={styles.container}>
        <Text>No telemetry data available</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader 
          title="My Screen" 
          subtitle="Real-time data demo"
        />

        {/* Display key metrics */}
        <StyledCard variant="accent">
          <Text style={styles.label}>Speed</Text>
          <Text style={styles.value}>{summary.speed}</Text>
        </StyledCard>

        {/* Show active alerts */}
        {alerts.map((alert) => (
          <AlertBox
            key={`${alert.type}-${alert.severity}`}
            type={alert.severity === 'critical' ? 'error' : 
                 alert.severity === 'warning' ? 'warning' : 'info'}
            message={alert.message}
            dismissible
          />
        ))}

        {/* Actions */}
        <StyledButton 
          variant="primary" 
          size="lg"
          onPress={() => navigation.goBack()}
        >
          Go Back
        </StyledButton>
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...COMMON_STYLES.screenContainer,
  },
  
  content: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },

  label: {
    color: COLORS.text.secondary,
    fontSize: TYPOGRAPHY.body.sm.size,
  },

  value: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.heading.lg.size,
    fontWeight: 'bold',
    marginTop: SPACING.sm,
  },
});
```

## Step 2: Add to Navigation

**In `App.tsx`:**

```typescript
// 1. Import the component
import { MyNewScreen } from '@screens';

// 2. Add to RootStackParamList
export type RootStackParamList = {
  // ... existing screens
  MyNewScreen: undefined;
};

// 3. Add screen to navigator
<Stack.Screen
  name="MyNewScreen"
  component={MyNewScreen}
  options={{ animationEnabled: false }}
/>
```

## Step 3: Create Navigation Button

**In `HomeScreen.tsx` or another screen:**

```typescript
<StyledButton
  variant="secondary"
  size="lg"
  fullWidth
  icon="📊"
  style={{ marginTop: SPACING.md }}
  onPress={() => navigation.navigate('MyNewScreen')}
>
  My New Screen
</StyledButton>
```

## Step 4: Export the Screen

**In `screens/index.ts`:**

```typescript
export { MyNewScreen } from './MyNewScreen';
```

## Done! 🎉

You now have a fully-functional screen using:
- ✅ Theme system
- ✅ UI components
- ✅ Animations
- ✅ Data service
- ✅ Professional styling
- ✅ Zero TypeScript errors

---

## What TelemetryDataService Provides

```typescript
// Initialize (usually in App.tsx)
telemetryDataService.setStore(store);

// Access formatted data
const summary = telemetryDataService.getDashboardSummary();
// {
//   isConnected: boolean,
//   isInRace: boolean,
//   currentLap: number,
//   totalLaps: number,
//   position: string,      // "1st", "1st/12", etc.
//   lapTime: string,       // "1:23.45"
//   delta: string,         // "+0:00.50"
//   fuel: string,          // "35.2L"
//   fuelStatus: 'safe' | 'warning' | 'critical',
//   throttle: string,      // "85%"
//   brake: string,         // "45%"
//   speed: string,         // "250 km/h"
//   rpm: string,           // "7500/9000"
//   avgTireTemp: string,   // "92°C"
//   avgTireWear: string    // "35%"
// }

// Get full telemetry (all vehicles data)
const full = telemetryDataService.getFormattedTelemetry();

// Get specific formatted value
const speed = telemetryDataService.getFormatted('speed');

// Get active alerts
const alerts = telemetryDataService.getActiveAlerts();
// [
//   { type: 'fuel', severity: 'warning', message: 'Low fuel' },
//   { type: 'tire', severity: 'warning', message: 'Tire wear critical' }
// ]

// Check if alert should show
if (telemetryDataService.shouldShowAlert('fuel')) {
  // Show fuel warning
}
```

---

## Common Theme Constants

```typescript
// Colors
COLORS.text.primary          // White
COLORS.text.secondary        // Gray
COLORS.text.tertiary         // Dark gray
COLORS.backgrounds.primary   // Dark background
COLORS.backgrounds.secondary // Darker background
COLORS.status.success        // Green
COLORS.status.warning        // Yellow
COLORS.status.danger         // Red
COLORS.accents.primary       // Cyan

// Spacing (in pixels)
SPACING.xs    // 4
SPACING.sm    // 8
SPACING.md    // 12
SPACING.lg    // 16
SPACING.xl    // 20
SPACING.xxl   // 24
SPACING.xxxl  // 32

// Typography
TYPOGRAPHY.heading.lg.size      // 32
TYPOGRAPHY.heading.md.size      // 24
TYPOGRAPHY.heading.sm.size      // 18
TYPOGRAPHY.body.lg.size         // 16
TYPOGRAPHY.body.md.size         // 14
TYPOGRAPHY.body.sm.size         // 12
TYPOGRAPHY.label.md.size        // 12
TYPOGRAPHY.label.sm.size        // 10

// Border radius
BORDER_RADIUS.xs   // 4
BORDER_RADIUS.sm   // 8
BORDER_RADIUS.md   // 12
BORDER_RADIUS.lg   // 16

// Common styles
COMMON_STYLES.screenContainer  // flex: 1, bg color
COMMON_STYLES.scrollView       // scroll view defaults
```

---

## All Available Components

```typescript
import {
  // Button component
  StyledButton,              // Primary, secondary, danger variants
  
  // Card component  
  StyledCard,                // default, accent, warning, danger variants
  
  // Status indicator
  StatusIndicator,           // For showing status (safe, warning, danger, info)
  
  // Metric display
  MetricDisplay,             // Value + unit + trend arrow
  
  // Section header
  SectionHeader,             // Title + subtitle for sections
  
  // Grid layout
  GridLayout,                // Responsive column grid
  
  // Alert boxes
  AlertBox,                  // Info, warning, error, success alerts
  
  // Divider
  Divider,                   // subtle, accent, default variants
} from '../components/StyledComponents';
```

---

## All Available Formatters

```typescript
import * as formatters from '../utils/formatters';

// Time
formatters.formatTime(ms)              // "MM:SS.mmm"
formatters.formatDelta(ms)             // "+/-M:SS.mm"
formatters.formatSessionDuration(ms)   // "Xh Ym"

// Speed
formatters.formatSpeed(kmh)            // "XXX km/h"
formatters.formatRPM(rpm, max)         // "XXXX" or "XXXX/YYYY"

// Fuel
formatters.formatFuel(liters)          // "XX.XL"
formatters.formatConsumption(l_per_lap) // "X.XXXL/lap"

// Temperature
formatters.formatTemperature(celsius)  // "XX°C"
formatters.formatPressure(psi)         // "XX.X PSI"

// Tires
formatters.formatTireWear(wear)        // "XX%"
formatters.getTireWearColor(wear)      // 'good'|'fair'|'poor'
formatters.getTireTemperatureColor(c)  // 'cold'|'optimal'|'warm'|'hot'

// Position & lap
formatters.formatPosition(pos, total)  // "Xth" or "Xth/YY"
formatters.formatLapNumber(lap)        // "Lap X"

// Performance
formatters.formatInput(value)          // "XX%"
formatters.formatGForce(g)             // "X.XXg"
formatters.formatPercentage(value)     // "XX.X%"
```

---

## Next: Build More Screens

1. Copy this template
2. Change the screen name
3. Update RootStackParamList
4. Add navigation button
5. Export from index.ts
6. Done! 🚀

---

## Need Help?

See:
- **Component usage:** [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)
- **Screen patterns:** [SCREEN_DEVELOPMENT_GUIDE.md](../SCREEN_DEVELOPMENT_GUIDE.md)
- **Fuel strategy:** [ADVANCED_FEATURES_GUIDE.md](../ADVANCED_FEATURES_GUIDE.md)

