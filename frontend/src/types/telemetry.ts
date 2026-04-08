/**
 * Telemetry data types
 * 
 * Defines all types related to real-time telemetry data from racing simulators
 */

/** Tire temperature data with inner/middle/outer zones (in Celsius) */
export interface TireTemperature {
  inner: number;
  middle: number;
  outer: number;
}

/** Tire data including temperature and wear */
export interface TireData {
  temperatureLF: TireTemperature;
  temperatureRF: TireTemperature;
  temperatureLR: TireTemperature;
  temperatureRR: TireTemperature;
  wearLF: number;
  wearRF: number;
  wearLR: number;
  wearRR: number;
  pressureLF: number;
  pressureRF: number;
  pressureLR: number;
  pressureRR: number;
}

/** Vehicle control inputs */
export interface VehicleControls {
  throttle: number; // 0-1
  brake: number; // 0-1
  clutch: number; // 0-1
  steering: number; // -1 to 1 (radians)
}

/** Vehicle performance data */
export interface VehiclePerformance {
  speed: number; // km/h
  rpm: number;
  gear: number;
  maxRPM: number;
}

/** Vehicle data aggregating all vehicle information */
export interface VehicleData extends VehiclePerformance {
  controls: VehicleControls;
  fuel: {
    level: number; // liters
    capacity: number; // liters
    consumed: number; // liters consumed this lap
  };
}

/** Lap telemetry tracking */
export interface LapData {
  currentLap: number;
  lapTime: number; // milliseconds
  lastLapTime: number | null; // milliseconds
  bestLapTime: number | null; // milliseconds
  deltaToLap: number; // milliseconds (positive = slower, negative = faster)
  deltaToSessionBest: number; // milliseconds
  isInLap: boolean;
  isValidLap: boolean;
}

/** Complete telemetry snapshot */
export interface TelemetrySnapshot {
  timestamp: number; // Unix timestamp in ms
  sessionId: string;
  vehicle: VehicleData;
  tires: TireData;
  lap: LapData;
  track?: {
    name: string;
    length: number; // meters
  };
  simulator: SimulatorType;
}

/** Available simulator types */
export type SimulatorType = 'iRacing' | 'ACC' | 'AC' | 'F1-24' | 'F1-25' | 'Unknown';

/** Telemetry connection state */
export interface TelemetryConnection {
  isConnected: boolean;
  lastUpdateTime: number | null;
  connectionType: 'WebSocket' | 'UDP' | 'API' | null;
  latency: number; // milliseconds
}

/** Historical telemetry statistics */
export interface TelemetryStats {
  avgSpeed: number;
  maxSpeed: number;
  avgRPM: number;
  maxRPM: number;
  avgThrottle: number;
  avgBrake: number;
  fuelConsumedAvg: number; // per lap
  tireWearAvg: number;
}
