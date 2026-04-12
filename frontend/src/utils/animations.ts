/**
 * Animation and Motion Utilities
 * 
 * Collection of animation helpers and timing functions for smooth,
 * professional transitions across the racing interface
 */

import { Animated, Easing } from 'react-native';
import { ANIMATION } from './theme';

/**
 * Create a pulse animation
 */
export const createPulseAnimation = (
  duration: number = ANIMATION.normal
): Animated.Value => {
  const pulseAnim = new Animated.Value(1);

  Animated.loop(
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.1,
        duration: duration / 2,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: duration / 2,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ])
  ).start();

  return pulseAnim;
};

/**
 * Create a fade-in animation
 */
export const createFadeInAnimation = (
  duration: number = ANIMATION.normal
): Animated.Value => {
  const fadeAnim = new Animated.Value(0);

  Animated.timing(fadeAnim, {
    toValue: 1,
    duration,
    easing: Easing.inOut(Easing.ease),
    useNativeDriver: true,
  }).start();

  return fadeAnim;
};

/**
 * Create a slide-in animation (from left)
 */
export const createSlideInAnimation = (
  duration: number = ANIMATION.normal
): Animated.Value => {
  const slideAnim = new Animated.Value(-100);

  Animated.timing(slideAnim, {
    toValue: 0,
    duration,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  }).start();

  return slideAnim;
};

/**
 * Create a scale animation
 */
export const createScaleAnimation = (
  duration: number = ANIMATION.normal,
  toValue: number = 1.2
): Animated.Value => {
  const scaleAnim = new Animated.Value(0.8);

  Animated.timing(scaleAnim, {
    toValue,
    duration,
    easing: Easing.inOut(Easing.ease),
    useNativeDriver: true,
  }).start();

  return scaleAnim;
};

/**
 * Create a rotating animation (infinite)
 */
export const createRotationAnimation = (
  duration: number = ANIMATION.slow
): Animated.Value => {
  const rotateAnim = new Animated.Value(0);

  Animated.loop(
    Animated.timing(rotateAnim, {
      toValue: 1,
      duration,
      easing: Easing.linear,
      useNativeDriver: true,
    })
  ).start();

  return rotateAnim;
};

/**
 * Create bounce-in animation
 */
export const createBounceAnimation = (
  duration: number = ANIMATION.normal
): Animated.Value => {
  const bounceAnim = new Animated.Value(0);

  Animated.sequence([
    Animated.timing(bounceAnim, {
      toValue: 1.2,
      duration: duration * 0.5,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }),
    Animated.timing(bounceAnim, {
      toValue: 1,
      duration: duration * 0.5,
      easing: Easing.bounce,
      useNativeDriver: true,
    }),
  ]).start();

  return bounceAnim;
};

/**
 * Create elastic animation
 */
export const createElasticAnimation = (
  duration: number = ANIMATION.slow
): Animated.Value => {
  const elasticAnim = new Animated.Value(1);

  Animated.loop(
    Animated.sequence([
      Animated.timing(elasticAnim, {
        toValue: 1.15,
        duration: duration * 0.25,
        easing: Easing.out(Easing.elastic(1)),
        useNativeDriver: true,
      }),
      Animated.timing(elasticAnim, {
        toValue: 1,
        duration: duration * 0.75,
        easing: Easing.out(Easing.elastic(1)),
        useNativeDriver: true,
      }),
    ]),
    {
      isInteraction: false,
    }
  ).start();

  return elasticAnim;
};

/**
 * Create a glow animation (opacity pulse)
 */
export const createGlowAnimation = (
  duration: number = ANIMATION.normal
): Animated.Value => {
  const glowAnim = new Animated.Value(0.5);

  Animated.loop(
    Animated.sequence([
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: duration / 2,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0.5,
        duration: duration / 2,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ])
  ).start();

  return glowAnim;
};

/**
 * Status-based animation selector
 */
export const getStatusAnimation = (
  status: 'safe' | 'warning' | 'danger'
): { animation: Animated.Value; duration: number } => {
  switch (status) {
    case 'danger':
      return {
        animation: createPulseAnimation(ANIMATION.quick),
        duration: ANIMATION.quick,
      };
    case 'warning':
      return {
        animation: createGlowAnimation(ANIMATION.normal),
        duration: ANIMATION.normal,
      };
    case 'safe':
    default:
      return {
        animation: new Animated.Value(1),
        duration: ANIMATION.slow,
      };
  }
};

/**
 * Ease presets for common animations
 */
export const EasePresets = {
  easeIn: Easing.in(Easing.cubic),
  easeOut: Easing.out(Easing.cubic),
  easeInOut: Easing.inOut(Easing.cubic),
  linear: Easing.linear,
  bounce: Easing.bounce,
  elastic: Easing.elastic(1),
  bezier: Easing.bezier(0.25, 0.1, 0.25, 1),
};
