/**
 * Strategy Monitor Service
 * 
 * Tracks real-time execution of strategy versus plan
 * Detects deviations and triggers recalculation alerts
 */

import type {
  StrategyScenario,
  RiskAssessment,
  TelemetryData,
} from '../types/raceStrategy';

export interface StrategyDeviation {
  type: 'fuel' | 'tire' | 'timing' | 'pace';
  severity: 'low' | 'medium' | 'high' | 'critical';
  expectedValue: number;
  actualValue: number;
  deviation: number; // percentage or absolute
  lapNumber: number;
  timestamp: number;
  message: string;
  recalculationNeeded: boolean;
}

export interface MonitoringSession {
  strategyId: string;
  startLap: number;
  deviations: StrategyDeviation[];
  fuelDeviation: number; // cumulative liters off plan
  tireDeviation: number; // cumulative % off plan
  recalculationCount: number;
  isOnTrack: boolean;
  lastUpdateLap: number;
  riskEscalation: 'stable' | 'elevated' | 'critical';
}

export class StrategyMonitor {
  private session: MonitoringSession | null = null;
  private telemetryHistory: TelemetryData[] = [];
  private maxHistorySize = 100;

  /**
   * Initialize monitoring session
   */
  initializeSession(strategyId: string, startLap: number): MonitoringSession {
    this.session = {
      strategyId,
      startLap,
      deviations: [],
      fuelDeviation: 0,
      tireDeviation: 0,
      recalculationCount: 0,
      isOnTrack: true,
      lastUpdateLap: startLap,
      riskEscalation: 'stable',
    };
    return this.session;
  }

  /**
   * Update with latest telemetry
   */
  updateTelemetry(telemetry: TelemetryData, scenario: StrategyScenario): StrategyDeviation[] {
    if (!this.session) return [];

    // Store history
    this.telemetryHistory.push(telemetry);
    if (this.telemetryHistory.length > this.maxHistorySize) {
      this.telemetryHistory.shift();
    }

    const deviations: StrategyDeviation[] = [];

    // Check fuel deviation
    const fuelDev = this.checkFuelDeviation(telemetry, scenario);
    if (fuelDev) deviations.push(fuelDev);

    // Check tire deviation
    const tireDev = this.checkTireDeviation(telemetry, scenario);
    if (tireDev) deviations.push(tireDev);

    // Check pace deviation
    const paceDev = this.checkPaceDeviation(telemetry, scenario);
    if (paceDev) deviations.push(paceDev);

    // Check pit timing deviation
    const pitDev = this.checkPitTimingDeviation(telemetry, scenario);
    if (pitDev) deviations.push(pitDev);

    // Store deviations
    this.session.deviations.push(...deviations);
    this.session.lastUpdateLap = telemetry.performance.lapNumber;

    // Update risk escalation
    this.updateRiskEscalation(deviations);

    // Check if recalculation needed
    deviations.forEach((dev) => {
      if (dev.recalculationNeeded) {
        this.session!.recalculationCount++;
      }
    });

    return deviations;
  }

  /**
   * Check fuel consumption deviation
   */
  private checkFuelDeviation(
    telemetry: TelemetryData,
    scenario: StrategyScenario,
  ): StrategyDeviation | null {
    if (!this.session) return null;

    const currentLap = telemetry.performance.lapNumber;
    const lapsSinceStart = currentLap - this.session.startLap;

    if (lapsSinceStart === 0) return null;

    // Calculate expected fuel consumption
    const expectedFuelUsed = lapsSinceStart * 2.5; // avg consumption
    const actualFuelUsed =
      (this.session.startLap > 0 ? 100 : telemetry.fuel.level) -
      telemetry.fuel.level;

    const deviation = actualFuelUsed - expectedFuelUsed;
    const deviationPercent = (deviation / expectedFuelUsed) * 100;

    this.session.fuelDeviation = deviation;

    // Trigger warning if >10% over consumption or low fuel
    if (Math.abs(deviationPercent) > 10 || telemetry.fuel.level < 5) {
      const severity =
        telemetry.fuel.level < 3
          ? 'critical'
          : deviationPercent > 15
            ? 'high'
            : 'medium';

      return {
        type: 'fuel',
        severity,
        expectedValue: expectedFuelUsed,
        actualValue: actualFuelUsed,
        deviation,
        lapNumber: currentLap,
        timestamp: telemetry.timestamp,
        message: `Fuel ${actualFuelUsed > expectedFuelUsed ? 'over' : 'under'} consumption by ${Math.abs(deviation).toFixed(1)}L`,
        recalculationNeeded: Math.abs(deviationPercent) > 20,
      };
    }

    return null;
  }

  /**
   * Check tire wear deviation
   */
  private checkTireDeviation(
    telemetry: TelemetryData,
    scenario: StrategyScenario,
  ): StrategyDeviation | null {
    if (!this.session) return null;

    const currentLap = telemetry.performance.lapNumber;
    const lapsSinceStart = currentLap - this.session.startLap;

    if (lapsSinceStart === 0) return null;

    // Expected wear: ~1.5% per lap
    const expectedWear = lapsSinceStart * 1.5;
    const averageActualWear = (
      (telemetry.tires.rearLeft?.wear ?? 0) +
      (telemetry.tires.rearRight?.wear ?? 0) +
      (telemetry.tires.frontLeft?.wear ?? 0) +
      (telemetry.tires.frontRight?.wear ?? 0)
    ) / 4;

    const wearDeviation = averageActualWear - expectedWear;
    const wearDeviationPercent = (wearDeviation / expectedWear) * 100;

    this.session.tireDeviation = wearDeviation;

    // Warn if wearing >20% faster or hitting 80%
    if (wearDeviationPercent > 20 || averageActualWear > 80) {
      const severity =
        averageActualWear > 90
          ? 'critical'
          : wearDeviationPercent > 30
            ? 'high'
            : 'medium';

      return {
        type: 'tire',
        severity,
        expectedValue: expectedWear,
        actualValue: averageActualWear,
        deviation: wearDeviation,
        lapNumber: currentLap,
        timestamp: telemetry.timestamp,
        message: `Tires wearing ${wearDeviationPercent > 0 ? 'faster' : 'slower'} than expected (${averageActualWear.toFixed(0)}%)`,
        recalculationNeeded: wearDeviationPercent > 25,
      };
    }

    return null;
  }

  /**
   * Check pace/lap time deviation
   */
  private checkPaceDeviation(
    telemetry: TelemetryData,
    scenario: StrategyScenario,
  ): StrategyDeviation | null {
    if (!this.session) return null;

    const recentLaps = this.telemetryHistory.slice(-5);
    if (recentLaps.length < 3) return null;

    // Calculate average recent pace
    const recentDeltas = recentLaps.map((t) => t.performance.deltaToLap);
    const avgDelta =
      recentDeltas.reduce((a, b) => a + b, 0) / recentDeltas.length;

    // If consistently 0.5s+ slower, flag it
    if (avgDelta > 0.5) {
      return {
        type: 'pace',
        severity: avgDelta > 1.0 ? 'high' : 'medium',
        expectedValue: 0.0,
        actualValue: avgDelta,
        deviation: avgDelta,
        lapNumber: telemetry.performance.lapNumber,
        timestamp: telemetry.timestamp,
        message: `Running ${avgDelta.toFixed(2)}s slower than target pace`,
        recalculationNeeded: avgDelta > 1.5,
      };
    }

    return null;
  }

  /**
   * Check pit timing deviation
   */
  private checkPitTimingDeviation(
    telemetry: TelemetryData,
    scenario: StrategyScenario,
  ): StrategyDeviation | null {
    if (!this.session) return null;

    // Check if we've passed expected pit lap without pitting
    const nextPlannedPit = scenario.pitSequence[0];
    if (!nextPlannedPit) return null;

    const currentLap = telemetry.performance.lapNumber;
    const lapsSincePlannedPit = currentLap - nextPlannedPit.lapNumber;

    // If 3+ laps past planned pit without executing, flag it
    if (lapsSincePlannedPit > 3 && lapsSincePlannedPit < 10) {
      return {
        type: 'timing',
        severity: lapsSincePlannedPit > 5 ? 'high' : 'medium',
        expectedValue: nextPlannedPit.lapNumber,
        actualValue: currentLap,
        deviation: lapsSincePlannedPit,
        lapNumber: currentLap,
        timestamp: telemetry.timestamp,
        message: `Pit stop ${lapsSincePlannedPit} laps overdue (planned for lap ${nextPlannedPit.lapNumber})`,
        recalculationNeeded: true,
      };
    }

    return null;
  }

  /**
   * Update risk escalation based on deviations
   */
  private updateRiskEscalation(deviations: StrategyDeviation[]): void {
    if (!this.session) return;

    const criticalCount = deviations.filter((d) => d.severity === 'critical').length;
    const highCount = deviations.filter((d) => d.severity === 'high').length;

    if (criticalCount > 0) {
      this.session.riskEscalation = 'critical';
    } else if (highCount > 1 || (highCount > 0 && this.session.fuelDeviation < -3)) {
      this.session.riskEscalation = 'elevated';
    } else {
      this.session.riskEscalation = 'stable';
    }
  }

  /**
   * Get current monitoring session
   */
  getSession(): MonitoringSession | null {
    return this.session;
  }

  /**
   * Get short summary of current deviations
   */
  getSummary() {
    if (!this.session) return null;

    const criticalIssues = this.session.deviations.filter(
      (d) => d.severity === 'critical',
    );
    const recalcNeeded = this.session.deviations.some((d) => d.recalculationNeeded);

    return {
      isOnTrack: this.session.isOnTrack && !recalcNeeded,
      fuelDeviation: this.session.fuelDeviation,
      tireDeviation: this.session.tireDeviation,
      criticalIssueCount: criticalIssues.length,
      deviationCount: this.session.deviations.length,
      riskLevel: this.session.riskEscalation,
      recalculationNeeded,
    };
  }

  /**
   * Get latest deviations (last N)
   */
  getLatestDeviations(count: number = 5): StrategyDeviation[] {
    if (!this.session) return [];
    return this.session.deviations.slice(-count);
  }

  /**
   * Clear session
   */
  clearSession(): void {
    this.session = null;
    this.telemetryHistory = [];
  }
}
