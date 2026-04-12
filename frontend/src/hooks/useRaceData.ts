/**
 * Hook for extracting structured race data from Redux telemetry
 * 
 * Maps current telemetry state to StrategyInput format
 * Handles data normalization and validation
 */

import { useAppSelector } from '@redux/store';
import { useSession } from './useSession';
import type {
  StrategyInput,
  VehicleSpecs,
  WeatherCondition,
  HistoricalData,
  RaceType,
} from '@types/raceStrategy';

/**
 * Hook to access and format race data for strategy calculation
 * 
 * Returns structured data ready for API submission to backend
 * Extracts current telemetry and session info into StrategyInput format
 */
export function useRaceData() {
  const telemetry = useAppSelector((state) => state.telemetry);
  const session = useAppSelector((state) => state.session);
  const { duration, isSessionActive } = useSession();

  /**
   * Get current vehicle specs from telemetry
   */
  const getVehicleSpecs = (): VehicleSpecs => {
    return {
      fuelCapacity: 110, // Default to common F1/racing capacity
      maxFuelPerStop: 104, // 95% of capacity
      tireCompound: 'medium',
      estimatedTireLife: 50, // laps
      currentFuelLevel: telemetry.data?.fuel.level ?? 100,
      currentLap: telemetry.data?.performance.lapNumber ?? 1,
      currentTireWearPercent: telemetry.data?.tires.rearLeft?.wear ?? 0,
    };
  };

  /**
   * Get current weather condition
   */
  const getWeatherCondition = (): WeatherCondition => {
    return {
      ambientTemperatureCelsius: 22,
      trackTemperatureCelsius: 50,
      condition: 'clear',
      fuelMultiplier: 1.0,
      tireWearMultiplier: 1.0,
      lapTimeMultiplier: 1.0,
      expectedChange: 'stable',
    };
  };

  /**
   * Get historical consumption data
   * Tracks last 5 laps of fuel consumption
   */
  const getHistoricalData = (last5LapsConsumption: number[] = []): HistoricalData => {
    const avgConsumption =
      last5LapsConsumption.length > 0
        ? last5LapsConsumption.reduce((a, b) => a + b, 0) /
          last5LapsConsumption.length
        : 2.5;

    const stdDev = calculateStandardDeviation(last5LapsConsumption, avgConsumption);

    return {
      last5LapsConsumption,
      averageConsumption: avgConsumption,
      consumptionStandardDeviation: stdDev,
      tireWearPerLap: 1.5,
      lastLapTime: telemetry.data?.performance.deltaToLap ?? 0,
      bestLapTime: 85000, // milliseconds (1:25)
      bestSectorTimes: [25000, 30000, 30000],
      fuelConsumedSoFar: telemetry.data?.fuel.consumed,
    };
  };

  /**
   * Get race type from session or default to lap-based
   */
  const getRaceType = (): RaceType => {
    // Could be enhanced to read from session metadata
    return 'lap-based';
  };

  /**
   * Calculate total race laps
   */
  const getRaceLaps = (): number => {
    // Default values - would be set by user input
    return 100;
  };

  /**
   * Build complete StrategyInput from current state
   */
  const buildStrategyInput = (overrides?: Partial<StrategyInput>): StrategyInput => {
    const baseInput: StrategyInput = {
      raceType: getRaceType(),
      totalLaps: getRaceLaps(),
      currentLap: telemetry.data?.performance.lapNumber ?? 1,
      vehicleSpecs: getVehicleSpecs(),
      weather: getWeatherCondition(),
      historicalData: getHistoricalData(),
      driverSkill: 'intermediate', // default
      pitLossTime: 45, // seconds
      safetyMarginFuel: 1.5, // liters
      assumptions: {
        fuelConsumptionPerLap: 2.5,
        tireWearPerLap: 1.5,
        driverConsistency: 'high',
        weatherExpected: 'stable',
      },
    };

    return { ...baseInput, ...overrides };
  };

  /**
   * Check if we have minimum data to proceed with calculation
   */
  const hasMinimumData = (): boolean => {
    return (
      telemetry.isConnected &&
      isSessionActive() &&
      telemetry.data?.fuel.level !== undefined &&
      telemetry.data?.performance.lapNumber !== undefined
    );
  };

  /**
   * Get formatted telemetry summary for display
   */
  const getTelemetrySummary = () => {
    return {
      sessionActive: isSessionActive(),
      currentLap: telemetry.data?.performance.lapNumber ?? 0,
      currentFuel: telemetry.data?.fuel.level ?? 0,
      currentSpeed: telemetry.data?.vehicle.speed ?? 0,
      tireWear: {
        frontLeft: telemetry.data?.tires.frontLeft?.wear ?? 0,
        frontRight: telemetry.data?.tires.frontRight?.wear ?? 0,
        rearLeft: telemetry.data?.tires.rearLeft?.wear ?? 0,
        rearRight: telemetry.data?.tires.rearRight?.wear ?? 0,
      },
      duration: duration,
    };
  };

  return {
    getVehicleSpecs,
    getWeatherCondition,
    getHistoricalData,
    getRaceType,
    getRaceLaps,
    buildStrategyInput,
    hasMinimumData,
    getTelemetrySummary,
  };
}

/**
 * Helper: Calculate standard deviation
 */
function calculateStandardDeviation(
  values: number[],
  mean: number,
): number {
  if (values.length === 0) return 0;
  const squareDiffs = values.map((v) => Math.pow(v - mean, 2));
  const avgSquareDiff =
    squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquareDiff);
}
