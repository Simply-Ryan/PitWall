/**
 * Backend Race Strategy Types
 * 
 * Types for server-side strategy calculation and persistence
 */

import type {
  RaceType,
  PitStop,
  TireSet,
  WeatherCondition,
  VehicleSpecs,
  HistoricalData,
  StrategyInput,
  StrategyScenario,
  StrategyOutput,
  RiskAssessment,
  StrategyAdjustment,
} from '../types/index';

export type {
  RaceType,
  PitStop,
  TireSet,
  WeatherCondition,
  VehicleSpecs,
  HistoricalData,
  StrategyInput,
  StrategyScenario,
  StrategyOutput,
  RiskAssessment,
  StrategyAdjustment,
};

/**
 * Server-side request/response types
 */

export interface CalculateStrategyRequest {
  input: StrategyInput;
}

export interface CalculateStrategyResponse {
  success: boolean;
  data?: StrategyOutput;
  error?: string;
  calculationTimeMs?: number;
}

export interface SaveStrategyRequest {
  sessionId: string;
  strategyInput: StrategyInput;
  strategyOutput: StrategyOutput;
  activeScenario: 'best' | 'likely' | 'worst';
}

export interface SaveStrategyResponse {
  success: boolean;
  strategyId?: string;
  error?: string;
}

export interface LogAdjustmentRequest {
  strategyId: string;
  adjustment: StrategyAdjustment;
}

export interface LogAdjustmentResponse {
  success: boolean;
  adjustmentId?: string;
  error?: string;
}

/**
 * Internal simulation types
 */

export interface SimulationContext {
  fuelPerLap: number;
  tireWearPerLap: number;
  pitDuration: number;
  safetyMargin: number;
  raceLength: number; // total laps
}

export interface PitSequenceSolution {
  stops: PitStop[];
  totalPitTime: number;
  totalTime: number;
  estimatedFinishFuel: number;
  score: number; // lower is better
}
