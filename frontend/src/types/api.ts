/**
 * API communication types
 */

/** Generic API response wrapper */
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: number;
}

/** Session API response */
export interface SessionData {
  id: string;
  name: string;
  game: string;
  track: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  telemetryPointsCount: number;
}

/** User profile API response */
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  createdAt: number;
  preferences: {
    voiceNotificationsEnabled: boolean;
    telemetryStorageEnabled: boolean;
    analyticsEnabled: boolean;
  };
}

/** Leaderboard entry */
export interface LeaderboardEntry {
  position: number;
  userId: string;
  username: string;
  track: string;
  simulator: string;
  lapTime: number;
  date: number;
}

/** Analytics data */
export interface AnalyticsData {
  totalSessions: number;
  totalDrivingTime: number;
  averageLapTime: number;
  bestLapTime: number;
  improvementTrend: number; // percentage
  favoriteTrack: string;
  favoriteSimulator: string;
}
