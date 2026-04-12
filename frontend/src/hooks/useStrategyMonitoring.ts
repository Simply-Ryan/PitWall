/**
 * Hook for managing strategy monitoring during a race
 * 
 * Tracks deviations, manages recalculations, and provides
 * status information for display
 */

import { useState, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@redux/store';
import { addAdjustment, setError } from '@redux/slices/strategySlice';

export interface MonitoringStatus {
  isMonitoring: boolean;
  deviationCount: number;
  riskLevel: 'stable' | 'elevated' | 'critical';
  fuelDeviation: number;
  tireDeviation: number;
  recalculationNeeded: boolean;
  criticalIssueCount: number;
}

/**
 * Hook for strategy monitoring during a race
 */
export function useStrategyMonitoring() {
  const dispatch = useAppDispatch();
  const strategy = useAppSelector((state) => state.strategy);
  const telemetry = useAppSelector((state) => state.telemetry);

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [monitoringStatus, setMonitoringStatus] = useState<MonitoringStatus>({
    isMonitoring: false,
    deviationCount: 0,
    riskLevel: 'stable',
    fuelDeviation: 0,
    tireDeviation: 0,
    recalculationNeeded: false,
    criticalIssueCount: 0,
  });

  /**
   * Start monitoring
   */
  const startMonitoring = useCallback(() => {
    if (!strategy.activeStrategy) {
      dispatch(setError('No active strategy to monitor'));
      return;
    }
    setIsMonitoring(true);
  }, [strategy.activeStrategy, dispatch]);

  /**
   * Stop monitoring
   */
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  /**
   * Record an adjustment/deviation during race
   */
  const recordDeviation = useCallback(
    (
      type: string,
      deviation: number,
      reason: string,
    ) => {
      dispatch(
        addAdjustment({
          id: `adj-${Date.now()}`,
          lap: telemetry.data?.performance.lapNumber ?? 0,
          fuel: deviation,
          wear: 0,
          deviation: deviation,
          reason,
          timestamp: Date.now(),
        }),
      );
    },
    [dispatch, telemetry.data],
  );

  /**
   * Update monitoring status based on current telemetry
   */
  const updateMonitoringStatus = useCallback(() => {
    if (!isMonitoring || !strategy.activeStrategy) return;

    const telemetryData = telemetry.data;
    if (!telemetryData) return;

    // Calculate simulated deviations for demonstration
    const expectedFuel = 2.5 * (telemetryData.performance.lapNumber - 1);
    const fuelUsed = (100 - telemetryData.fuel.level);
    const fuelDev = fuelUsed - expectedFuel;

    const expectedWear = 1.5 * (telemetryData.performance.lapNumber - 1);
    const avgWear =
      ((telemetryData.tires.rearLeft?.wear ?? 0) +
        (telemetryData.tires.rearRight?.wear ?? 0) +
        (telemetryData.tires.frontLeft?.wear ?? 0) +
        (telemetryData.tires.frontRight?.wear ?? 0)) /
      4;
    const tireDev = avgWear - expectedWear;

    // Determine risk level
    let riskLevel: 'stable' | 'elevated' | 'critical' = 'stable';
    let deviationCount = 0;
    let criticalIssueCount = 0;

    if (fuelDev > 5 || avgWear > 85) {
      riskLevel = 'elevated';
      deviationCount++;
    }
    if (fuelDev > 10 || avgWear > 90 || telemetryData.fuel.level < 5) {
      riskLevel = 'critical';
      criticalIssueCount++;
    }
    if (fuelDev > 8) {
      deviationCount++;
    }
    if (Math.abs(tireDev) > 5) {
      deviationCount++;
      if (Math.abs(tireDev) > 10) {
        criticalIssueCount++;
      }
    }

    setMonitoringStatus({
      isMonitoring: true,
      deviationCount,
      riskLevel,
      fuelDeviation: fuelDev,
      tireDeviation: tireDev,
      recalculationNeeded: riskLevel === 'critical' || fuelDev > 8,
      criticalIssueCount,
    });
  }, [isMonitoring, strategy.activeStrategy, telemetry.data]);

  /**
   * Get monitoring summary
   */
  const getMonitoringSummary = useCallback(() => {
    return {
      ...monitoringStatus,
      adjustmentCount: strategy.adjustments.length,
      lastAdjustmentLap: strategy.adjustments.length > 0
        ? strategy.adjustments[strategy.adjustments.length - 1].lap
        : null,
    };
  }, [monitoringStatus, strategy.adjustments]);

  /**
   * Check if recalculation is recommended
   */
  const shouldRecalculate = useCallback(() => {
    return monitoringStatus.recalculationNeeded;
  }, [monitoringStatus.recalculationNeeded]);

  return {
    // State
    isMonitoring,
    monitoringStatus,

    // Controls
    startMonitoring,
    stopMonitoring,
    recordDeviation,
    updateMonitoringStatus,

    // Helpers
    getMonitoringSummary,
    shouldRecalculate,
  };
}
