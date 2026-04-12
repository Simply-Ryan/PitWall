# PitWall Design System Documentation

## Overview

PitWall features a modern, professional racing interface built on a comprehensive design system. This document outlines the design tokens, components, and best practices for maintaining consistency across the application.

## Design Philosophy

- **Professional Racing Theme**: Dark, high-contrast interface optimized for racing applications
- **Performance-Focused**: Minimalist design with purpose-driven UI elements
- **Accessibility**: Clear visual hierarchy and sufficient contrast for readability
- **Consistency**: Unified spacing, typography, and color usage across all screens

## Color Palette

### Core Colors

| Name | Hex | Usage |
|------|-----|-------|
| Primary Background | `#0A0E27` | Main screen background |
| Secondary Background | `#111827` | Secondary surfaces |
| Tertiary Background | `#1a1f3a` | Tertiary containers |
| Surface | `#151b2f` | Cards and containers |

### Accent Colors

| Name | Hex | Usage |
|------|-----|-------|
| Cyan (Primary) | `#00D9FF` | Main interactive elements, primary buttons |
| Teal | `#00A5A5` | Secondary interactive elements |
| Orange | `#FF8B00` | Warning states |
| Neon Green | `#00FF00` | Alerts and critical states |

### Status Colors

| Name | Hex | Meaning |
|------|-----|---------|
| Success | `#00FF00` | Positive state, safe conditions |
| Warning | `#FFFF00` | Attention needed |
| Danger | `#FF4444` | Critical/Error state |
| Info | `#00D9FF` | Information |

### Text Colors

| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#FFFFFF` | Main text |
| Secondary | `#B0B0B0` | Secondary information |
| Tertiary | `#808080` | Tertiary/muted text |
| Muted | `#5A6B7D` | Low-emphasis text |

### Borders

| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#22334F` | Standard borders |
| Secondary | `#2d3e54` | Secondary borders |
| Light | `#3d4e66` | Light borders |
| Outline | `#00D9FF` | Accent borders (cyan) |

## Spacing System

All spacing follows an 4px base unit:

```typescript
xs: 4px      // Minimal spacing
sm: 8px      // Small spacing
md: 12px     // Default spacing
lg: 16px     // Large spacing
xl: 20px     // Extra large
xxl: 24px    // Double extra large
xxxl: 32px   // Triple extra large
```

## Typography

### Headings

- **H1**: 36px, Bold, 2px letter-spacing
- **H2**: 28px, Bold, 1.5px letter-spacing
- **H3**: 20px, Bold, 1px letter-spacing

### Body Text

- **Large**: 16px, 600 weight, 24px line-height
- **Normal**: 14px, 400 weight, 20px line-height
- **Small**: 12px, 400 weight, 18px line-height

### Labels

- **Large**: 14px, Bold, 0.5px letter-spacing
- **Normal**: 12px, Bold, 1px letter-spacing
- **Small**: 10px, Bold, 1.5px letter-spacing

## Components

### StyledButton

Reusable button component with multiple variants.

**Variants**: `primary` | `secondary` | `danger` | `success`
**Sizes**: `sm` | `md` | `lg`

```tsx
<StyledButton
  label="ACTION"
  variant="primary"
  size="lg"
  fullWidth
  icon="🎯"
  onPress={handleAction}
/>
```

### StyledCard

Container component for content sections.

**Variants**: `default` | `accent` | `warning` | `danger`

```tsx
<StyledCard variant="accent" title="Title">
  {/* Content */}
</StyledCard>
```

### StatusIndicator

Visual status indicator with colored dot and label.

**Statuses**: `safe` | `warning` | `danger` | `info`
**Sizes**: `sm` | `md` | `lg`

```tsx
<StatusIndicator
  status="safe"
  label="CONNECTED"
  size="lg"
/>
```

### MetricDisplay

Display metric values with optional trend indicator.

```tsx
<MetricDisplay
  label="Speed"
  value="250"
  unit="km/h"
  trend="up"
/>
```

### SectionHeader

Header for content sections with title and optional subtitle.

```tsx
<SectionHeader
  title="FUEL STRATEGY"
  subtitle="Pit Stop Analysis"
/>
```

### Divider

Visual separator between sections.

**Variants**: `light` | `dark` | `accent`
**Spacing**: `sm` | `md` | `lg`

```tsx
<Divider variant="accent" spacing="md" />
```

### AlertBox

Informational alert box.

**Types**: `info` | `success` | `warning` | `error`

```tsx
<AlertBox
  type="warning"
  message="Low fuel warning"
  onDismiss={() => {}}
/>
```

## Usage Guide

### Importing the Theme

```typescript
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  SHADOWS,
  ANIMATION,
  COMMON_STYLES,
} from '../utils/theme';

import {
  StyledButton,
  StyledCard,
  StatusIndicator,
  SectionHeader,
  // ... other components
} from '../components/StyledComponents';
```

### Creating Consistent Screens

1. Use `COMMON_STYLES.screenContainer` for main container
2. Apply consistent spacing using `SPACING` constants
3. Use semantic color names from `COLORS`
4. Leverage `TYPOGRAPHY` for text sizing
5. Apply `SHADOWS` for depth

### Example Screen Structure

```tsx
import { View, Text, StyleSheet } from 'react-native';
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  COMMON_STYLES,
} from '../utils/theme';
import { StyledButton, SectionHeader } from '../components/StyledComponents';

export const MyScreen = () => {
  return (
    <View style={styles.container}>
      <SectionHeader title="MY SECTION" subtitle="Details" />
      <StyledButton label="Action" variant="primary" size="lg" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...COMMON_STYLES.screenContainer,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },
});
```

## Animation Timing

```typescript
quick: 150ms    // For quick feedback
normal: 300ms   // Standard transitions
slow: 500ms     // Longer animations
```

## Border Radius

```typescript
sm: 4px
md: 8px         // Default for cards
lg: 12px        // Larger containers
xl: 16px        // Extra large containers
full: 9999px    // Circular elements
```

## Shadows

Applied using elevation for Android and custom shadow properties for iOS.

- **sm**: Subtle shadow, elevation 2
- **md**: Medium shadow, elevation 4
- **lg**: Strong shadow, elevation 8
- **xl**: Extra strong with cyan glow, elevation 12

## Best Practices

1. **Always use theme constants** instead of hardcoded values
2. **Maintain spacing rhythm** using SPACING constants
3. **Use semantic color names** (e.g., `COLORS.accent.cyan` not `#00D9FF`)
4. **Apply shadows consistently** using SHADOWS presets
5. **Respect typography hierarchy** using TYPOGRAPHY styles
6. **Group related styles** in StyleSheet.create()
7. **Test on both iOS and Android** for platform consistency

## Extending the Theme

To add new colors or modify existing ones:

1. Edit `frontend/src/utils/theme.ts`
2. Add new constants to appropriate sections
3. Update this documentation
4. Test across all affected components

## Responsive Design Considerations

The current design system assumes mobile-sized screens. For responsive adjustments:

- Use `Dimensions.get('window')` for layout calculations
- Scale text and spacing proportionally
- Test on multiple device sizes

## Color Contrast

All color combinations meet WCAG AA standards for text contrast:
- Text on surface: 4.5:1 minimum
- Large text: 3:1 minimum

## Future Enhancements

- [ ] Dark/Light theme toggle
- [ ] Custom color scheme selection
- [ ] Accessibility preferences
- [ ] Tablet/landscape layout support
- [ ] Custom typography scaling
