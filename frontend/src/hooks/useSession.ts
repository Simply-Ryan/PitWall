/**
 * Custom hook for accessing and managing session state
 */

import { useAppSelector, useAppDispatch } from '@redux/store';
import {
  startSession,
  stopSession,
  endSession,
} from '@redux/slices/sessionSlice';

/**
 * Hook to access session state and dispatch actions
 *
 * Example:
 * const { startNewSession, stopSession, endCurrentSession } = useSession();
 */
export function useSession() {
  const dispatch = useAppDispatch();
  const session = useAppSelector((state) => state.session);

  return {
    // State getters
    id: session.id,
    name: session.name,
    game: session.game,
    startTime: session.startTime,
    isRecording: session.isRecording,

    // Duration in milliseconds
    duration: session.startTime ? Date.now() - session.startTime : null,

    // Action dispatchers
    startNewSession: (id: string, name: string, game: string) => {
      dispatch(startSession({ id, name, game }));
    },

    stopCurrentSession: () => {
      dispatch(stopSession());
    },

    endCurrentSession: () => {
      dispatch(endSession());
    },

    // Convenience methods
    isSessionActive: (): boolean => session.isRecording && session.id !== null,

    getSessionInfo: () => ({
      id: session.id,
      name: session.name,
      game: session.game,
      startTime: session.startTime,
      isRecording: session.isRecording,
    }),
  };
}
