/**
 * Race Strategy Types
 * 
 * Comprehensive type definitions for race strategy calculation,
 * pit planning, and real-time adjustments
 */

/**
 * Race types and their characteristics
 */
export type RaceType = 'lap-based' | 'time-based' | 'distance-based';

/**
 * Pit stop action (fuel refill, tire change, both, etc.)
 */
export interface PitStop {
  id: string;
  lapNumber: number;
  fuelAmount: number; // liters
  tireChange: boolean;
  tireCompound?: 'soft' | 'medium' | 'hard' | 'intermediate' | 'wet';
  estimatedLossSeconds: number;
  rationale: string;
  driverSwap?: boolean;
}

/**
 * Tire set information
 */
export interface TireSet {
  compound: 'soft' | 'medium' | 'hard' | 'intermediate' | 'wet';
  agePercent: number; // 0-100, where 100 is new
  wearPercent: number; // 0-100, where 100 is fully worn
  estimatedLapsRemaining: number;
  temperatureCelsius: number;
}

/**
 * Weather conditions during race
 */
export interface WeatherCondition {
  ambientTemperatureCelsius: number;
  trackTemperatureCelsius: number;
  condition: 'clear' | 'light_rain' | 'heavy_rain' | 'fog';
  fuelMultiplier: number; // 1.0 = dry baseline
  tireWearMultiplier: number;
  lapTimeMultiplier: number;
  expectedChange?: 'stable' | 'improving' | 'worsening';
}

/**
 * Vehicle specification and current state
 */
export interface VehicleSpecs {
  fuelCapacity: number; // liters
  maxFuelPerStop: number; // liters (typically 95% of capacity)
  tireCompound: 'soft' | 'medium' | 'hard' | 'intermediate' | 'wet';
  estimatedTireLife: number; // laps
  currentFuelLevel: number; // liters
  currentLap: number;
  currentTireWearPercent: number;
}

/**
 * Historical performance data from telemetry
 */
export interface HistoricalData {
  last5LapsConsumption: number[]; // liters per lap
  averageConsumption: number; // liters per lap
  consumptionStandardDeviation: number;
  tireWearPerLap: number; // percent per lap
  lastLapTime: number; // milliseconds
  bestLapTime: number; // milliseconds
  bestSectorTimes: [number, number, number]; // milliseconds per sector
  fuelConsumedSoFar?: number; // liters
}

/**
 * Input for strategy calculation
 */
export interface StrategyInput {
  raceType: RaceType;
  totalLaps?: number; // for lap-based
  totalMinutes?: number; // for time-based
  totalDistanceKm?: number; // for distance-based
  trackName: string;
  simulator: 'iRacing' | 'ACC' | 'AC' | 'F1-24' | 'F1-25' | 'Unknown';
  vehicle: VehicleSpecs;
  weather: WeatherCondition;
  historicalData: HistoricalData;
  pitLossDurationSeconds?: number; // default 45
  safetyMarginLiters?: number; // default 1.5
  driverSkill?: 'conservative' | 'balanced' | 'aggressive'; // affects pace penalty
}

/**
 * Single scenario output (best, likely, or worst case)
 */
export interface StrategyScenario {
  name: 'best' | 'likely' | 'worst';
  description: string;
  pitStops: PitStop[];
  predictedFinishFuel: number; // liters
  predictedTotalTime: number; // milliseconds
  fuelMarginLiters: number;
  tireMarginLaps: number;
  pitTimingConfidence: number; // 0-100%
  riskLevel: 'low' | 'medium' | 'high';
  assumptions: string[]; // e.g., "Fuel consumption +5%", "Tire wear stable"
}

/**
 * Risk assessment for overall strategy
 */
export interface RiskAssessment {
  fuelRisk: 'safe' | 'warning' | 'critical';
  fuelMarginLiters: number;
  tireRisk: 'safe' | 'warning' | 'critical';
  tireMarginLaps: number;
  pitTimingRisk: 'tight' | 'contained' | 'wide';
  pitWindowLaps: number;
  weatherRisk: 'none' | 'low' | 'moderate' | 'high';
  dNFProbabilityPercent: number;
  recommendation: string;
}

/**
 * Complete strategy calculation output
 */
export interface StrategyOutput {
  scenarios: {
    best: StrategyScenario;
    likely: StrategyScenario;
    worst: StrategyScenario;
  };
  riskAssessment: RiskAssessment;
  recommendedScenario: 'best' | 'likely' | 'worst';
  calculatedAt: number; // timestamp
  validForLaps: number; // valid until this lap
}

/**
 * Adjustment made during race
 */
export interface StrategyAdjustment {
  lap: number;
  fuelUsedThisLap: number; // liters
  fuelUsedVsForecast: number; // delta in liters
  tireWearPercent: number;
  lapTimeMs: number;
  adjustmentReason: 'consumption_higher' | 'consumption_lower' | 'tire_wear_faster' | 'manual_override' | 'damage' | 'traffic';
  newPitLapRecommendation?: number;
  timestamp: number;
}

/**
 * Persisted race strategy record
 */
export interface RaceStrategy {
  id: string;
  sessionId: string;
  input: StrategyInput;
  output: StrategyOutput;
  activeScenario: 'best' | 'likely' | 'worst';
  adjustments: StrategyAdjustment[];
  status: 'planning' | 'active' | 'executed' | 'completed';
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

/**
 * Redux state for strategy
 */
export interface StrategyState {
  activeStrategy: RaceStrategy | null;
  scenarios: StrategyOutput | null;
  isCalculating: boolean;
  error: string | null;
  adjustments: StrategyAdjustment[];
  lastRecalcAt: number | null;
}
