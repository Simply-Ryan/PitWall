/**
 * Weather Impact Calculator
 * 
 * Calculates multipliers for fuel consumption, tire wear, and lap times
 * based on weather conditions and track temperature
 */

export class WeatherImpactCalculator {
  /**
   * Get fuel consumption multiplier based on weather
   */
  getFuelMultiplier(condition: string): number {
    switch (condition) {
      case 'clear':
        return 1.0; // baseline
      case 'light_rain':
        return 1.12; // +12% consumption in light rain
      case 'heavy_rain':
        return 1.20; // +20% consumption in heavy rain
      case 'fog':
        return 1.05; // +5% in fog (slightly worse visibility/grip)
      default:
        return 1.0;
    }
  }

  /**
   * Get tire wear multiplier based on weather
   * Wet conditions: less tire wear (more slip, less grip)
   * Dry conditions: more wear (more grip)
   */
  getTireWearMultiplier(condition: string): number {
    switch (condition) {
      case 'clear':
        return 1.0; // baseline
      case 'light_rain':
        return 0.75; // -25% wear (less grip)
      case 'heavy_rain':
        return 0.65; // -35% wear (much less grip)
      case 'fog':
        return 1.0; // no change
      default:
        return 1.0;
    }
  }

  /**
   * Get lap time multiplier based on weather
   * Wet/rain: slower lap times
   */
  getLapTimeMultiplier(condition: string): number {
    switch (condition) {
      case 'clear':
        return 1.0; // baseline
      case 'light_rain':
        return 1.08; // +8% lap time
      case 'heavy_rain':
        return 1.20; // +20% lap time
      case 'fog':
        return 1.02; // +2% lap time
      default:
        return 1.0;
    }
  }

  /**
   * Get temperature-based fuel multiplier
   * Hot days: more fuel consumption (air density, cooling)
   * Cold days: less fuel consumption
   */
  getTemperatureMultiplier(trackTempCelsius: number): number {
    const baselineTemp = 25; // degrees Celsius

    if (trackTempCelsius < 10) return 0.95; // cold, less consumption
    if (trackTempCelsius < 20) return 0.97;
    if (trackTempCelsius <= 30) return 1.0; // normal
    if (trackTempCelsius < 40) return 1.05;
    if (trackTempCelsius >= 40) return 1.10; // hot, more consumption

    return 1.0;
  }

  /**
   * Check if weather conditions are expected to change
   */
  shouldRecalculate(
    currentWeather: string,
    expectedChange: string | undefined,
  ): boolean {
    // Recalculate if wet→dry or dry→wet transition expected
    return (
      expectedChange === 'improving' || expectedChange === 'worsening'
    );
  }

  /**
   * Get weather severity (0-100)
   */
  getWeatherSeverity(condition: string): number {
    switch (condition) {
      case 'clear':
        return 0;
      case 'fog':
        return 10;
      case 'light_rain':
        return 40;
      case 'heavy_rain':
        return 80;
      default:
        return 0;
    }
  }

  /**
   * Recommend tire compound based on weather
   */
  getRecommendedCompound(condition: string): string {
    switch (condition) {
      case 'clear':
        return 'soft'; // soft for grip in dry
      case 'light_rain':
        return 'intermediate'; // intermediate in light rain
      case 'heavy_rain':
        return 'wet'; // wet tires required
      case 'fog':
        return 'medium'; // medium for balance
      default:
        return 'medium';
    }
  }

  /**
   * Calculate combined environmental impact (0-100)
   * Higher = more challenging conditions
   */
  getEnvironmentalChallenge(
    condition: string,
    trackTemp: number,
    ambientTemp: number,
  ): number {
    let challenge = this.getWeatherSeverity(condition);

    // Temperature extremes add challenge
    if (trackTemp > 50 || trackTemp < 5) challenge += 15;
    if (ambientTemp > 35 || ambientTemp < 0) challenge += 10;

    return Math.min(100, challenge);
  }
}
