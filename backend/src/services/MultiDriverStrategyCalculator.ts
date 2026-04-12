/**
 * Multi-Driver Strategy Calculator
 * 
 * Extends strategy calculation to support:
 * - Driver swaps (endurance racing)
 * - Shared stints across multiple drivers
 * - Driver-specific performance data
 * - Team coordination challenges
 */

import type { StrategyInput, StrategyScenario, PitStop } from '../types/raceStrategy';

export interface DriverProfile {
  id: string;
  name: string;
  skillLevel: 'rookie' | 'intermediate' | 'pro' | 'elite';
  fuelConsumptionMultiplier: number; // 0.8 to 1.2
  tireWearMultiplier: number;
  maxStintLength: number; // laps before mandatory rest
  avgLapTime: number; // baseline in ms
  racingStyle: 'smooth' | 'aggressive' | 'balanced';
}

export interface DriverStintAssignment {
  driverId: string;
  startLap: number;
  endLap: number;
  estimatedConsumption: number;
  estimatedTireWear: number;
}

export interface MultiDriverStrategy {
  drivers: DriverProfile[];
  stints: DriverStintAssignment[];
  estimatedTotalTime: number;
  pitstops: PitStop[];
  riskFactors: string[];
  recommendations: string[];
}

export class MultiDriverStrategyCalculator {
  /**
   * Calculate multi-driver strategy
   */
  calculateMultiDriverStrategy(
    input: StrategyInput,
    drivers: DriverProfile[],
  ): MultiDriverStrategy {
    if (drivers.length < 1) {
      throw new Error('At least one driver required');
    }

    const stints = this.assignDriverStints(input, drivers);
    const pitstops = this.calculatePitstopsForMultiDriver(input, stints);
    const riskFactors = this.analyzeMultiDriverRisks(stints);
    const recommendations = this.generateRecommendations(input, stints, riskFactors);

    // Calculate total time
    const estimatedTotalTime = this.calculateTotalRaceTime(input, stints, drivers);

    return {
      drivers,
      stints,
      estimatedTotalTime,
      pitstops,
      riskFactors,
      recommendations,
    };
  }

  /**
   * Assign driver stints optimally
   */
  private assignDriverStints(
    input: StrategyInput,
    drivers: DriverProfile[],
  ): DriverStintAssignment[] {
    const totalLaps = input.totalLaps;
    const stints: DriverStintAssignment[] = [];

    let currentLap = 1;
    let driverIndex = 0;

    while (currentLap <= totalLaps && drivers.length > 0) {
      const driver = drivers[driverIndex % drivers.length];

      // Determine stint length based on fuel capacity and driver
      const fuelPerLap =
        input.historicalData.averageConsumption * driver.fuelConsumptionMultiplier;
      const maxLapsOnFuel = Math.floor(
        input.vehicleSpecs.maxFuelPerStop / fuelPerLap,
      );
      const safeLaps = Math.max(1, maxLapsOnFuel - 2); // Safety margin
      const stintLength = Math.min(
        safeLaps,
        driver.maxStintLength,
        totalLaps - currentLap + 1,
      );

      const endLap = Math.min(currentLap + stintLength - 1, totalLaps);

      const consumption = fuelPerLap * (endLap - currentLap + 1);
      const wearPercent =
        input.historicalData.tireWearPerLap *
        (endLap - currentLap + 1) *
        driver.tireWearMultiplier;

      stints.push({
        driverId: driver.id,
        startLap: currentLap,
        endLap,
        estimatedConsumption: consumption,
        estimatedTireWear: wearPercent,
      });

      currentLap = endLap + 1;
      driverIndex++;
    }

    return stints;
  }

  /**
   * Calculate pit stops considering multiple drivers
   */
  private calculatePitstopsForMultiDriver(
    input: StrategyInput,
    stints: DriverStintAssignment[],
  ): PitStop[] {
    const pitstops: PitStop[] = [];

    stints.forEach((stint, index) => {
      const nextStint = stints[index + 1];
      if (nextStint) {
        const pitLap = stint.endLap;
        const fuelAmount = input.vehicleSpecs.maxFuelPerStop * 0.95;

        pitstops.push({
          id: `pit-${index + 1}`,
          lapNumber: pitLap,
          fuelAmount,
          tireChange: true,
          tireCompound: input.vehicleSpecs.tireCompound,
          estimatedLossSeconds: input.pitLossTime || 45,
          rationale: `Driver change: ${stint.driverId} → ${nextStint.driverId}`,
          driverSwap: true,
        });
      }
    });

    return pitstops;
  }

  /**
   * Analyze risks specific to multi-driver racing
   */
  private analyzeMultiDriverRisks(stints: DriverStintAssignment[]): string[] {
    const risks: string[] = [];

    // Check for very long stints
    stints.forEach((stint) => {
      const stintLength = stint.endLap - stint.startLap + 1;
      if (stintLength > 50) {
        risks.push(
          `Long stint detected: ${stintLength} laps (driver fatigue risk)`,
        );
      }
    });

    // Check for unbalanced stints
    const stintLengths = stints.map((s) => s.endLap - s.startLap + 1);
    const maxStint = Math.max(...stintLengths);
    const minStint = Math.min(...stintLengths);
    if (maxStint - minStint > 20) {
      risks.push(
        'Unbalanced stints: Consider adjusting driver assignments',
      );
    }

    // Check for high tire wear assignments
    stints.forEach((stint) => {
      if (stint.estimatedTireWear > 85) {
        risks.push(
          `Stint ${stint.driverId}: Tires near failure (${stint.estimatedTireWear.toFixed(1)}%)`,
        );
      }
    });

    return risks;
  }

  /**
   * Generate recommendations for multi-driver strategy
   */
  private generateRecommendations(
    input: StrategyInput,
    stints: DriverStintAssignment[],
    risks: string[],
  ): string[] {
    const recommendations: string[] = [];

    if (risks.length === 0) {
      recommendations.push('✅ Strategy looks balanced and achievable');
    } else {
      recommendations.push(
        '⚠️  Address flagged risks before race start',
      );
    }

    // Check fuel efficiency
    const totalFuel = stints.reduce((sum, s) => sum + s.estimatedConsumption, 0);
    if (totalFuel > 500) {
      recommendations.push('Consider more aggressive pit strategy to reduce fuel stops');
    }

    // Check tire management
    const maxTireWear = Math.max(...stints.map((s) => s.estimatedTireWear));
    if (maxTireWear > 70) {
      recommendations.push('Plan for fresh tires mid-race to prevent performance cliff');
    }

    // Driver-specific
    stints.forEach((stint) => {
      const stintLength = stint.endLap - stint.startLap + 1;
      if (stintLength < 10) {
        recommendations.push(
          `Short stint for driver ${stint.driverId}: Ensure adequate rest between driving periods`,
        );
      }
    });

    return recommendations;
  }

  /**
   * Calculate total estimated race time
   */
  private calculateTotalRaceTime(
    input: StrategyInput,
    stints: DriverStintAssignment[],
    drivers: DriverProfile[],
  ): number {
    let totalTimeSeconds = 0;

    stints.forEach((stint) => {
      const driver = drivers.find((d) => d.id === stint.driverId);
      if (!driver) return;

      // Calculate lap time for this segment
      const lapCount = stint.endLap - stint.startLap + 1;
      const baselapTimeSeconds = driver.avgLapTime / 1000;
      const tireWearPenalty =
        1 + (stint.estimatedTireWear / 100) * 0.1; // +10% per 100% wear
      const adjustedLapTime = baselapTimeSeconds * tireWearPenalty;

      totalTimeSeconds += adjustedLapTime * lapCount;
    });

    // Add pit stop time
    const pitStopCount = stints.length - 1; // Last stint has no pit stop
    totalTimeSeconds += pitStopCount * (input.pitLossTime || 45);

    return totalTimeSeconds;
  }

  /**
   * Get driver performance report
   */
  getDriverPerformanceReport(drivers: DriverProfile[]): {
    [driverId: string]: { skillScore: number; pace: string; efficiency: string };
  } {
    const report: {
      [key: string]: { skillScore: number; pace: string; efficiency: string };
    } = {};

    drivers.forEach((driver) => {
      const skillScores = {
        rookie: 3,
        intermediate: 6,
        pro: 8,
        elite: 10,
      };

      report[driver.id] = {
        skillScore: skillScores[driver.skillLevel],
        pace:
          driver.fuelConsumptionMultiplier < 0.95
            ? 'Fast'
            : driver.fuelConsumptionMultiplier > 1.05
              ? 'Economical'
              : 'Balanced',
        efficiency:
          driver.racingStyle === 'smooth'
            ? 'Tire-friendly'
            : driver.racingStyle === 'aggressive'
              ? 'Pace-focused'
              : 'Versatile',
      };
    });

    return report;
  }

  /**
   * Suggest optimal driver assignments
   */
  suggestDriverAssignments(
    input: StrategyInput,
    drivers: DriverProfile[],
  ): string[] {
    const suggestions: string[] = [];

    // Sort drivers by skill
    const sortedBySkill = [...drivers].sort((a, b) => {
      const skillOrd = { rookie: 0, intermediate: 1, pro: 2, elite: 3 };
      return skillOrd[b.skillLevel] - skillOrd[a.skillLevel];
    });

    suggestions.push(`Start with: ${sortedBySkill[0].name} (Highest skill)`);

    // Check for similar fuel consumption
    const avgConsumption =
      drivers.reduce((sum, d) => sum + d.fuelConsumptionMultiplier, 0) /
      drivers.length;
    drivers.forEach((driver) => {
      if (Math.abs(driver.fuelConsumptionMultiplier - avgConsumption) > 0.15) {
        suggestions.push(
          `${driver.name}: ${driver.fuelConsumptionMultiplier > avgConsumption ? 'Higher' : 'Lower'} fuel consumption - consider placing ${driver.fuelConsumptionMultiplier > avgConsumption ? 'early' : 'late'}`,
        );
      }
    });

    return suggestions;
  }
}
