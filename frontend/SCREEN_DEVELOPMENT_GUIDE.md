# Screen Development Integration Guide

## Overview

This guide demonstrates how to build fully-featured screens for the PitWall app using the complete utilities, services, and components we've built.

**What's Available:**
- ✅ Complete theme system (280+ design tokens)
- ✅ Reusable UI component library (8 components)
- ✅ Animation utilities (8 animation generators)
- ✅ Gesture handlers (swipe, tap, long-press detection)
- ✅ Display formatters (25+ formatting functions)
- ✅ Fuel strategy calculator (advanced predictions)
- ✅ Telemetry data service (unified data access)

---

## Quick Reference

### Import All Utilities You Need

```typescript
// Theme system
import { 
  COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS,
  COMMON_STYLES 
} from '../utils/theme';

// UI Components
import {
  StyledButton,
  StyledCard,
  StatusIndicator,
  MetricDisplay,
  SectionHeader,
  GridLayout,
  AlertBox,
  Divider,
} from '../components/StyledComponents';

// Animations
import { 
  createPulseAnimation, 
  createFadeInAnimation,
  createSlideAnimation 
} from '../utils/animations';

// Gesture handling
import { 
  PanGestureTracker, 
  TapGestureDetector,
  GestureAnimations 
} from '../utils/gestureHandlers';

// Data formatting
import * as formatters from '../utils/formatters';

// Services
import { telemetryDataService } from '../services/TelemetryDataService';
import { getAdvancedFuelPrediction, getAdvancedPitStrategies } from '../services/FuelCalculator';

// Redux
import { useAppDispatch, useAppSelector } from '@redux/store';
```

---

## Pattern 1: Settings/Configuration Screen

**See:** [SettingsScreen.tsx](../src/screens/SettingsScreen.tsx)

**What it demonstrates:**
- All StyledCard variants
- SectionHeader usage
- Multiple control types (toggles, buttons, selections)
- Dividers for visual separation
- AlertBox for tips
- Grid layouts for buttons
- Animated entry with fadeIn
- Gesture handling for swipe back

**Key Features:**
```typescript
// Setup animations
const fadeAnim = useRef(new Animated.Value(0)).current;
const swipeTracker = useRef(new PanGestureTracker()).current;

// Initialize animations
React.useEffect(() => {
  Animated.timing(fadeAnim, {
    toValue: 1,
    duration: 400,
    useNativeDriver: true,
  }).start();
}, [fadeAnim]);

// Apply to view
<Animated.View style={[stylesheet.container, { opacity: fadeAnim }]}>

// Handle gestures
onTouchEnd={() => {
  const gesture = swipeTracker.onTouchEnd();
  if (gesture?.direction === 'right') {
    navigation.goBack();
  }
}}
```

---

## Pattern 2: Data Display Screen

**Use case:** Dashboard, live telemetry, race information

**Example structure:**

```typescript
interface LiveDataScreenProps extends NativeStackScreenProps<
  RootStackParamList,
  'LiveData'
> {}

export const LiveDataScreen: React.FC<LiveDataScreenProps> = ({ navigation }) => {
  // Get Redux state
  const telemetry = useAppSelector((state) => state.telemetry);
  const session = useAppSelector((state) => state.session);

  // Initialize TelemetryDataService
  useEffect(() => {
    const store = ... // get from Redux (see below)
    telemetryDataService.setStore(store);
  }, []);

  // Get formatted data ready for display
  const summary = telemetryDataService.getDashboardSummary();
  const alerts = telemetryDataService.getActiveAlerts();

  if (!summary) {
    return <Text>No data available</Text>;
  }

  return (
    <ScrollView>
      {/* Key metrics */}
      <StyledCard variant="accent">
        <MetricDisplay
          label="Speed"
          value={summary.speed}
          unit=""
          trend="up"
        />
        <MetricDisplay
          label="Fuel"
          value={summary.fuel}
          unit=""
          trend={summary.fuelStatus === 'safe' ? 'stable' : 'down'}
        />
      </StyledCard>

      {/* Alerts */}
      {alerts.map((alert) => (
        <AlertBox
          key={`${alert.type}-${alert.severity}`}
          type={alert.severity === 'critical' ? 'error' : 
               alert.severity === 'warning' ? 'warning' : 'info'}
          message={alert.message}
          dismissible
        />
      ))}
    </ScrollView>
  );
};
```

---

## Pattern 3: Interactive Controls Screen

**Use case:** Race strategy input, driver preferences

**Key pattern:**

```typescript
// State management
const [settings, setSettings] = useState({
  displayMode: 'detailed',
  updateFrequency: 60,
  // ... more settings
});

// Update individual setting
const updateSetting = <K extends keyof typeof settings>(
  key: K,
  value: typeof settings[K]
) => {
  setSettings((prev) => ({ ...prev, [key]: value }));
};

// Render setting row
<View style={styles.settingRow}>
  <View>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.description}>{description}</Text>
  </View>
  <Switch
    value={settings.enabled}
    onValueChange={(val) => updateSetting('enabled', val)}
    trackColor={{ false: COLORS.borders.default, true: COLORS.accents.primary }}
    thumbColor={settings.enabled ? COLORS.text.primary : COLORS.text.tertiary}
  />
</View>

// Use Divider between items
<Divider variant="subtle" spacing="md" />
```

---

## Pattern 4: Formatted Data Display

**Use case:** Lap times, telemetry values in professional format

```typescript
// Instead of raw numbers
<Text>{lapTime}</Text>  // ❌ 125450

// Use formatters for professional display
import * as formatters from '../utils/formatters';

<Text>{formatters.formatTime(125450)}</Text>  // ✅ "2:05.45"

// All available formatters:
formatters.formatTime(ms)              // "MM:SS.mmm"
formatters.formatDelta(ms)             // "+/-M:SS.mm"
formatters.formatSpeed(kmh)            // "XXX km/h"
formatters.formatRPM(rpm, max)         // "XXXX/YYYY"
formatters.formatFuel(liters)          // "XX.XL"
formatters.formatConsumption(l_per_lap) // "X.XXXL/lap"
formatters.formatTemperature(celsius)  // "XX°C"
formatters.formatTireWear(percentage)  // "XX%"
formatters.formatPressure(psi)         // "XX.X PSI"
formatters.formatPosition(pos, total)  // "Xth" or "Xth/YY"
formatters.formatTireWearColor(wear)   // 'good'|'fair'|'poor'
formatters.formatGForce(g)             // "X.XXg"

// Apply with MetricDisplay
<MetricDisplay
  label="Lap Time"
  value={formatters.formatTime(telemetry.lapTime)}
  unit=""
  trend="down"  // △ ▽ ▶
/>
```

---

## Pattern 5: Fuel Strategy Display

**Use case:** Pit strategy visualization, fuel predictions

```typescript
// Get advanced predictions
const consumptionHistory = useAppSelector(
  (state) => state.telemetry.consumptionHistory
);
const session = useAppSelector((state) => state.session);
const telemetry = useAppSelector((state) => state.telemetry.current);

// Calculate prediction
const fuelPrediction = getAdvancedFuelPrediction(
  session.currentLap,
  session.totalLaps,
  telemetry.fuel,
  telemetry.fuelCapacity,
  consumptionHistory
);

// Display results
<StyledCard variant="warning">
  <Text style={styles.label}>⛽ FUEL PREDICTION</Text>
  
  <MetricDisplay
    label="Laps Until Empty"
    value={fuelPrediction.lapsUntilEmpty.toString()}
    unit="laps"
  />
  
  <MetricDisplay
    label="Fuel Per Lap"
    value={formatters.formatConsumption(fuelPrediction.fuelPerLap)}
    unit=""
  />
  
  <Divider variant="accent" spacing="md" />
  
  <Text style={styles.label}>PIT WINDOW</Text>
  <Text>
    Earliest: Lap {fuelPrediction.pitWindowStart}
  </Text>
  <Text>
    Latest: Lap {fuelPrediction.pitWindowEnd}
  </Text>
  
  {/* Display strategies */}
  {fuelPrediction.strategies.map((strategy, idx) => (
    <View key={idx} style={styles.strategyCard}>
      <Text style={styles.strategyText}>
        Pit at Lap {strategy.lapNumber}
      </Text>
      <Text>Add {formatters.formatFuel(strategy.fuelToAdd)}</Text>
      <StatusIndicator 
        status={strategy.riskLevel === 'low' ? 'safe' : 
               strategy.riskLevel === 'medium' ? 'warning' : 'danger'}
      />
    </View>
  ))}
</StyledCard>
```

---

## Pattern 6: Gesture-Enabled Screen

**Use case:** Swipe navigation, press feedback

```typescript
const gestureDetector = useRef(new PanGestureTracker()).current;
const tapDetector = useRef(new TapGestureDetector()).current;

return (
  <View
    onTouchStart={gestureDetector.onTouchStart}
    onTouchMove={gestureDetector.onTouchMove}
    onTouchEnd={() => {
      const gesture = gestureDetector.onTouchEnd();
      
      // Swipe back (iOS style)
      if (gesture && gesture.direction === 'right' && gesture.startX < 50) {
        navigation.goBack();
      }
      // Swipe forward
      else if (gesture && gesture.direction === 'left') {
        navigation.navigate('NextScreen');
      }
      // Down swipe to dismiss
      else if (gesture && gesture.direction === 'down' && gesture.startY < 50) {
        navigation.goBack();
      }
    }}
    onPress={() => {
      const tapType = tapDetector.onTap();
      
      if (tapType === 'double') {
        // Double tap triggered
        handleDoubleClick();
      } else if (tapType === null) {
        // Single tap - wait for possible double tap
        tapDetector.onSingleTapConfirmed(() => {
          handleSingleClick();
        });
      }
    }}
  >
    {/* Content */}
  </View>
);
```

---

## Pattern 7: Animated List with Status

**Use case:** Race results, leaderboard, pit stop history

```typescript
const slideAnim = useRef(new Animated.Value(0)).current;

useEffect(() => {
  Animated.stagger(100, [
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }),
  ]).start();
}, []);

return (
  <View>
    {items.map((item, idx) => (
      <Animated.View
        key={item.id}
        style={{
          transform: [
            {
              translateX: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-100, 0],
              }),
            },
          ],
          opacity: slideAnim,
        }}
      >
        <StyledCard variant="default" style={{ marginBottom: SPACING.md }}>
          <View style={styles.row}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <StatusIndicator
              status={item.completed ? 'safe' : 'warning'}
              size="sm"
            />
          </View>
          <Text style={styles.itemDetail}>{item.detail}</Text>
        </StyledCard>
      </Animated.View>
    ))}
  </View>
);
```

---

## Styling Best Practices

### DO:
```typescript
// ✅ Use theme constants consistently
backgroundColor: COLORS.backgrounds.primary
fontSize: TYPOGRAPHY.body.md.size
padding: SPACING.md
borderRadius: BORDER_RADIUS.md
...(SHADOWS.md)  // Spread shadow styles

// ✅ Use COMMON_STYLES for standard layouts
...COMMON_STYLES.screenContainer
...COMMON_STYLES.scrollView

// ✅ Memoize expensive calculations
const items = useMemo(() => 
  data.map(formatForDisplay),
  [data]
);
```

### DON'T:
```typescript
// ❌ Hardcode colors
backgroundColor: '#111111'

// ❌ Magic numbers for spacing
padding: 12

// ❌ Duplicate styles
// (Use theme constants instead)

// ❌ Format data on every render
<Text>{formatTime(value)}</Text>
// (Use useMemo instead)
```

---

## Redux Integration

### Access State

```typescript
const dispatch = useAppDispatch();
const telemetry = useAppSelector(state => state.telemetry);
const session = useAppSelector(state => state.session);
const ui = useAppSelector(state => state.ui);

// Available slices:
// - telemetry: {isConnected, data, consumptionHistory, error}
// - session: {isActive, isRecording, name, game, currentLap, totalLaps}
// - ui: {currentScreen, displayMode, alerts}
// - fuelStrategy: {activeStrategy, scenarios}
// - voice: {enabled, volume, language, callouts}
```

### Dispatch Actions

```typescript
import { setConnected, updateTelemetry } from '@redux/slices/telemetrySlice';
import { startSession, endSession } from '@redux/slices/sessionSlice';
import { setCurrentScreen } from '@redux/slices/uiSlice';

dispatch(updateTelemetry(newData));
dispatch(startSession({id, name, game}));
dispatch(setCurrentScreen('Dashboard'));
```

---

## Navigation Patterns

### Navigate to Screen

```typescript
// From props
type MyScreenProps = NativeStackScreenProps<RootStackParamList, 'MyScreen'>;

// Navigate forward
navigation.navigate('SettingsScreen');

// Go back
navigation.goBack();

// Reset to screen
navigation.reset({
  index: 0,
  routes: [{ name: 'Home' }],
});
```

---

## Performance Optimization

### Memory
```typescript
// Cache calculated values
const formatted = useMemo(() => 
  formatters.formatTime(value), 
  [value]
);

// Unsubscribe from listeners
useEffect(() => {
  return () => gestureTracker.reset();
}, []);

// Limit animation complexity
// Avoid nested animations
// Use useNativeDriver: true
```

### Rendering
```typescript
// Use React.memo for expensive components
const MetricRow = React.memo(({ data }) => (
  <MetricDisplay {...data} />
));

// Avoid re-rendering entire list
// Update specific items only
```

---

## Testing Screen Patterns

### Unit Test Example
```typescript
describe('SettingsScreen', () => {
  it('should render all settings sections', () => {
    // Test setup
  });

  it('should update setting on toggle', () => {
    // Test setting update
  });

  it('should show alerts for changes', () => {
    // Test alert display
  });
});
```

---

## Common Screen Types

| Type | Use | Example |
|------|-----|---------|
| **Display** | Show real-time data | Dashboard, FuelStrategy |
| **Settings** | Configure preferences | SettingsScreen, VoiceSettings |
| **Input** | Collect user data | RaceStrategyInputScreen |
| **Results** | Show competition results | RaceStrategyScreen |
| **Navigation** | Hub screen | HomeScreen |

---

## Next Steps for Your App

1. **Update FuelStrategyScreen** to use `getAdvancedFuelPrediction()`
2. **Create RaceResultsScreen** using animated lists
3. **Create DataExportScreen** for CSV/JSON export
4. **Update DashboardScreen** to use `telemetryDataService`
5. **Add offline indicators** using new status patterns

---

## Troubleshooting

### Screen Not Rendering
- Check imports are correct
- Verify type in RootStackParamList
- Ensure component exported from screens/index.ts

### Theme Colors Not Applied
- Verify COLORS imports from utils/theme
- Check StyleSheet uses COLORS constants
- Ensure COLORS.text/backgrounds/borders etc. are used

### Gestures Not Working
- Call reset() after gesture end
- Check onTouchStart/Move/End props on View
- Verify navigator gestureEnabled settings

### Performance Issues
- Check for missing React.memo wrappers
- Verify useMemo on expensive calculations
- Look for animations on main thread

---

## Support

For questions about:
- **Theme system:** See DESIGN_SYSTEM.md
- **Components:** See MIGRATION_GUIDE.md
- **Fuel calculations:** See ADVANCED_FEATURES_GUIDE.md
- **Animations:** Check animations.ts JSDoc comments

