/**
 * Tire Degradation Model
 * 
 * Physics-based model for predicting tire wear based on
 * temperature, fuel load, track characteristics, and lap time
 */

export class TireDegradationModel {
  /**
   * Predict pit lap based on tire degradation
   * Returns: lap number when tire reaches critical wear
   */
  predictPitTiming(
    currentLap: number,
    currentWearPercent: number,
    wearPerLapPercent: number,
    raceLength: number,
  ): number {
    const criticalWear = 90; // percent, where grip is significantly reduced
    const wearRemaining = criticalWear - currentWearPercent;

    if (wearRemaining <= 0) {
      return currentLap + 1; // pit immediately
    }

    const lapsUntilCritical = Math.floor(wearRemaining / wearPerLapPercent);
    const pitLap = currentLap + lapsUntilCritical;

    // Ensure pit is within race
    return Math.min(pitLap, raceLength - 2);
  }

  /**
   * Calculate tire wear degradation factor based on temperature
   * Optimal temp is ~85°C; performance falls off at extremes
   */
  getTemperatureFactor(tempCelsius: number): number {
    const optimalTemp = 85;

    if (tempCelsius < 40) return 2.0; // very cold, high wear
    if (tempCelsius < 60) return 1.5; // cold, increased wear
    if (tempCelsius < 80) return 1.1; // slightly cool
    if (tempCelsius <= 95) return 1.0; // optimal range
    if (tempCelsius < 110) return 1.15; // slightly hot
    return 1.3; // very hot, accelerated wear
  }

  /**
   * Calculate tire wear degradation factor based on fuel load
   * More fuel = heavier = more tire wear
   */
  getFuelLoadFactor(fuelPercent: number): number {
    // At 100% fuel, factor = 1.0
    // At 0% fuel, factor = 0.85 (less weight)
    return 0.85 + fuelPercent * 0.0015;
  }

  /**
   * Calculate base tire wear rate based on compound
   * Soft tires wear faster but provide more grip/speed
   */
  getCompoundWearRate(compound: string): number {
    switch (compound) {
      case 'soft':
        return 1.2; // wears fast
      case 'medium':
        return 1.0; // baseline
      case 'hard':
        return 0.75; // wears slow
      case 'intermediate':
        return 0.9;
      case 'wet':
        return 1.1;
      default:
        return 1.0;
    }
  }

  /**
   * Predict tire wear at future lap
   * Accounts for all degradation factors
   */
  predictWearAt(
    currentLap: number,
    currentWearPercent: number,
    compound: string,
    avgTireTemp: number,
    fuelPercent: number,
    targetLap: number,
  ): number {
    const baseWearPerLap = 0.8; // percent per lap baseline
    const tempFactor = this.getTemperatureFactor(avgTireTemp);
    const fuelFactor = this.getFuelLoadFactor(fuelPercent);
    const compoundFactor = this.getCompoundWearRate(compound);

    const wearPerLap =
      baseWearPerLap * tempFactor * fuelFactor * compoundFactor;

    const lapsRemaining = targetLap - currentLap;
    const predictedWearThisStint = wearPerLap * lapsRemaining;

    return currentWearPercent + predictedWearThisStint;
  }

  /**
   * Check if tires are at "cliff" - where performance drops significantly
   */
  isAtCliff(wearPercent: number): boolean {
    return wearPercent > 85; // Grip loss becomes severe >85%
  }

  /**
   * Estimate laps remaining before cliff
   */
  lapsBeforeCliff(
    currentWearPercent: number,
    wearPerLap: number,
  ): number {
    const cliffThreshold = 85;
    const wearRemaining = cliffThreshold - currentWearPercent;

    if (wearRemaining <= 0) return 0;

    return Math.floor(wearRemaining / wearPerLap);
  }

  /**
   * Calculate performance loss due to tire wear
   * Returns lap time multiplier (e.g., 1.05 = 5% slower)
   */
  getPerformancePenalty(wearPercent: number): number {
    if (wearPercent < 30) return 1.0; // no penalty
    if (wearPercent < 50) return 1.01; // 1% slower
    if (wearPercent < 70) return 1.02; // 2% slower
    if (wearPercent < 85) return 1.04; // 4% slower
    return 1.08; // 8% slower near cliff

    // Very worn tires
    if (wearPercent > 95) return 1.15; // 15% slower, risky
  }
}
