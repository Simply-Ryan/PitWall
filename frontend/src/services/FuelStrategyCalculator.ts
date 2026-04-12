/**
 * Advanced Fuel Strategy Calculator
 * 
 * Calculates optimal pit strategy based on:
 * - Current fuel consumption rate
 * - Remaining fuel and tank capacity
 * - Race length and remaining laps
 * - Pit loss (time + fuel)
 * - Tire degradation projections
 */

export interface FuelConsumptionData {
  currentLapConsumption: number; // L per lap
  averageConsumption: number; // L per lap (rolling average)
  minConsumption: number; // L per lap (best lap)
  maxConsumption: number; // L per lap (worst lap)
  consumptionTrend: 'increasing' | 'stable' | 'decreasing'; // Trend indicator
}

export interface RaceState {
  currentLap: number;
  totalLaps: number;
  currentFuel: number; // Liters
  fuelCapacity: number; // Liters
  fuelBooked?: number; // Additional fuel for pit stop
}

export interface PitStrategyOption {
  lapNumber: number; // When to pit
  fuelToAdd: number; // Liters
  estimatedTimeInPit: number; // Seconds
  fuelAtFinish: number; // Projected fuel at finish
  riskLevel: 'low' | 'medium' | 'high'; // Strategy risk
  description: string;
}

export interface FuelPrediction {
  lapsUntilEmpty: number; // Projected laps until fuel runs out
  fuelPerLap: number; // Average consumption
  pitWindowStart: number; // Earliest lap to pit
  pitWindowEnd: number; // Latest lap to pit (before running out)
  recommendedPits: number; // Recommended number of pit stops
  strategies: PitStrategyOption[];
  safetyMargin: number; // Days fuel buffer at finish
}

class FuelStrategyCalculator {
  /**
   * Calculate how many laps the car can run on remaining fuel
   */
  static calculateLapsUntilEmpty(
    currentFuel: number,
    consumptionPerLap: number
  ): number {
    if (consumptionPerLap <= 0 || currentFuel <= 0) return 0;
    return Math.floor(currentFuel / consumptionPerLap);
  }

  /**
   * Calculate fuel needed to reach the end
   */
  static calculateFuelNeeded(
    remainingLaps: number,
    consumptionPerLap: number,
    safetyMarginLaps: number = 1
  ): number {
    const safetyFuel = consumptionPerLap * safetyMarginLaps;
    return remainingLaps * consumptionPerLap + safetyFuel;
  }

  /**
   * Determine if we have enough fuel to finish without pitting
   */
  static canFinishWithoutPit(
    currentFuel: number,
    remainingLaps: number,
    consumptionPerLap: number,
    safetyMarginLaps: number = 1
  ): boolean {
    const fuelNeeded = this.calculateFuelNeeded(
      remainingLaps,
      consumptionPerLap,
      safetyMarginLaps
    );
    return currentFuel >= fuelNeeded;
  }

  /**
   * Calculate optimal fuel to add at pit stop
   */
  static calculateOptimalFuelToAdd(
    currentFuel: number,
    remainingLaps: number,
    fuelCapacity: number,
    consumptionPerLap: number,
    fuelBooked: number = 0
  ): number {
    // Maximum we can add
    const maxAdd = fuelCapacity - currentFuel - fuelBooked;

    // Fuel needed to finish safely
    const safetyMargin = consumptionPerLap * 1.5; // 1.5 lap safety buffer
    const fuelNeededToFinish =
      remainingLaps * consumptionPerLap + safetyMargin;

    // Optimal to add
    const optimalAdd = Math.max(
      0,
      Math.min(fuelNeededToFinish - currentFuel, maxAdd)
    );

    return Math.round(optimalAdd * 100) / 100; // Round to 2 decimals
  }

  /**
   * Calculate pit window (earliest and latest lap to pit)
   */
  static calculatePitWindow(
    currentLap: number,
    totalLaps: number,
    currentFuel: number,
    fuelCapacity: number,
    consumptionPerLap: number,
    pitTimeSeconds: number = 25
  ): { earliest: number; latest: number } {
    const remainingLaps = totalLaps - currentLap;
    const fuelConsumptionWithTrack = consumptionPerLap * 1.1; // 10% more during pit stop lap

    // Earliest pit: can pit immediately (lap after current)
    const earliest = Math.min(currentLap + 1, totalLaps - 2); // At least 2 laps from end

    // Latest pit: latest we can pit before running out
    const lapsUntilEmpty = Math.floor(
      currentFuel / fuelConsumptionWithTrack
    );
    const latest = Math.min(
      currentLap + lapsUntilEmpty - 1,
      totalLaps - 1
    );

    return {
      earliest: Math.max(1, earliest),
      latest: Math.max(earliest, latest),
    };
  }

  /**
   * Generate fuel strategy options
   */
  static calculateStrategies(
    raceState: RaceState,
    consumption: FuelConsumptionData,
    pitTimeSeconds: number = 25,
    fuelRefillRatePerSec: number = 1.2 // Liters per second
  ): PitStrategyOption[] {
    const strategies: PitStrategyOption[] = [];
    const { currentLap, totalLaps, currentFuel, fuelCapacity } = raceState;
    const remainingLaps = totalLaps - currentLap;

    // Use average consumption for planning
    const fuelPerLap = consumption.averageConsumption;

    // Check if we can finish without pitting
    if (this.canFinishWithoutPit(currentFuel, remainingLaps, fuelPerLap)) {
      const lapNumber = Math.min(currentLap + 1, totalLaps);
      strategies.push({
        lapNumber,
        fuelToAdd: 0,
        estimatedTimeInPit: 0,
        fuelAtFinish: currentFuel - remainingLaps * fuelPerLap,
        riskLevel: 'low',
        description: 'No pit stop needed - finish with current fuel',
      });
      return strategies;
    }

    // Calculate pit window
    const { earliest, latest } = this.calculatePitWindow(
      currentLap,
      totalLaps,
      currentFuel,
      fuelCapacity,
      fuelPerLap,
      pitTimeSeconds
    );

    // Generate strategies for each possible pit lap
    const pitLaps = [earliest, Math.ceil((earliest + latest) / 2), latest];

    for (const pitLap of pitLaps) {
      if (pitLap < currentLap || pitLap > totalLaps - 1) continue;

      const lapsBeforePit = pitLap - currentLap;
      const fuelAtPit = currentFuel - lapsBeforePit * fuelPerLap;

      if (fuelAtPit < 2) continue; // Not enough to reach pit

      const lapsAfterPit = totalLaps - pitLap;
      const fuelNeeded = lapsAfterPit * fuelPerLap + fuelPerLap * 0.5; // +0.5 safety
      const fuelToAdd = Math.max(
        0,
        Math.min(fuelNeeded - fuelAtPit, fuelCapacity - fuelAtPit)
      );

      const pitTimeWithRefill =
        pitTimeSeconds + fuelToAdd / fuelRefillRatePerSec;
      const fuelAtFinish = fuelAtPit + fuelToAdd - lapsAfterPit * fuelPerLap;

      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (fuelAtFinish < fuelPerLap) riskLevel = 'high';
      else if (fuelAtFinish < fuelPerLap * 2) riskLevel = 'medium';

      strategies.push({
        lapNumber: pitLap,
        fuelToAdd: Math.round(fuelToAdd * 100) / 100,
        estimatedTimeInPit: Math.round(pitTimeWithRefill),
        fuelAtFinish: Math.round(fuelAtFinish * 100) / 100,
        riskLevel,
        description: `Pit at lap ${pitLap}, add ${Math.round(fuelToAdd * 10) / 10}L, finish with ${Math.round(fuelAtFinish * 10) / 10}L`,
      });
    }

    return strategies;
  }

  /**
   * Generate comprehensive fuel prediction
   */
  static generatePrediction(
    raceState: RaceState,
    consumption: FuelConsumptionData
  ): FuelPrediction {
    const remainingLaps = raceState.totalLaps - raceState.currentLap;
    const fuelPerLap = consumption.averageConsumption;

    const lapsUntilEmpty = this.calculateLapsUntilEmpty(
      raceState.currentFuel,
      fuelPerLap
    );

    const { earliest, latest } = this.calculatePitWindow(
      raceState.currentLap,
      raceState.totalLaps,
      raceState.currentFuel,
      raceState.fuelCapacity,
      fuelPerLap
    );

    // Calculate number of recommended pit stops
    const recommendedPits = this.calculateRecommendedPits(
      raceState,
      consumption
    );

    // Calculate strategies
    const strategies = this.calculateStrategies(raceState, consumption);

    // Calculate safety margin
    const fuelNeededToFinish =
      remainingLaps * fuelPerLap + fuelPerLap * 0.5;
    const safetyMargin = Math.max(0, raceState.currentFuel - fuelNeededToFinish);
    const safetyMarginLaps = safetyMargin / fuelPerLap;

    return {
      lapsUntilEmpty,
      fuelPerLap: Math.round(fuelPerLap * 1000) / 1000,
      pitWindowStart: earliest,
      pitWindowEnd: latest,
      recommendedPits,
      strategies,
      safetyMargin: Math.round(safetyMarginLaps * 100) / 100,
    };
  }

  /**
   * Calculate recommended number of pit stops
   */
  private static calculateRecommendedPits(
    raceState: RaceState,
    consumption: FuelConsumptionData
  ): number {
    const fuelNeeded = this.calculateFuelNeeded(
      raceState.totalLaps - raceState.currentLap,
      consumption.averageConsumption
    );

    const fuelPerTank = raceState.fuelCapacity * 0.9; // Use 90% of capacity as effective
    return Math.ceil(fuelNeeded / fuelPerTank);
  }

  /**
   * Analyze consumption trend and predict future consumption
   */
  static predictFutureConsumption(
    consumption: FuelConsumptionData,
    lapsAhead: number = 10
  ): number {
    let predictedConsumption = consumption.averageConsumption;

    if (consumption.consumptionTrend === 'increasing') {
      // Consumption increasing (tire degradation) - estimate 0.1% increase per lap
      predictedConsumption *=
        1 + (lapsAhead * 0.001);
    } else if (consumption.consumptionTrend === 'decreasing') {
      // Consumption decreasing - estimate 0.05% decrease per lap
      predictedConsumption *=
        Math.max(0.95, 1 - lapsAhead * 0.0005);
    }

    return Math.round(predictedConsumption * 1000) / 1000;
  }

  /**
   * Get risk assessment of current fuel situation
   */
  static assessRisk(
    raceState: RaceState,
    consumption: FuelConsumptionData
  ): {
    status: 'safe' | 'warning' | 'critical';
    message: string;
    recommendations: string[];
  } {
    const remainingLaps = raceState.totalLaps - raceState.currentLap;
    const fuelPerLap = consumption.averageConsumption;
    const lapsUntilEmpty = this.calculateLapsUntilEmpty(
      raceState.currentFuel,
      fuelPerLap
    );
    const safetyBuffer = 2; // Laps

    const recommendations: string[] = [];
    let status: 'safe' | 'warning' | 'critical' = 'safe';
    let message = 'Fuel situation is stable';

    if (consumption.consumptionTrend === 'increasing') {
      recommendations.push(
        'Fuel consumption is increasing. consider adjusting driving style.'
      );
    }

    if (lapsUntilEmpty <= remainingLaps + safetyBuffer) {
      status = 'critical';
      message = `Critical: Only ${lapsUntilEmpty} laps of fuel remaining`;
      recommendations.push('PIT IMMEDIATELY - insufficient fuel to finish');
      recommendations.push(
        `Need to add ${Math.ceil((remainingLaps - lapsUntilEmpty + 3) * fuelPerLap)}L at next pit`
      );
    } else if (lapsUntilEmpty <= remainingLaps + safetyBuffer + 3) {
      status = 'warning';
      message = `Warning: Only ${lapsUntilEmpty} laps until empty`;
      recommendations.push('Pit within next 3 laps to refuel');
      recommendations.push('Monitor fuel consumption closely');
    } else {
      recommendations.push('Continue current pace');
      if (consumption.averageConsumption > consumption.maxConsumption * 0.9) {
        recommendations.push(
          'Close to worst-case consumption - watch fuel gauge'
        );
      }
    }

    return { status, message, recommendations };
  }

  /**
   * Calculate pit stop time impact on race position
   */
  static calculatePitImpact(
    pitStopSeconds: number,
    fuelToAdd: number,
    fuelRefillRatePerSec: number = 1.2,
    avgLapTimeSeconds: number = 90
  ): {
    totalPitTime: number; // Including fuel refill
    lapsLost: number; // Equivalent lap time lost
    pitsNeeded: number; // For total race fuel
  } {
    const refillTime = fuelToAdd / fuelRefillRatePerSec;
    const totalPitTime = pitStopSeconds + refillTime;
    const lapsLost = totalPitTime / avgLapTimeSeconds;

    return {
      totalPitTime: Math.round(totalPitTime),
      lapsLost: Math.round(lapsLost * 100) / 100,
      pitsNeeded: 1,
    };
  }
}

export default FuelStrategyCalculator;
