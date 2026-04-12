/**
 * Formatting and Display Utilities
 * 
 * Helper functions for formatting telemetry data and racing-specific
 * information for display in the UI
 */

/**
 * Format time in milliseconds to readable string
 * @param ms Time in milliseconds
 * @returns Formatted time string (MM:SS.mmm)
 */
export const formatTime = (ms: number): string => {
  if (ms < 0) return '--:--.-';

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = Math.floor((ms % 1000) / 10);

  return `${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds
    .toString()
    .padStart(2, '0')}`;
};

/**
 * Format lap deltatime
 * @param ms Delta time in milliseconds
 * @returns Formatted delta string with sign
 */
export const formatDelta = (ms: number): string => {
  const sign = ms > 0 ? '+' : '';
  const absMs = Math.abs(ms);
  const seconds = Math.floor(absMs / 1000);
  const milliseconds = Math.floor((absMs % 1000) / 10);

  return `${sign}${seconds}.${milliseconds.toString().padStart(2, '0')}`;
};

/**
 * Format speed with units
 * @param speed Speed in km/h
 * @param decimalPlaces Number of decimal places
 * @returns Formatted speed string
 */
export const formatSpeed = (speed: number, decimalPlaces: number = 0): string => {
  return `${Math.round(speed * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces)} km/h`;
};

/**
 * Format fuel level with units
 * @param liters Fuel in liters
 * @param decimalPlaces Number of decimal places
 * @returns Formatted fuel string
 */
export const formatFuel = (liters: number, decimalPlaces: number = 1): string => {
  return `${(
    Math.round(liters * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces)
  ).toFixed(decimalPlaces)}L`;
};

/**
 * Format fuel consumption
 * @param consumption Fuel consumption per lap
 * @returns Formatted consumption string
 */
export const formatConsumption = (consumption: number): string => {
  return `${consumption.toFixed(3)}L/lap`;
};

/**
 * Format RPM with optional max RPM
 * @param rpm Current RPM
 * @param maxRpm Maximum RPM
 * @returns Formatted RPM string
 */
export const formatRPM = (rpm: number, maxRpm?: number): string => {
  const rounded = Math.round(rpm);
  if (!maxRpm) return rounded.toLocaleString();
  return `${rounded}/${maxRpm}`;
};

/**
 * Format temperature with units
 * @param celsius Temperature in Celsius
 * @param decimalPlaces Number of decimal places
 * @returns Formatted temperature string
 */
export const formatTemperature = (
  celsius: number,
  decimalPlaces: number = 0
): string => {
  return `${(
    Math.round(celsius * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces)
  ).toFixed(decimalPlaces)}°C`;
};

/**
 * Format tire wear as percentage
 * @param wear Tire wear (0-1)
 * @returns Formatted wear string
 */
export const formatTireWear = (wear: number): string => {
  const percentage = Math.round(wear * 100);
  return `${percentage}%`;
};

/**
 * Format tire pressure
 * @param pressure Pressure in PSI
 * @param decimalPlaces Number of decimal places
 * @returns Formatted pressure string
 */
export const formatPressure = (pressure: number, decimalPlaces: number = 1): string => {
  return `${(
    Math.round(pressure * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces)
  ).toFixed(decimalPlaces)} PSI`;
};

/**
 * Format throttle/brake input as percentage
 * @param value Input value (0-1)
 * @returns Formatted input string
 */
export const formatInput = (value: number): string => {
  return `${Math.round(value * 100)}%`;
};

/**
 * Format lap number
 * @param lap Current lap number
 * @returns Formatted lap string
 */
export const formatLapNumber = (lap: number): string => {
  return `Lap ${lap}`;
};

/**
 * Format session duration
 * @param ms Session duration in milliseconds
 * @returns Formatted duration string
 */
export const formatSessionDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
};

/**
 * Format distance with units
 * @param kilometers Distance in kilometers
 * @param decimalPlaces Number of decimal places
 * @returns Formatted distance string
 */
export const formatDistance = (kilometers: number, decimalPlaces: number = 1): string => {
  if (kilometers >= 1) {
    return `${(
      Math.round(kilometers * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces)
    ).toFixed(decimalPlaces)} km`;
  }
  const meters = kilometers * 1000;
  return `${Math.round(meters)} m`;
};

/**
 * Format G-force
 * @param gForce G-force value
 * @param decimalPlaces Number of decimal places
 * @returns Formatted G-force string
 */
export const formatGForce = (gForce: number, decimalPlaces: number = 2): string => {
  return `${(
    Math.round(gForce * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces)
  ).toFixed(decimalPlaces)}g`;
};

/**
 * Format percentage
 * @param value Value (0-1)
 * @param decimalPlaces Number of decimal places
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, decimalPlaces: number = 1): string => {
  const percentage = value * 100;
  return `${(
    Math.round(percentage * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces)
  ).toFixed(decimalPlaces)}%`;
};

/**
 * Get color for tire temperature
 * @param celsius Temperature in Celsius
 * @returns Color code for temperature
 */
export const getTireTemperatureColor = (
  celsius: number
): 'cold' | 'optimal' | 'warm' | 'hot' => {
  if (celsius < 80) return 'cold';
  if (celsius < 90) return 'optimal';
  if (celsius < 100) return 'warm';
  return 'hot';
};

/**
 * Get color for fuel level
 * @param currentFuel Current fuel in liters
 * @param capacity Tank capacity in liters
 * @returns Color code for fuel level
 */
export const getFuelLevelColor = (
  currentFuel: number,
  capacity: number
): 'safe' | 'warning' | 'critical' => {
  const percentage = currentFuel / capacity;
  if (percentage > 0.3) return 'safe';
  if (percentage > 0.1) return 'warning';
  return 'critical';
};

/**
 * Get color for tire wear
 * @param wear Tire wear (0-1)
 * @returns Color code for wear level
 */
export const getTireWearColor = (wear: number): 'good' | 'fair' | 'poor' => {
  if (wear < 0.5) return 'good';
  if (wear < 0.8) return 'fair';
  return 'poor';
};

/**
 * Format vehicle position
 * @param position Position in race
 * @param totalCars Total number of cars
 * @returns Formatted position string
 */
export const formatPosition = (position: number, totalCars?: number): string => {
  let suffix = 'th';
  if (position % 10 === 1 && position % 100 !== 11) suffix = 'st';
  else if (position % 10 === 2 && position % 100 !== 12) suffix = 'nd';
  else if (position % 10 === 3 && position % 100 !== 13) suffix = 'rd';

  if (totalCars) {
    return `${position}${suffix}/${totalCars}`;
  }
  return `${position}${suffix}`;
};

/**
 * Truncate decimal places
 * @param value Number to truncate
 * @param places Number of decimal places
 * @returns Truncated number
 */
export const truncateDecimals = (value: number, places: number): number => {
  const factor = Math.pow(10, places);
  return Math.floor(value * factor) / factor;
};
