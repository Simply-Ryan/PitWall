/**
 * Race Simulator Service
 * 
 * Core engine for calculating optimal race strategies
 * Generates best/likely/worst case scenarios with pit sequences
 */

import type {
  StrategyInput,
  StrategyOutput,
  StrategyScenario,
  RiskAssessment,
  PitStop,
  StrategyState,
} from '../types/raceStrategy';
import { TireDegradationModel } from './TireDegradationModel';
import { WeatherImpactCalculator } from './WeatherImpactCalculator';

export class RaceSimulator {
  private tireDegradation: TireDegradationModel;
  private weatherCalculator: WeatherImpactCalculator;
  private pitLossDuration: number;
  private safetyMargin: number;

  constructor() {
    this.tireDegradation = new TireDegradationModel();
    this.weatherCalculator = new WeatherImpactCalculator();
    this.pitLossDuration = 45; // seconds
    this.safetyMargin = 1.5; // liters
  }

  /**
   * Main orchestrator - simulate race and generate all scenarios
   */
  simulateRace(input: StrategyInput): StrategyOutput {
    const startTime = Date.now();

    // Calculate base metrics
    const fuelPerLap = this.predictLapConsumption(
      input.historicalData.averageConsumption,
      input.historicalData.consumptionStandardDeviation,
      input.weather,
      input.driverSkill || 'balanced',
    );

    const raceLength = this.calculateRaceLength(input);

    // Generate pit sequences for each scenario
    const bestCase = this.generateScenario(
      'best',
      input,
      raceLength,
      fuelPerLap * 0.95, // 5% better consumption
      1,
    );

    const likelyCase = this.generateScenario(
      'likely',
      input,
      raceLength,
      fuelPerLap,
      0, // 1x standard deviation
    );

    const worstCase = this.generateScenario(
      'worst',
      input,
      raceLength,
      fuelPerLap * 1.15, // 15% worse consumption
      1.5, // 1.5x standard deviation tire wear
    );

    // Calculate risk assessment
    const riskAssessment = this.assessRisk(bestCase, likelyCase, worstCase);

    // Determine recommended scenario
    const recommendedScenario = riskAssessment.fuelRisk === 'critical'
      ? 'best'
      : riskAssessment.fuelRisk === 'warning'
        ? 'likely'
        : 'likely';

    const calculatedAt = Date.now();

    return {
      scenarios: {
        best: bestCase,
        likely: likelyCase,
        worst: worstCase,
      },
      riskAssessment,
      recommendedScenario,
      calculatedAt,
      validForLaps: Math.max(
        bestCase.pitStops[0]?.lapNumber ?? raceLength,
        5, // at least valid for next 5 laps
      ),
    };
  }

  /**
   * Predict fuel consumption per lap
   */
  private predictLapConsumption(
    historical: number,
    stdev: number,
    weather: typeof StrategyInput['weather'],
    driverSkill: string,
  ): number {
    const weatherMultiplier =
      this.weatherCalculator.getFuelMultiplier(weather.condition);
    const tempMultiplier = this.weatherCalculator.getTemperatureMultiplier(
      weather.trackTemperatureCelsius,
    );

    // Driver skill affects consumption
    const skillMultiplier =
      driverSkill === 'aggressive'
        ? 1.08
        : driverSkill === 'conservative'
          ? 0.95
          : 1.0;

    return historical * weatherMultiplier * tempMultiplier * skillMultiplier;
  }

  /**
   * Calculate total race length in laps
   */
  private calculateRaceLength(input: StrategyInput): number {
    if (input.raceType === 'lap-based' && input.totalLaps) {
      return input.totalLaps;
    }

    if (input.raceType === 'time-based' && input.totalMinutes) {
      const avgLapTime =
        input.historicalData.bestLapTime || 120000; // ms, fallback 2 min
      const totalMs = input.totalMinutes * 60 * 1000;
      return Math.ceil(totalMs / avgLapTime);
    }

    if (input.raceType === 'distance-based' && input.totalDistanceKm) {
      // Need track length to calculate
      const estimatedTrackLength = 5; // km, would be from track database
      return Math.ceil(input.totalDistanceKm / estimatedTrackLength);
    }

    return 50; // default fallback
  }

  /**
   * Generate a single scenario (best/likely/worst)
   */
  private generateScenario(
    name: 'best' | 'likely' | 'worst',
    input: StrategyInput,
    raceLength: number,
    fuelPerLap: number,
    tireWearMultiplier: number,
  ): StrategyScenario {
    // Calculate pit windows based on fuel and tire constraints
    const fuelPitWindow = Math.floor(
      (input.vehicle.maxFuelPerStop - this.safetyMargin) / fuelPerLap,
    );

    const tirePitWindow = this.tireDegradation.predictPitTiming(
      input.vehicle.currentLap,
      input.vehicle.currentTireWearPercent,
      input.historicalData.tireWearPerLap * tireWearMultiplier,
      raceLength,
    );

    // Conservative pit window (earlier of fuel/tire constraints)
    const pitWindow = Math.min(
      fuelPitWindow,
      Math.ceil(tirePitWindow / tireWearMultiplier),
    );

    // Generate pit sequence
    const pitStops = this.calculatePitSequence(
      raceLength,
      fuelPerLap,
      input.vehicle.currentLap,
      input.vehicle.currentFuelLevel,
      input.vehicle.maxFuelPerStop,
      pitWindow,
    );

    // Calculate metrics
    const totalPitTime = pitStops.length * (this.pitLossDuration + 10); // +10 for tire change
    const estimatedTotalTime =
      (raceLength * input.historicalData.bestLapTime) / 1000 + totalPitTime;

    // Predict finish fuel
    const totalFuelUsed = fuelPerLap * raceLength;
    const totalFuelNeeded =
      totalFuelUsed +
      input.vehicle.currentFuelLevel -
      input.historicalData.fuelConsumedSoFar ||
      0;

    let predictedFinishFuel = input.vehicle.currentFuelLevel;
    pitStops.forEach((stop) => {
      predictedFinishFuel += stop.fuelAmount;
    });
    predictedFinishFuel -= totalFuelUsed;

    const fuelMargin = predictedFinishFuel - this.safetyMargin;
    const tireMargin = raceLength * (100 - input.vehicle.currentTireWearPercent) / 100;

    return {
      name,
      description: this.getScenarioDescription(name),
      pitStops,
      predictedFinishFuel: Math.max(0, predictedFinishFuel),
      predictedTotalTime: estimatedTotalTime,
      fuelMarginLiters: fuelMargin,
      tireMarginLaps: tireMargin,
      pitTimingConfidence: Math.min(100, Math.max(0, 100 - pitStops.length * 10)),
      riskLevel: this.calculateRiskLevel(fuelMargin, tireMargin),
      assumptions: this.getAssumptions(name, fuelPerLap, tireWearMultiplier),
    };
  }

  /**
   * Calculate optimal pit sequence
   */
  private calculatePitSequence(
    raceLength: number,
    fuelPerLap: number,
    currentLap: number,
    currentFuel: number,
    maxFuelPerStop: number,
    pitWindow: number,
  ): PitStop[] {
    const stops: PitStop[] = [];
    let lapsRemaining = raceLength - currentLap;
    let currentLapNum = currentLap;
    let availableFuel = currentFuel;

    let stopCount = 0;

    // Generate pit stops
    while (lapsRemaining > pitWindow && stopCount < 3) {
      const nextPitLap = currentLapNum + pitWindow;
      const fuelForStint = fuelPerLap * pitWindow;
      const fuelNeeded = Math.min(maxFuelPerStop, fuelForStint + this.safetyMargin);

      stops.push({
        id: `stop-${stopCount + 1}`,
        lapNumber: nextPitLap,
        fuelAmount: fuelNeeded,
        tireChange: true,
        tireCompound: 'hard', // default
        estimatedLossSeconds: this.pitLossDuration + 10,
        rationale: `Fuel window optimal, tire wear approaching threshold (${Math.round(
          ((currentLapNum - currentLap) * 10) % 100,
        )}%)`,
        driverSwap: false,
      });

      currentLapNum = nextPitLap;
      lapsRemaining = raceLength - currentLapNum;
      availableFuel = fuelNeeded;
      stopCount++;
    }

    // Check if final stint needs additional fuel
    const finalFuelNeeded = fuelPerLap * lapsRemaining + this.safetyMargin;
    if (finalFuelNeeded > availableFuel && lapsRemaining > 0) {
      stops.push({
        id: `stop-${stopCount + 1}`,
        lapNumber: currentLapNum + Math.floor(lapsRemaining / 2),
        fuelAmount: Math.min(maxFuelPerStop, finalFuelNeeded),
        tireChange: true,
        tireCompound: 'hard',
        estimatedLossSeconds: this.pitLossDuration + 10,
        rationale: 'Final fuel stop pre lap 10 margin',
        driverSwap: false,
      });
    }

    return stops;
  }

  /**
   * Assess overall risk
   */
  private assessRisk(
    best: StrategyScenario,
    likely: StrategyScenario,
    worst: StrategyScenario,
  ): RiskAssessment {
    const fuelMargin = likely.fuelMarginLiters;
    const tireMargin = likely.tireMarginLaps;
    const pitWindowLaps = 3; // example

    // Determine fuel risk
    let fuelRisk: 'safe' | 'warning' | 'critical' = 'safe';
    if (fuelMargin < 2) fuelRisk = 'critical';
    else if (fuelMargin < 5) fuelRisk = 'warning';

    // Determine tire risk
    let tireRisk: 'safe' | 'warning' | 'critical' = 'safe';
    if (tireMargin < 2) tireRisk = 'critical';
    else if (tireMargin < 5) tireRisk = 'warning';

    // Determine pit timing risk
    let pitTimingRisk: 'tight' | 'contained' | 'wide' = 'contained';
    if (pitWindowLaps < 2) pitTimingRisk = 'tight';
    else if (pitWindowLaps > 5) pitTimingRisk = 'wide';

    // Weather risk
    const weatherRisk: 'none' | 'low' | 'moderate' | 'high' = 'none';

    // Calculate DNF probability (simplified)
    const dNFProbability =
      (fuelRisk === 'critical' ? 15 : fuelRisk === 'warning' ? 5 : 0) +
      (tireRisk === 'critical' ? 10 : tireRisk === 'warning' ? 3 : 0);

    return {
      fuelRisk,
      fuelMarginLiters: fuelMargin,
      tireRisk,
      tireMarginLaps: tireMargin,
      pitTimingRisk,
      pitWindowLaps,
      weatherRisk,
      dNFProbabilityPercent: Math.min(25, dNFProbability),
      recommendation: this.generateRecommendation(
        fuelRisk,
        tireRisk,
        pitTimingRisk,
      ),
    };
  }

  /**
   * Helper: Calculate risk level from margins
   */
  private calculateRiskLevel(
    fuelMargin: number,
    tireMargin: number,
  ): 'low' | 'medium' | 'high' {
    if (fuelMargin < 2 || tireMargin < 2) return 'high';
    if (fuelMargin < 5 || tireMargin < 5) return 'medium';
    return 'low';
  }

  /**
   * Helper: Get scenario description
   */
  private getScenarioDescription(scenario: string): string {
    switch (scenario) {
      case 'best':
        return 'Optimal conditions: better fuel economy, consistent tire wear';
      case 'likely':
        return 'Realistic scenario: average fuel consumption, normal tire degradation';
      case 'worst':
        return 'Conservative case: higher fuel usage, accelerated tire wear';
      default:
        return '';
    }
  }

  /**
   * Helper: Get scenario assumptions
   */
  private getAssumptions(
    scenario: string,
    fuelPerLap: number,
    tireMultiplier: number,
  ): string[] {
    switch (scenario) {
      case 'best':
        return [
          `Fuel consumption: ${(fuelPerLap * 0.95).toFixed(2)}L/lap (-5%)`,
          'Tire wear: normal progression',
          'No safety car periods',
        ];
      case 'likely':
        return [
          `Fuel consumption: ${fuelPerLap.toFixed(2)}L/lap`,
          'Tire wear: historical average',
          'One safety car period possible',
        ];
      case 'worst':
        return [
          `Fuel consumption: ${(fuelPerLap * 1.15).toFixed(2)}L/lap (+15%)`,
          `Tire wear: accelerated (${(tireMultiplier * 100).toFixed(0)}%)`,
          'Heavy traffic, may require additional stop',
        ];
      default:
        return [];
    }
  }

  /**
   * Helper: Generate recommendation text
   */
  private generateRecommendation(
    fuelRisk: string,
    tireRisk: string,
    pitTiming: string,
  ): string {
    if (fuelRisk === 'critical' || tireRisk === 'critical') {
      return 'Execute BEST case strategy - critical margins detected';
    }
    if (fuelRisk === 'warning' || tireRisk === 'warning') {
      return 'LIKELY case strategy - monitor consumption closely';
    }
    return 'Any scenario viable - choose based on driving style';
  }
}
