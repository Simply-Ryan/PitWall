/**
 * Fuel Strategy Calculator Service
 *
 * Provides comprehensive fuel consumption analysis and race predictions:
 * - Per-lap consumption tracking
 * - Fuel-to-end predictions
 * - Safety margin calculations
 * - Trend analysis and consistency metrics
 * - Advanced pit strategy optimization
 */

import FuelStrategyCalculator, {
  FuelConsumptionData,
  RaceState,
  FuelPrediction,
  PitStrategyOption,
} from './FuelStrategyCalculator';

export interface FuelMetrics {
  currentLevel: number; // liters
  capacity: number; // liters
  avgConsumption: number; // liters per lap
  consistency: number; // 0-1 (stdev of consumption)
  remainingLaps: number;
  predictedEndFuel: number; // liters at end
  safetyMargin: number; // liters
  safetyStatus: 'safe' | 'warning' | 'danger'; // Based on margin
  willFinish: boolean;
}

export interface RaceStrategy {
  currentLap: number;
  totalLaps: number;
  pitWindow: {
    earliest: number; // lap number
    latest: number; // lap number
    recommendedLap: number; // lap number
  };
  stopCount: number;
  fuelPerStop: number;
  lapsPerStop: number;
}

export interface FuelHistory {
  lapNumber: number;
  fuelLevel: number;
  consumption: number; // delta from previous lap
  avgConsumption: number; // rolling average
}

/**
 * Calculate key fuel metrics for race strategy
 */
export function calculateFuelMetrics(
  currentFuel: number,
  fuelCapacity: number,
  consumptionHistory: number[], // Array of consumption values per lap
  remainingLaps: number,
  safetyMargin: number = 1.5 // Default 1.5L safety margin
): FuelMetrics {
  // Handle edge cases
  if (!consumptionHistory || consumptionHistory.length === 0) {
    return {
      currentLevel: currentFuel,
      capacity: fuelCapacity,
      avgConsumption: 0,
      consistency: 0,
      remainingLaps,
      predictedEndFuel: currentFuel,
      safetyMargin,
      safetyStatus: 'safe',
      willFinish: true,
    };
  }

  // Calculate average consumption
  const avgConsumption = consumptionHistory.reduce((a, b) => a + b, 0) / consumptionHistory.length;

  // Calculate consistency (standard deviation)
  const variance =
    consumptionHistory.reduce((sum, val) => sum + Math.pow(val - avgConsumption, 2), 0) /
    consumptionHistory.length;
  const consistency = Math.sqrt(variance);

  // Predict fuel at end (add buffer for margin of error)
  const consumptionBuffer = consistency > 0 ? consistency * 1.5 : 0;
  const projectedConsumption = (avgConsumption + consumptionBuffer) * remainingLaps;
  const predictedEndFuel = Math.max(0, currentFuel - projectedConsumption);

  // Calculate safety status
  const actualSafetyMargin = predictedEndFuel - safetyMargin;
  let safetyStatus: 'safe' | 'warning' | 'danger';

  if (actualSafetyMargin < 0) {
    safetyStatus = 'danger';
  } else if (actualSafetyMargin < safetyMargin * 0.5) {
    safetyStatus = 'warning';
  } else {
    safetyStatus = 'safe';
  }

  const willFinish = predictedEndFuel >= safetyMargin;

  return {
    currentLevel: currentFuel,
    capacity: fuelCapacity,
    avgConsumption: parseFloat(avgConsumption.toFixed(3)),
    consistency: parseFloat(consistency.toFixed(3)),
    remainingLaps,
    predictedEndFuel: parseFloat(predictedEndFuel.toFixed(2)),
    safetyMargin,
    safetyStatus,
    willFinish,
  };
}

/**
 * Calculate optimal pit strategy based on fuel consumption
 */
export function calculateRaceStrategy(
  currentLap: number,
  totalLaps: number,
  currentFuel: number,
  fuelCapacity: number,
  avgConsumption: number
): RaceStrategy {
  const remainingLaps = totalLaps - currentLap;
  const fuelNeeded = avgConsumption * remainingLaps;

  // Determine if pit stops are necessary
  let stopCount = 0;
  let lapsPerStop = totalLaps;
  let fuelPerStop = fuelCapacity;

  if (fuelNeeded > currentFuel) {
    // Calculate minimum stops needed
    const refuelableCapacity = fuelCapacity * 0.95; // Leave 5% to avoid overfill
    const lapsPerTank = Math.floor(refuelableCapacity / avgConsumption);

    stopCount = Math.ceil(remainingLaps / lapsPerTank);
    lapsPerStop = Math.ceil(remainingLaps / (stopCount + 1));
    fuelPerStop = Math.ceil((avgConsumption * lapsPerStop) / 10) * 10; // Round up to nearest 10L
  }

  // Calculate pit window
  const currentLapWithoutPit = currentLap;
  let earliestPit = currentLapWithoutPit;
  let latestPit = Math.max(currentLapWithoutPit + 5, Math.floor(totalLaps * 0.5));
  let recommendedPit = Math.min(currentLapWithoutPit + lapsPerStop, latestPit);

  // Adjust if we're already in race
  if (currentLap > 1) {
    earliestPit = currentLap + 1;
    recommendedPit = Math.min(recommendedPit, totalLaps - 5);
  }

  return {
    currentLap,
    totalLaps,
    pitWindow: {
      earliest: Math.max(1, earliestPit),
      latest: Math.min(totalLaps, latestPit),
      recommendedLap: Math.max(1, Math.min(totalLaps, recommendedPit)),
    },
    stopCount,
    fuelPerStop,
    lapsPerStop,
  };
}

/**
 * Analyze fuel consumption trend
 * Returns 'increasing', 'stable', or 'decreasing'
 */
export function analyzeTrend(history: number[]): 'increasing' | 'stable' | 'decreasing' {
  if (history.length < 3) return 'stable';

  const recentCount = Math.min(5, history.length);
  const recentHistory = history.slice(-recentCount);
  const olderHistory = history.slice(0, Math.max(1, history.length - recentCount - 2));

  if (olderHistory.length === 0) return 'stable';

  const recentAvg = recentHistory.reduce((a, b) => a + b, 0) / recentHistory.length;
  const olderAvg = olderHistory.reduce((a, b) => a + b, 0) / olderHistory.length;

  const difference = recentAvg - olderAvg;
  const percentChange = (difference / olderAvg) * 100;

  if (percentChange > 5) return 'increasing';
  if (percentChange < -5) return 'decreasing';
  return 'stable';
}

/**
 * Perform a conservative analysis (favors safety)
 * Assumes worst-case consumption scenario
 */
export function conservativeAnalysis(
  currentFuel: number,
  consumption: number[],
  remainingLaps: number
): {
  minEndFuel: number;
  maxConsumption: number;
  recommendedStop: boolean;
} {
  if (!consumption || consumption.length === 0) {
    return {
      minEndFuel: currentFuel,
      maxConsumption: 0,
      recommendedStop: false,
    };
  }

  const maxConsumption = Math.max(...consumption) * 1.1; // Add 10% buffer
  const worstCaseConsumption = maxConsumption * remainingLaps;
  const minEndFuel = currentFuel - worstCaseConsumption;

  const recommendedStop = minEndFuel < 2.0; // If worst case ends with < 2L

  return {
    minEndFuel: parseFloat(minEndFuel.toFixed(2)),
    maxConsumption: parseFloat(maxConsumption.toFixed(3)),
    recommendedStop,
  };
}

/**
 * Advanced Integration: Get comprehensive fuel prediction using FuelStrategyCalculator
 * 
 * @param currentLap Current lap number
 * @param totalLaps Total laps in race
 * @param currentFuel Current fuel level in liters
 * @param fuelCapacity Tank capacity in liters
 * @param consumptionHistory Array of fuel consumption per lap
 * @returns Comprehensive fuel prediction with multiple pit strategies
 */
export function getAdvancedFuelPrediction(
  currentLap: number,
  totalLaps: number,
  currentFuel: number,
  fuelCapacity: number,
  consumptionHistory: number[],
  fuelBooked?: number
): FuelPrediction {
  // Prepare race state
  const raceState: RaceState = {
    currentLap,
    totalLaps,
    currentFuel,
    fuelCapacity,
    fuelBooked,
  };

  // Prepare consumption data
  const trend = analyzeTrend(consumptionHistory);
  const avgConsumption =
    consumptionHistory.length > 0
      ? consumptionHistory.reduce((a, b) => a + b, 0) / consumptionHistory.length
      : 0;
  const minConsumption =
    consumptionHistory.length > 0 ? Math.min(...consumptionHistory) : 0;
  const maxConsumption =
    consumptionHistory.length > 0 ? Math.max(...consumptionHistory) : 0;

  const consumption: FuelConsumptionData = {
    currentLapConsumption: consumptionHistory[consumptionHistory.length - 1] || 0,
    averageConsumption: avgConsumption,
    minConsumption,
    maxConsumption,
    consumptionTrend: trend,
  };

  // Generate prediction
  return FuelStrategyCalculator.generatePrediction(raceState, consumption);
}

/**
 * Advanced Integration: Get pit strategies
 * 
 * @param currentLap Current lap number
 * @param totalLaps Total laps in race
 * @param currentFuel Current fuel level
 * @param fuelCapacity Tank capacity
 * @param consumptionHistory Array of consumption values
 * @returns Array of pit strategy options with risk assessment
 */
export function getAdvancedPitStrategies(
  currentLap: number,
  totalLaps: number,
  currentFuel: number,
  fuelCapacity: number,
  consumptionHistory: number[]
): PitStrategyOption[] {
  const raceState: RaceState = {
    currentLap,
    totalLaps,
    currentFuel,
    fuelCapacity,
  };

  const trend = analyzeTrend(consumptionHistory);
  const avgConsumption =
    consumptionHistory.length > 0
      ? consumptionHistory.reduce((a, b) => a + b, 0) / consumptionHistory.length
      : 0;
  const minConsumption =
    consumptionHistory.length > 0 ? Math.min(...consumptionHistory) : 0;
  const maxConsumption =
    consumptionHistory.length > 0 ? Math.max(...consumptionHistory) : 0;

  const consumption: FuelConsumptionData = {
    currentLapConsumption: consumptionHistory[consumptionHistory.length - 1] || 0,
    averageConsumption: avgConsumption,
    minConsumption,
    maxConsumption,
    consumptionTrend: trend,
  };

  return FuelStrategyCalculator.calculateStrategies(raceState, consumption);
}

/**
 * Advanced Integration: Assess current fuel risk
 * 
 * @param currentLap Current lap
 * @param totalLaps Total laps
 * @param currentFuel Current fuel
 * @param consumptionHistory Consumption history
 * @returns Risk assessment with recommendations
 */
export function assessAdvancedRisk(
  currentLap: number,
  totalLaps: number,
  currentFuel: number,
  consumptionHistory: number[]
) {
  const raceState: RaceState = {
    currentLap,
    totalLaps,
    currentFuel,
    fuelCapacity: 100, // Placeholder - will use average
  };

  const trend = analyzeTrend(consumptionHistory);
  const avgConsumption =
    consumptionHistory.length > 0
      ? consumptionHistory.reduce((a, b) => a + b, 0) / consumptionHistory.length
      : 0;

  const consumption: FuelConsumptionData = {
    currentLapConsumption: consumptionHistory[consumptionHistory.length - 1] || 0,
    averageConsumption: avgConsumption,
    minConsumption: Math.min(...consumptionHistory),
    maxConsumption: Math.max(...consumptionHistory),
    consumptionTrend: trend,
  };

  return FuelStrategyCalculator.assessRisk(raceState, consumption);
}

/**
 * Calculate pit loss impact on fuel strategy
 * Helps determine if pit stop is worth the time
 */
export function calculatePitImpact(
  currentLap: number,
  totalLaps: number,
  currentFuel: number,
  avgFuelNeededToFinish: number,
  pitLossSeconds: number = 45 // Average pit stop time in seconds
): {
  lapTimeLoss: number; // Approximate lap time equivalent of pit stop
  isFuelIssue: boolean;
  recommendation: string;
} {
  const remainingLaps = totalLaps - currentLap;
  const fuelDeficit = (avgFuelNeededToFinish * remainingLaps) - currentFuel;

  // Estimate lap time loss (assuming ~6 seconds per lap on average)
  const lapTimeLoss = (pitLossSeconds / 60) * 10; // Rough seconds estimate

  const isFuelIssue = fuelDeficit > 0;

  let recommendation = '';
  if (isFuelIssue) {
    recommendation = `Pit soon! Need ~${Math.ceil(fuelDeficit)}L more fuel`;
  } else if (currentFuel < avgFuelNeededToFinish * (remainingLaps * 0.5)) {
    recommendation = 'Plan pit stop for safety';
  } else {
    recommendation = 'Can likely finish without pit';
  }

  return {
    lapTimeLoss,
    isFuelIssue,
    recommendation,
  };
}

/**
 * Format fuel values for UI display
 */
export function formatFuelValue(value: number, decimals: number = 2): string {
  return parseFloat(value.toFixed(decimals)).toString();
}

/**
 * Get color coded fuel status for UI
 */
export function getFuelStatusColor(status: 'safe' | 'warning' | 'danger', isDark: boolean = true): string {
  const colors = {
    safe: '#00FF00', // Green
    warning: '#FFFF00', // Yellow
    danger: '#FF4444', // Red
  };
  return colors[status];
}
