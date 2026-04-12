# PitWall Frontend Development Guide

## Overview

The PitWall frontend is a React Native racing telemetry application with a professional, modern design system. This guide covers development setup, architecture, and best practices.

## Quick Start

### Prerequisites
- Node.js 16+ 
- React Native development environment configured
- Expo CLI (if using Expo)

### Setup
```bash
cd frontend
npm install
npm start
```

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Dashboard/       # Dashboard sub-components
│   │   ├── StyledComponents.tsx  # Design system components
│   │   └── StrategyMonitorWidget.tsx
│   ├── hooks/               # Custom React hooks
│   ├── redux/               # Redux store and slices
│   ├── screens/             # Screen components
│   ├── services/            # Business logic services
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   │   ├── theme.ts         # Design system tokens
│   │   ├── animations.ts    # Animation utilities
│   │   └── responsive.ts    # Responsive layout helpers
│   ├── App.tsx              # Main app component
│   └── index.tsx            # Entry point
├── tests/                   # Test files
├── DESIGN_SYSTEM.md         # Design system documentation
├── MIGRATION_GUIDE.md       # Guide for using new design system
└── package.json
```

## Core Features

### 1. Design System (`utils/theme.ts`)
Centralized design tokens including:
- **Colors**: Accents, status, text, borders
- **Spacing**: 4px-based spacing scale (xs-xxxl)
- **Typography**: Predefined text styles
- **Shadows**: Depth presets
- **Border Radius**: Consistent rounding
- **Animations**: Timing constants

**Usage:**
```tsx
import { COLORS, SPACING, TYPOGRAPHY } from '../utils/theme';

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.primary,
    padding: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.heading.h1,
    color: COLORS.text.primary,
  },
});
```

### 2. Styled Components (`components/StyledComponents.tsx`)
Reusable UI components built on the design system:

- **StyledButton**: Interactive button component
- **StyledCard**: Content container
- **StatusIndicator**: Status visualization
- **MetricDisplay**: Metric value display
- **SectionHeader**: Section titles
- **Divider**: Visual separator
- **AlertBox**: Alert/notification display
- **GridLayout**: Responsive grid

**Usage:**
```tsx
<StyledButton
  label="Action"
  variant="primary"
  size="lg"
  fullWidth
  icon="🎯"
  onPress={handlePress}
/>
```

### 3. Animation Utilities (`utils/animations.ts`)
Pre-built animation generators:
- Pulse animation
- Fade-in animation
- Slide-in animation
- Scale animation
- Rotation animation
- Bounce animation
- Elastic animation
- Glow animation

**Usage:**
```tsx
import { createPulseAnimation, ANIMATION } from '../utils/animations';

const pulse = createPulseAnimation(ANIMATION.normal);

return (
  <Animated.View style={{ transform: [{ scale: pulse }] }}>
    {/* Content */}
  </Animated.View>
);
```

### 4. Responsive Utilities (`utils/responsive.ts`)
Device-aware responsive helpers:
- Device dimension detection
- Orientation detection
- Device size categorization
- Responsive font scaling
- Responsive spacing
- Grid column calculation
- Breakpoint detection

**Usage:**
```tsx
import {
  getDeviceSize,
  getResponsiveConfig,
  isMobileDevice,
} from '../utils/responsive';

const deviceSize = getDeviceSize(); // 'small' | 'medium' | 'large' | 'xl'

if (isMobileDevice()) {
  // Mobile-specific logic
}
```

## Screen Components

### HomeScreen
Entry point showing connection status, session info, and navigation options.

### DashboardScreen
Real-time telemetry display with quick access controls for:
- Fuel Strategy
- Voice Settings
- Home navigation

### FuelStrategyScreen
Comprehensive fuel analysis including:
- Current fuel metrics
- Race predictions
- Pit strategy recommendations
- Consumption trends
- Pit impact analysis

### VoiceSettingsScreen
Voice notification configuration:
- Master enable/disable
- Volume, speed, pitch controls
- Callout throttling
- Notification type selection
- Test speaker

## Redux State Management

### Slices
- **telemetrySlice**: Real-time vehicle telemetry
- **sessionSlice**: Racing session data
- **uiSlice**: UI state and navigation
- **fuelStrategySlice**: Fuel calculations
- **voiceSlice**: Voice settings

**Usage:**
```tsx
import { useAppDispatch, useAppSelector } from '../redux/store';
import { updateTelemetry } from '../redux/slices/telemetrySlice';

const dispatch = useAppDispatch();
const telemetry = useAppSelector(state => state.telemetry);

dispatch(updateTelemetry(data));
```

## Services

### TelemetryWebSocketService
Manages real-time telemetry data streaming.

### VoiceService
Handles voice callout generation and playback.

### FuelCalculator
Performs fuel consumption calculations and predictions.

### AnalyticsService
Tracks user analytics and session metrics.

### CalloutManager
Manages voice notification callouts.

## Custom Hooks

- **useTelemetry**: Access telemetry data and connection state
- **useVoice**: Voice settings and callout management
- **useSession**: Session data and recording state
- **useFuelStrategy**: Fuel calculations and strategy data

## Development Workflow

### 1. Creating a New Screen

```tsx
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  COLORS,
  SPACING,
  COMMON_STYLES,
} from '../utils/theme';
import {
  StyledButton,
  StyledCard,
  SectionHeader,
} from '../components/StyledComponents';

export const NewScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader title="MY SCREEN" subtitle="Description" />
        
        <StyledCard variant="accent">
          {/* Content */}
        </StyledCard>

        <StyledButton
          label="Action"
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => {}}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: COMMON_STYLES.screenContainer,
  content: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },
});
```

### 2. Adding a New Component

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  TYPOGRAPHY,
} from '../utils/theme';

interface MyComponentProps {
  title: string;
  value: string;
}

export const MyComponent: React.FC<MyComponentProps> = ({ title, value }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.label.normal,
    color: COLORS.text.secondary,
    marginBottom: SPACING.md,
  },
  value: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.accent.cyan,
  },
});
```

## Best Practices

### 1. Use Theme Constants
Always use theme constants instead of hardcoding values:

```tsx
// ✅ Good
backgroundColor: COLORS.background.primary

// ❌ Bad
backgroundColor: '#0A0E27'
```

### 2. Consistent Spacing
Use SPACING constants for margins and padding:

```tsx
// ✅ Good
marginBottom: SPACING.lg
padding: SPACING.md

// ❌ Bad
marginBottom: 16
padding: 12
```

### 3. Type Safety
Always define prop interfaces:

```tsx
interface ComponentProps {
  label: string;
  variant?: 'primary' | 'secondary';
  onPress: () => void;
}
```

### 4. Memoization
Use useMemo for expensive calculations:

```tsx
const displayValue = useMemo(
  () => expensiveCalculation(data),
  [data]
);
```

### 5. Error Handling
Always handle errors gracefully:

```tsx
try {
  await doAsyncWork();
} catch (error) {
  console.error('Operation failed:', error);
  // Show user-friendly error
}
```

## Testing

### Running Tests
```bash
npm test
```

### Test Files Location
- Unit tests: `src/__tests__/`
- Integration tests: `tests/`

## Debugging

### Enable Debug Mode
```bash
npm run debug
```

### Redux DevTools
Install Redux DevTools browser extension to inspect state changes.

### React Native Debugger
```bash
npm run debug:remote
```

## Performance Tips

1. **Minimize Re-renders**: Use React.memo and useMemo
2. **Lazy Load Screens**: Use React.lazy for route splitting
3. **Optimize Images**: Use appropriately sized images
4. **Profile Performance**: Use React Native Profiler

## Accessibility

### Guidelines
- Use readable font sizes (minimum 14px for body text)
- Maintain color contrast (WCAG AA standard)
- Provide meaningful labels for interactive elements
- Support keyboard navigation

### Color Contrast
All colors in the design system meet WCAG AA standards for text contrast.

## Documentation Files

- **DESIGN_SYSTEM.md**: Complete design system reference
- **MIGRATION_GUIDE.md**: Guide for using new design system components

## Troubleshooting

### Common Issues

**Problem**: Styles not applying
- Check that StyleSheet.create() is used
- Verify theme constants are imported
- Clear Metro cache: `npm start -- --reset-cache`

**Problem**: Components not rendering
- Check that component exports are correct
- Verify prop types match component interface
- Check console for error messages

**Problem**: Performance issues
- Profile with React Native Profiler
- Check for unnecessary re-renders
- Optimize expensive calculations with useMemo

## Resources

- [React Native Documentation](https://reactnative.dev)
- [Redux Documentation](https://redux.js.org)
- [React Native Navigation](https://reactnavigation.org)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

## Contributing

### Code Style
- Use TypeScript for type safety
- Follow existing naming conventions
- Document complex logic with comments
- Keep components focused and reusable

### Commit Messages
- Use descriptive commit messages
- Reference issues when relevant
- Keep commits focused on single changes

### Pull Request Process
1. Create feature branch: `git checkout -b feature/description`
2. Make changes and test thoroughly
3. Update documentation if needed
4. Submit pull request with description
5. Address review feedback

## Contact & Support

For questions or issues, refer to main project documentation or create an issue in the repository.
