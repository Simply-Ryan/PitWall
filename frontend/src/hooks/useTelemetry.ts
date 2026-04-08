/**
 * Custom hook for accessing and managing telemetry state
 */

import { useAppSelector, useAppDispatch } from '@redux/store';
import {
  updateTelemetry,
  setConnected,
  setError,
  clearError,
} from '@redux/slices/telemetrySlice';
import type { TelemetrySnapshot } from '@types/telemetry';

/**
 * Hook to access telemetry state and dispatch actions
 *
 * Example:
 * const { data, isConnected, error, updateData } = useTelemetry();
 */
export function useTelemetry() {
  const dispatch = useAppDispatch();
  const telemetry = useAppSelector((state) => state.telemetry);

  return {
    data: telemetry.data,
    isConnected: telemetry.isConnected,
    error: telemetry.error,

    // Action dispatchers
    updateData: (data: typeof telemetry.data) => {
      dispatch(updateTelemetry(data));
    },

    setConnected: (connected: boolean) => {
      dispatch(setConnected(connected));
    },

    setError: (error: string) => {
      dispatch(setError(error));
    },

    clearError: () => {
      dispatch(clearError());
    },

    // Convenience methods
    getSpeed: () => telemetry.data?.vehicle.speed ?? 0,
    getRPM: () => telemetry.data?.vehicle.rpm ?? 0,
    getGear: () => telemetry.data?.vehicle.gear ?? 0,
    getThrottle: () => telemetry.data?.vehicle.controls.throttle ?? 0,
    getBrake: () => telemetry.data?.vehicle.controls.brake ?? 0,
    getFuelLevel: () => telemetry.data?.vehicle.fuel.level ?? 0,
    getLapTime: () => telemetry.data?.lap.lapTime ?? 0,
    getDelta: () => telemetry.data?.lap.deltaToSessionBest ?? 0,
  };
}
