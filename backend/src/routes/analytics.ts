import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { ValidationError, NotFoundError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// GET /api/sessions/:id/analytics - Detailed session analytics
router.get('/:id/analytics', authMiddleware, async (req: AuthRequest, res, next: NextFunction) => {
  try {
    const { id } = req.params;

    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        laps: true,
        telemetry: true,
        statistics: true,
      },
    });

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    if (session.userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Calculate analytics
    const laps = session.laps || [];
    const telemetry = session.telemetry || [];

    if (laps.length === 0) {
      throw new ValidationError('No lap data available for analytics');
    }

    const lapTimes = laps.map(l => l.lapTime);
    const bestLap = Math.min(...lapTimes);
    const worstLap = Math.max(...lapTimes);
    const avgLap = lapTimes.reduce((a, b) => a + b, 0) / lapTimes.length;
    const consistency = stddev(lapTimes);

    const speeds = telemetry.map(t => t.speed);
    const maxSpeed = speeds.length ? Math.max(...speeds) : 0;
    const avgSpeed = speeds.length ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;

    const tireTemps = telemetry.flatMap(t => [t.tireTemp1, t.tireTemp2, t.tireTemp3, t.tireTemp4]).filter(t => t);
    const maxTireTemp = tireTemps.length ? Math.max(...tireTemps) : 0;
    const avgTireTemp = tireTemps.length ? tireTemps.reduce((a, b) => a + b, 0) / tireTemps.length : 0;

    // Sector analysis
    const sectorTimes = {
      sector1: laps.map(l => l.sector1).filter(s => s),
      sector2: laps.map(l => l.sector2).filter(s => s),
      sector3: laps.map(l => l.sector3).filter(s => s),
    };

    const sectorAnalysis = {
      sector1: {
        best: Math.min(...sectorTimes.sector1),
        avg: sectorTimes.sector1.reduce((a, b) => a + b, 0) / sectorTimes.sector1.length,
        worst: Math.max(...sectorTimes.sector1),
      },
      sector2: {
        best: Math.min(...sectorTimes.sector2),
        avg: sectorTimes.sector2.reduce((a, b) => a + b, 0) / sectorTimes.sector2.length,
        worst: Math.max(...sectorTimes.sector2),
      },
      sector3: {
        best: Math.min(...sectorTimes.sector3),
        avg: sectorTimes.sector3.reduce((a, b) => a + b, 0) / sectorTimes.sector3.length,
        worst: Math.max(...sectorTimes.sector3),
      },
    };

    res.json({
      session: {
        id: session.id,
        name: session.name,
        track: session.track,
        simulator: session.simulator,
        duration: session.endTime ? (session.endTime.getTime() - session.startTime.getTime()) / 1000 : 0,
      },
      laps: {
        totalLaps: laps.length,
        bestLap,
        worstLap,
        averageLap: avgLap,
        improvement: bestLap - avgLap,
        consistency,
        personalBests: laps.filter(l => l.bestLapTime === 1).length,
      },
      speed: {
        maxSpeed,
        averageSpeed: avgSpeed,
        speedRange: maxSpeed - (speeds.length ? Math.min(...speeds) : 0),
      },
      temperature: {
        maxTireTemp,
        averageTireTemp: avgTireTemp,
        tireTempRange: tireTemps.length ? maxTireTemp - Math.min(...tireTemps) : 0,
      },
      sectors: sectorAnalysis,
      fuel: {
        totalConsumed: laps.reduce((sum, l) => sum + (l.fuel || 0), 0),
        averagePerLap: laps.length > 0 ? laps.reduce((sum, l) => sum + (l.fuel || 0), 0) / laps.length : 0,
      },
      telemetryDataPoints: telemetry.length,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/sessions/:id/lap-comparison - Compare specific laps
router.get('/:id/lap-comparison', authMiddleware, async (req: AuthRequest, res, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { lap1, lap2 } = req.query;

    if (!lap1 || !lap2) {
      throw new ValidationError('lap1 and lap2 query parameters required');
    }

    const session = await prisma.session.findUnique({
      where: { id },
      include: { laps: true },
    });

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    if (session.userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const lapN1 = session.laps?.find(l => l.lapNumber === parseInt(lap1 as string));
    const lapN2 = session.laps?.find(l => l.lapNumber === parseInt(lap2 as string));

    if (!lapN1 || !lapN2) {
      throw new NotFoundError('One or both laps not found');
    }

    res.json({
      comparison: {
        lap1: {
          lapNumber: lapN1.lapNumber,
          lapTime: lapN1.lapTime,
          sector1: lapN1.sector1,
          sector2: lapN1.sector2,
          sector3: lapN1.sector3,
          maxSpeed: lapN1.maxSpeed,
          isPersonalBest: lapN1.bestLapTime === 1,
        },
        lap2: {
          lapNumber: lapN2.lapNumber,
          lapTime: lapN2.lapTime,
          sector1: lapN2.sector1,
          sector2: lapN2.sector2,
          sector3: lapN2.sector3,
          maxSpeed: lapN2.maxSpeed,
          isPersonalBest: lapN2.bestLapTime === 1,
        },
        differences: {
          timeDiff: lapN2.lapTime - lapN1.lapTime,
          sector1Diff: (lapN2.sector1 || 0) - (lapN1.sector1 || 0),
          sector2Diff: (lapN2.sector2 || 0) - (lapN1.sector2 || 0),
          sector3Diff: (lapN2.sector3 || 0) - (lapN1.sector3 || 0),
          speedDiff: (lapN2.maxSpeed || 0) - (lapN1.maxSpeed || 0),
        },
        winner: lapN1.lapTime < lapN2.lapTime ? 'lap1' : 'lap2',
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/sessions/:id/telemetry-export - Export telemetry as CSV
router.get('/:id/telemetry-export', authMiddleware, async (req: AuthRequest, res, next: NextFunction) => {
  try {
    const { id } = req.params;

    const session = await prisma.session.findUnique({
      where: { id },
      include: { telemetry: { orderBy: { timestamp: 'asc' } } },
    });

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    if (session.userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Generate CSV
    const telemetry = session.telemetry || [];
    if (telemetry.length === 0) {
      throw new ValidationError('No telemetry data to export');
    }

    // CSV Headers
    const headers = [
      'Timestamp',
      'Speed',
      'RPM',
      'Gear',
      'Throttle',
      'Brake',
      'Clutch',
      'Steering',
      'Fuel',
      'Tire1_Temp',
      'Tire2_Temp',
      'Tire3_Temp',
      'Tire4_Temp',
      'Tire1_Pressure',
      'Tire2_Pressure',
      'Tire3_Pressure',
      'Tire4_Pressure',
      'Tire1_Wear',
      'Tire2_Wear',
      'Tire3_Wear',
      'Tire4_Wear',
      'Lateral_G',
      'Longitudinal_G',
      'Vertical_G',
      'Air_Temp',
      'Road_Temp',
    ];

    const rows = telemetry.map(t => [
      t.timestamp.toISOString(),
      (t.speed || 0).toFixed(2),
      (t.rpm || 0).toFixed(0),
      t.gear || 0,
      (t.throttle || 0).toFixed(2),
      (t.brake || 0).toFixed(2),
      (t.clutch || 0).toFixed(2),
      (t.steering || 0).toFixed(2),
      (t.fuel || 0).toFixed(1),
      (t.tireTemp1 || 0).toFixed(1),
      (t.tireTemp2 || 0).toFixed(1),
      (t.tireTemp3 || 0).toFixed(1),
      (t.tireTemp4 || 0).toFixed(1),
      (t.tirePressure1 || 0).toFixed(1),
      (t.tirePressure2 || 0).toFixed(1),
      (t.tirePressure3 || 0).toFixed(1),
      (t.tirePressure4 || 0).toFixed(1),
      (t.tireWear1 || 0).toFixed(1),
      (t.tireWear2 || 0).toFixed(1),
      (t.tireWear3 || 0).toFixed(1),
      (t.tireWear4 || 0).toFixed(1),
      (t.lateralG || 0).toFixed(2),
      (t.longitudinalG || 0).toFixed(2),
      (t.verticalG || 0).toFixed(2),
      (t.airTemp || 0).toFixed(1),
      (t.roadTemp || 0).toFixed(1),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="telemetry-${session.id}-${Date.now()}.csv"`
    );
    res.send(csv);

    logger.info(`Telemetry exported for session ${id}`);
  } catch (error) {
    next(error);
  }
});

// GET /api/sessions/:id/weather-history - Weather conditions during session
router.get('/:id/weather-history', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const session = await prisma.session.findUnique({
      where: { id },
      include: { telemetry: { orderBy: { time: 'asc' } } },
    });

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    if (session.userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const telemetry = session.telemetry || [];

    // Group by temperature ranges (simple weather proxy)
    const tempGroups: { [key: string]: any[] } = {};
    telemetry.forEach(t => {
      const tempRange = t.roadTemp >= 20 ? 'Warm' : t.roadTemp >= 10 ? 'Mild' : 'Cold';
      if (!tempGroups[tempRange]) {
        tempGroups[tempRange] = [];
      }
      tempGroups[tempRange].push(t);
    });

    const weatherHistory = Object.entries(tempGroups).map(([condition, data]) => {
      const avgTemp = data.reduce((sum, t) => sum + (t.roadTemp || 0), 0) / data.length;
      const avgSpeed = data.reduce((sum, t) => sum + (t.speed || 0), 0) / data.length;

      return {
        condition,
        duration: data.length, // Approximate time in data points
        averageRoadTemp: avgTemp.toFixed(1),
        averageSpeed: avgSpeed.toFixed(1),
        startTime: data[0].timestamp,
        endTime: data[data.length - 1].timestamp,
      };
    });

    res.json({
      session: {
        id: session.id,
        name: session.name,
        track: session.track,
      },
      weatherHistory: weatherHistory.sort((a, b) => a.startTime.getTime() - b.startTime.getTime()),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/sessions/driver-trends - Historical performance trends
router.get('/trends/driver-performance', authMiddleware, async (req: AuthRequest, res, next: NextFunction) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { userId: req.userId },
      include: {
        laps: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { startTime: 'asc' },
    });

    const trends = sessions.map(session => {
      const laps = session.laps || [];
      if (laps.length === 0) {
        return null;
      }

      const lapTimes = laps.map(l => l.lapTime);
      return {
        date: session.startTime,
        track: session.track,
        simulator: session.simulator,
        bestLap: Math.min(...lapTimes),
        avgLap: lapTimes.reduce((a, b) => a + b, 0) / lapTimes.length,
        totalLaps: laps.length,
        improvement: Math.min(...lapTimes) - lapTimes[lapTimes.length - 1],
        personalBests: laps.filter(l => l.bestLapTime === 1).length,
      };
    });

    res.json({
      userId: req.userId,
      trends: trends.filter(t => t !== null),
    });
  } catch (error) {
    next(error);
  }
});

// Helper function: calculate standard deviation
function stddev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

export default router;
