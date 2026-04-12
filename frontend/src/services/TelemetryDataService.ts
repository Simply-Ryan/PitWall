/**
 * Telemetry Data Service
 * 
 * Centralized service that bridges Redux state, formatters, fuel calculations,
 * and provides ready-to-display telemetry data to screens and components.
 */

import { Store } from '@reduxjs/toolkit';
import * as formatters from '../utils/formatters';
import {
  getAdvancedFuelPrediction,
  getAdvancedPitStrategies,
  assessAdvancedRisk,
} from './FuelCalculator';
import type { FuelPrediction, PitStrategyOption } from './FuelStrategyCalculator';

/**
 * Formatted telemetry data ready for display
 */
export interface FormattedTelemetryData {
  // Time data
  lapTime: string; // "MM:SS.mmm"
  delta: string; // "+/-M:SS.mm"
  sessionDuration: string; // "Xh Ym" or "Xm Ys"

  // Speed & RPM
  speed: string; // "XXX km/h"
  rpm: string; // "XXXX" or "XXXX/YYYY"

  // Fuel data
  fuel: string; // "XX.XL"
  fuelCapacity: string; // "XX.XL"
  fuelConsumption: string; // "X.XXXL/lap"
  fuelPercentage: string; // "XX.X%"

  // Input data
  throttle: string; // "XX%"
  brake: string; // "XX%"

  // Tire data
  tireFL: {
    temperature: string; // "XX°C"
    wear: string; // "XX%"
    wearLevel: 'good' | 'fair' | 'poor';
    tempStatus: 'cold' | 'optimal' | 'warm' | 'hot';
  };
  tireFR: {
    temperature: string;
    wear: string;
    wearLevel: 'good' | 'fair' | 'poor';
    tempStatus: 'cold' | 'optimal' | 'warm' | 'hot';
  };
  tireRL: {
    temperature: string;
    wear: string;
    wearLevel: 'good' | 'fair' | 'poor';
    tempStatus: 'cold' | 'optimal' | 'warm' | 'hot';
  };
  tireRR: {
    temperature: string;
    wear: string;
    wearLevel: 'good' | 'fair' | 'poor';
    tempStatus: 'cold' | 'optimal' | 'warm' | 'hot';
  };

  // Position data
  position: string; // "Xth" or "Xth/YY"
  lapNumber: string; // "Lap X"

  // Advanced calculations
  fuelPrediction: FuelPrediction | null;
  pitStrategies: PitStrategyOption[];
  riskAssessment: {
    status: 'safe' | 'warning' | 'critical';
    message: string;
    recommendations: string[];
  };
}

/**
 * Summary dashboard data
 */
export interface DashboardSummary {
  isConnected: boolean;
  isInRace: boolean;
  currentLap: number;
  totalLaps: number;
  position: string;
  lapTime: string;
  delta: string;
  fuel: string;
  fuelStatus: 'safe' | 'warning' | 'critical';
  throttle: string;
  brake: string;
  speed: string;
  rpm: string;
  avgTireTemp: string;
  avgTireWear: string;
}

/**
 * Main Telemetry Data Service
 */
class TelemetryDataService {
  private store: Store | null = null;

  /**
   * Initialize the service with Redux store
   */
  setStore(store: Store) {
    this.store = store;
  }

  /**
   * Get full formatted telemetry data
   */
  getFormattedTelemetry(): FormattedTelemetryData | null {
    if (!this.store) {
      console.warn('TelemetryDataService: Store not initialized');
      return null;
    }

    const state = this.store.getState() as any;
    const telemetry = state.telemetry?.current;
    const session = state.session;
    const consumptionHistory = state.telemetry?.consumptionHistory || [];

    if (!telemetry) {
      return null;
    }

    // Format tire data
    const formatTire = (temp: number, wear: number) => ({
      temperature: formatters.formatTemperature(temp),
      wear: formatters.formatTireWear(wear),
      wearLevel: formatters.getTireWearColor(wear),
      tempStatus: formatters.getTireTemperatureColor(temp),
    });

    // Get fuel prediction if in race
    let fuelPrediction: FuelPrediction | null = null;
    let pitStrategies: PitStrategyOption[] = [];
    let riskAssessment = { status: 'safe' as const, message: '', recommendations: [] };

    if (session?.isActive && session?.currentLap && session?.totalLaps) {
      try {
        fuelPrediction = getAdvancedFuelPrediction(
          session.currentLap,
          session.totalLaps,
          telemetry.fuel,
          telemetry.fuelCapacity,
          consumptionHistory
        );

        pitStrategies = getAdvancedPitStrategies(
          session.currentLap,
          session.totalLaps,
          telemetry.fuel,
          telemetry.fuelCapacity,
          consumptionHistory
        );

        riskAssessment = assessAdvancedRisk(
          session.currentLap,
          session.totalLaps,
          telemetry.fuel,
          consumptionHistory
        );
      } catch (error) {
        console.error('Error calculating fuel predictions:', error);
      }
    }

    return {
      // Time data
      lapTime: formatters.formatTime(telemetry.lapTime || 0),
      delta: formatters.formatDelta(telemetry.delta || 0),
      sessionDuration: formatters.formatSessionDuration(
        telemetry.sessionDuration || 0
      ),

      // Speed & RPM
      speed: formatters.formatSpeed(telemetry.speed || 0),
      rpm: formatters.formatRPM(telemetry.rpm || 0, telemetry.maxRPM || 9000),

      // Fuel data
      fuel: formatters.formatFuel(telemetry.fuel || 0),
      fuelCapacity: formatters.formatFuel(telemetry.fuelCapacity || 60),
      fuelConsumption: formatters.formatConsumption(telemetry.fuelPerLap || 0),
      fuelPercentage: formatters.formatPercentage(
        (telemetry.fuel || 0) / (telemetry.fuelCapacity || 60)
      ),

      // Input data
      throttle: formatters.formatInput(telemetry.throttle || 0),
      brake: formatters.formatInput(telemetry.brake || 0),

      // Tire data
      tireFL: formatTire(telemetry.tires?.temperatureLF?.middle || 0, telemetry.tires?.wearLF || 0),
      tireFR: formatTire(telemetry.tires?.temperatureRF?.middle || 0, telemetry.tires?.wearRF || 0),
      tireRL: formatTire(telemetry.tires?.temperatureLR?.middle || 0, telemetry.tires?.wearLR || 0),
      tireRR: formatTire(telemetry.tires?.temperatureRR?.middle || 0, telemetry.tires?.wearRR || 0),

      // Position data
      position: formatters.formatPosition(
        telemetry.position || 1,
        session?.totalCars || undefined
      ),
      lapNumber: formatters.formatLapNumber(session?.currentLap || 0),

      // Advanced calculations
      fuelPrediction,
      pitStrategies,
      riskAssessment,
    };
  }

  /**
   * Get dashboard summary
   */
  getDashboardSummary(): DashboardSummary | null {
    const formatted = this.getFormattedTelemetry();
    if (!formatted) return null;

    const state = this.store?.getState() as any;
    const session = state?.session;
    const telemetry = state?.telemetry?.current;

    // Calculate average tire metrics
    const avgTireTemp =
      ((telemetry?.tires?.temperatureLF?.middle || 0) +
        (telemetry?.tires?.temperatureRF?.middle || 0) +
        (telemetry?.tires?.temperatureLR?.middle || 0) +
        (telemetry?.tires?.temperatureRR?.middle || 0)) /
      4;

    const avgTireWear =
      ((telemetry?.tires?.wearLF || 0) +
        (telemetry?.tires?.wearRF || 0) +
        (telemetry?.tires?.wearLR || 0) +
        (telemetry?.tires?.wearRR || 0)) /
      4;

    // Determine fuel status
    const fuelPercentage = (telemetry?.fuel || 0) / (telemetry?.fuelCapacity || 60);
    let fuelStatus: 'safe' | 'warning' | 'critical' = 'safe';
    if (fuelPercentage < 0.1) fuelStatus = 'critical';
    else if (fuelPercentage < 0.3) fuelStatus = 'warning';

    return {
      isConnected: state?.session?.isConnected || false,
      isInRace: session?.isActive || false,
      currentLap: session?.currentLap || 0,
      totalLaps: session?.totalLaps || 0,
      position: formatted.position,
      lapTime: formatted.lapTime,
      delta: formatted.delta,
      fuel: formatted.fuel,
      fuelStatus,
      throttle: formatted.throttle,
      brake: formatted.brake,
      speed: formatted.speed,
      rpm: formatted.rpm,
      avgTireTemp: formatters.formatTemperature(avgTireTemp),
      avgTireWear: formatters.formatTireWear(avgTireWear),
    };
  }

  /**
   * Get specific formatted value by key
   */
  getFormatted<K extends keyof FormattedTelemetryData>(
    key: K
  ): FormattedTelemetryData[K] | null {
    const formatted = this.getFormattedTelemetry();
    return formatted ? formatted[key] : null;
  }

  /**
   * Check if specific alert should be shown
   */
  shouldShowAlert(type: 'fuel' | 'tire' | 'performance' | 'collision'): boolean {
    const state = this.store?.getState() as any;
    const telemetry = state?.telemetry?.current;

    switch (type) {
      case 'fuel':
        return (telemetry?.fuel || 0) / (telemetry?.fuelCapacity || 60) < 0.2;

      case 'tire':
        const avgWear =
          ((telemetry?.tires?.wearLF || 0) +
            (telemetry?.tires?.wearRF || 0) +
            (telemetry?.tires?.wearLR || 0) +
            (telemetry?.tires?.wearRR || 0)) /
          4;
        return avgWear > 0.8;

      case 'performance':
        // Check for performance anomalies
        const rpmPercent = (telemetry?.rpm || 0) / (telemetry?.maxRPM || 9000);
        return rpmPercent > 0.95;

      case 'collision':
        // Would need crash detection data
        return false;

      default:
        return false;
    }
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts(): Array<{ type: string; severity: 'info' | 'warning' | 'critical'; message: string }> {
    const alerts: Array<{
      type: string;
      severity: 'info' | 'warning' | 'critical';
      message: string;
    }> = [];

    const formatted = this.getFormattedTelemetry();
    if (!formatted) return alerts;

    // Check fuel
    if (this.shouldShowAlert('fuel')) {
      alerts.push({
        type: 'fuel',
        severity: 'warning',
        message: `Low fuel: ${formatted.fuel}`,
      });
    }

    // Check tires
    if (this.shouldShowAlert('tire')) {
      alerts.push({
        type: 'tire',
        severity: 'warning',
        message: 'Tire wear critical - consider pit stop',
      });
    }

    // Check risk assessment
    if (formatted.riskAssessment?.status === 'critical') {
      alerts.push({
        type: 'fuel_risk',
        severity: 'critical',
        message: formatted.riskAssessment.message,
      });
    } else if (formatted.riskAssessment?.status === 'warning') {
      alerts.push({
        type: 'fuel_risk',
        severity: 'warning',
        message: formatted.riskAssessment.message,
      });
    }

    return alerts;
  }
}

// Export singleton instance
export const telemetryDataService = new TelemetryDataService();

export default TelemetryDataService;
