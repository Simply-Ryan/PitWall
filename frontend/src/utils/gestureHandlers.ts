/**
 * Gesture Handlers & Global Utilities
 * 
 * Provides gesture recognizers and handlers for:
 * - Swipe navigation between screens
 * - Double tap actions
 * - Long press feedback
 * - Pull-to-refresh
 */

import { GestureResponderEvent, Animated, Dimensions } from 'react-native';

export type GestureDirection = 'left' | 'right' | 'up' | 'down';

/**
 * Gesture event with timing and distance data
 */
export interface GestureData {
  direction: GestureDirection;
  distance: number;
  velocity: number;
  duration: number; // Milliseconds
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

/**
 * Pan gesture tracker
 * Tracks touch movement for swipe detection
 */
export class PanGestureTracker {
  private startX: number = 0;
  private startY: number = 0;
  private startTime: number = 0;
  private currentX: number = 0;
  private currentY: number = 0;

  readonly minSwipeDistance: number = 50; // pixels
  readonly maxSwipeDuration: number = 500; // milliseconds
  readonly velocityThreshold: number = 100; // pixels per second

  /**
   * Handle touch start
   */
  onTouchStart = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    this.startX = locationX;
    this.startY = locationY;
    this.currentX = locationX;
    this.currentY = locationY;
    this.startTime = Date.now();
  };

  /**
   * Handle touch move
   */
  onTouchMove = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    this.currentX = locationX;
    this.currentY = locationY;
  };

  /**
   * Handle touch end and return gesture data
   */
  onTouchEnd = (): GestureData | null => {
    const endTime = Date.now();
    const duration = endTime - this.startTime;

    // Check if gesture is within time threshold
    if (duration > this.maxSwipeDuration) {
      return null;
    }

    // Calculate distances
    const deltaX = this.currentX - this.startX;
    const deltaY = this.currentY - this.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Check if gesture meets minimum distance
    if (distance < this.minSwipeDistance) {
      return null;
    }

    // Calculate velocity
    const velocity = distance / (duration / 1000); // pixels per second

    // Determine direction
    let direction: GestureDirection;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      // Vertical swipe
      direction = deltaY > 0 ? 'down' : 'up';
    }

    return {
      direction,
      distance,
      velocity,
      duration,
      startX: this.startX,
      startY: this.startY,
      endX: this.currentX,
      endY: this.currentY,
    };
  };

  /**
   * Reset tracker
   */
  reset = () => {
    this.startX = 0;
    this.startY = 0;
    this.startTime = 0;
    this.currentX = 0;
    this.currentY = 0;
  };
}

/**
 * Tap gesture detector (single & double tap)
 */
export class TapGestureDetector {
  private lastTap: number = 0;
  private tapCount: number = 0;
  private tapTimer: NodeJS.Timeout | null = null;

  readonly doubleTapDelay: number = 300; // milliseconds

  /**
   * Handle tap - returns 'single' or 'double' or null if waiting
   */
  onTap = (): 'single' | 'double' | null => {
    const now = Date.now();
    const timeSinceLastTap = now - this.lastTap;

    if (this.tapTimer) {
      clearTimeout(this.tapTimer);
      this.tapTimer = null;
    }

    if (timeSinceLastTap < this.doubleTapDelay) {
      // Double tap detected
      this.tapCount = 0;
      this.lastTap = 0;
      return 'double';
    }

    this.lastTap = now;
    this.tapCount++;

    // Wait to see if another tap comes
    this.tapTimer = setTimeout(() => {
      this.tapCount = 0;
    }, this.doubleTapDelay);

    return null; // Single tap, but waiting for potential double
  };

  /**
   * Trigger single tap callback if no double tap follows
   */
  onSingleTapConfirmed(callback: () => void) {
    this.tapTimer = setTimeout(() => {
      if (this.tapCount === 1) {
        callback();
      }
      this.tapCount = 0;
    }, this.doubleTapDelay);
  }

  /**
   * Reset
   */
  reset = () => {
    if (this.tapTimer) {
      clearTimeout(this.tapTimer);
    }
    this.lastTap = 0;
    this.tapCount = 0;
  };
}

/**
 * Long press detector
 */
export class LongPressDetector {
  private pressStartTime: number = 0;
  private pressTimer: NodeJS.Timeout | null = null;
  private wasMoved: boolean = false;

  readonly longPressDuration: number = 500; // milliseconds
  readonly moveThreshold: number = 10; // pixels

  private startX: number = 0;
  private startY: number = 0;

  /**
   * Handle press start
   */
  onPressStart = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    this.startX = locationX;
    this.startY = locationY;
    this.pressStartTime = Date.now();
    this.wasMoved = false;
  };

  /**
   * Handle move - detect if user moved during press
   */
  onPressMove = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    const deltaX = Math.abs(locationX - this.startX);
    const deltaY = Math.abs(locationY - this.startY);
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > this.moveThreshold) {
      this.wasMoved = true;
      this.cancel();
    }
  };

  /**
   * Handle press end - returns true if long press was held
   */
  onPressEnd = (): boolean => {
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
    }

    const duration = Date.now() - this.pressStartTime;
    return duration >= this.longPressDuration && !this.wasMoved;
  };

  /**
   * Cancel long press
   */
  cancel = () => {
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
    }
    this.wasMoved = true;
  };

  /**
   * Reset
   */
  reset = () => {
    this.cancel();
    this.pressStartTime = 0;
    this.wasMoved = false;
  };
}

/**
 * Animation helpers for gesture feedback
 */
export class GestureAnimations {
  /**
   * Create bounce animation
   */
  static createBounceAnimation(
    initialValue: number = 1,
    targetValue: number = 0.95,
    duration: number = 150
  ): Animated.Value {
    const animation = new Animated.Value(initialValue);

    Animated.sequence([
      Animated.timing(animation, {
        toValue: targetValue,
        duration: duration / 2,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: initialValue,
        duration: duration / 2,
        useNativeDriver: true,
      }),
    ]).start();

    return animation;
  }

  /**
   * Create press down animation
   */
  static createPressAnimation(): Animated.Value {
    const animation = new Animated.Value(1);

    const pressIn = () => {
      Animated.timing(animation, {
        toValue: 0.92,
        duration: 100,
        useNativeDriver: true,
      }).start();
    };

    const pressOut = () => {
      Animated.timing(animation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }).start();
    };

    return animation;
  }

  /**
   * Create shake animation for error states
   */
  static createShakeAnimation(): Animated.Value {
    const shake = new Animated.Value(0);

    const shakeSequence = Animated.sequence([
      Animated.timing(shake, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]);

    return shake;
  }

  /**
   * Create fade in animation
   */
  static createFadeInAnimation(duration: number = 300): Animated.Value {
    const fade = new Animated.Value(0);

    Animated.timing(fade, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    }).start();

    return fade;
  }

  /**
   * Create slide animation
   */
  static createSlideAnimation(
    fromValue: number = 100,
    toValue: number = 0,
    duration: number = 300
  ): Animated.Value {
    const slide = new Animated.Value(fromValue);

    Animated.timing(slide, {
      toValue,
      duration,
      useNativeDriver: true,
    }).start();

    return slide;
  }
}

/**
 * Helper to determine screen orientation
 */
export const getScreenOrientation = (): 'portrait' | 'landscape' => {
  const { width, height } = Dimensions.get('window');
  return height > width ? 'portrait' : 'landscape';
};

/**
 * Helper to detect if gesture is swipe-back gesture (typical iOS)
 */
export const isSwipeBackGesture = (gesture: GestureData, screenMargin: number = 50): boolean => {
  return gesture.direction === 'right' && gesture.startX < screenMargin;
};

/**
 * Helper to detect swipe to dismiss (vertical down from top)
 */
export const isSwipeToDismissGesture = (gesture: GestureData, screenMargin: number = 50): boolean => {
  return gesture.direction === 'down' && gesture.startY < screenMargin;
};
