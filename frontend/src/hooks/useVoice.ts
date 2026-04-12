/**
 * useVoice Hook
 * 
 * Manages voice notifications and TTS interaction
 * Integrates VoiceService and CalloutManager with Redux state
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import VoiceService from '../services/VoiceService';
import CalloutManager from '../services/CalloutManager';
import { VoiceSettings, VoiceNotification } from '../types/voice';
import { useTelemetry } from './useTelemetry';

interface UseVoiceReturn {
  isEnabled: boolean;
  isSpeaking: boolean;
  queueSize: number;
  voiceSettings: VoiceSettings;
  updateSettings: (settings: Partial<VoiceSettings>) => void;
  speak: (notification: VoiceNotification) => Promise<void>;
  stop: () => Promise<void>;
  resetSession: () => void;
}

/**
 * Hook for managing voice notifications
 */
export function useVoice(): UseVoiceReturn {
  const telemetry = useTelemetry();
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(
    VoiceService.getSettings(),
  );
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [queueSize, setQueueSize] = useState(0);
  const initializePromiseRef = useRef<Promise<void> | null>(null);

  /**
   * Initialize voice service on mount
   */
  useEffect(() => {
    const initialize = async () => {
      try {
        if (!initializePromiseRef.current) {
          initializePromiseRef.current = VoiceService.initialize();
        }
        await initializePromiseRef.current;
        console.log('Voice service initialized');
      } catch (error) {
        console.error('Failed to initialize voice service:', error);
      }
    };

    initialize();
  }, []);

  /**
   * Monitor telemetry and generate callouts
   */
  useEffect(() => {
    if (!voiceSettings.enabled || !telemetry?.data) {
      return;
    }

    // Generate callouts based on current telemetry
    const callouts = CalloutManager.generateCallouts(telemetry.data);

    // Queue each callout
    callouts.forEach((callout) => {
      VoiceService.queueNotification(callout).catch((error) => {
        console.error('Error queueing notification:', error);
      });
    });

    // Update queue size
    setQueueSize(VoiceService.getQueueSize());
  }, [telemetry, voiceSettings.enabled]);

  /**
   * Monitor speaking state
   */
  useEffect(() => {
    const checkSpeakingState = () => {
      setIsSpeaking(VoiceService.getIsSpeaking());
      setQueueSize(VoiceService.getQueueSize());
    };

    // Check every 100ms for speaking state changes
    const interval = setInterval(checkSpeakingState, 100);

    return () => clearInterval(interval);
  }, []);

  /**
   * Update settings
   */
  const updateSettings = useCallback((settings: Partial<VoiceSettings>) => {
    VoiceService.updateSettings(settings);
    setVoiceSettings(VoiceService.getSettings());
  }, []);

  /**
   * Manually speak a notification
   */
  const speak = useCallback(async (notification: VoiceNotification) => {
    try {
      await VoiceService.speak(notification);
    } catch (error) {
      console.error('Error speaking notification:', error);
    }
  }, []);

  /**
   * Stop current speech
   */
  const stop = useCallback(async () => {
    try {
      await VoiceService.stop();
      setIsSpeaking(false);
    } catch (error) {
      console.error('Error stopping speech:', error);
    }
  }, []);

  /**
   * Reset for new session
   */
  const resetSession = useCallback(() => {
    VoiceService.clearQueue();
    CalloutManager.reset();
    setIsSpeaking(false);
    setQueueSize(0);
  }, []);

  return {
    isEnabled: voiceSettings.enabled,
    isSpeaking,
    queueSize,
    voiceSettings,
    updateSettings,
    speak,
    stop,
    resetSession,
  };
}
