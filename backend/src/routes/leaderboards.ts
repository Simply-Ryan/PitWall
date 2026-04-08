import { Router, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { ValidationError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// GET /api/leaderboards/global - Global leaderboard
router.get('/global', async (req, res, next: NextFunction) => {
  try {
    const { track, simulator, limit = 100 } = req.query;

    if (!track || !simulator) {
      throw new ValidationError('Track and simulator are required');
    }

    const leaderboard = await prisma.leaderboardEntry.findMany({
      where: {
        track: track as string,
        simulator: simulator as string,
      },
      orderBy: { bestLapTime: 'asc' },
      take: parseInt(limit as string),
      include: {
        user: { select: { id: true, username: true } },
      },
    });

    res.json({
      track,
      simulator,
      data: leaderboard.map((entry, index) => ({
        ...entry,
        position: index + 1,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/leaderboards/personal - Personal best laps
router.get('/personal', authMiddleware, async (req: AuthRequest, res, next: NextFunction) => {
  try {
    const bestLaps = await prisma.lap.findMany({
      where: { userId: req.userId },
      distinct: ['session'],
      orderBy: { lapTime: 'asc' },
      include: {
        session: { select: { track: true, simulator: true } },
      },
    });

    // Group by track and simulator
    const grouped = bestLaps.reduce((acc: any, lap) => {
      const key = `${lap.session.track}-${lap.session.simulator}`;
      if (!acc[key] || lap.lapTime < acc[key].lapTime) {
        acc[key] = lap;
      }
      return acc;
    }, {});

    res.json(Object.values(grouped));
  } catch (error) {
    next(error);
  }
});

// GET /api/leaderboards/track/:track - Leaderboard for specific track
router.get('/track/:track', async (req, res, next: NextFunction) => {
  try {
    const { track } = req.params;
    const { simulator = 'all', limit = 50 } = req.query;

    let where: any = {
      session: { track },
    };

    if (simulator !== 'all') {
      where.session.simulator = simulator;
    }

    const laps = await prisma.lap.findMany({
      where,
      orderBy: { lapTime: 'asc' },
      take: parseInt(limit as string),
      include: {
        user: { select: { id: true, username: true } },
        session: { select: { track: true, simulator: true } },
      },
    });

    res.json({
      track,
      simulator: simulator !== 'all' ? simulator : 'all simulators',
      count: laps.length,
      data: laps.map((lap, index) => ({
        position: index + 1,
        lapTime: lap.lapTime,
        driver: lap.user.username,
        simulator: lap.session.simulator,
        sectors: { sector1: lap.sector1, sector2: lap.sector2, sector3: lap.sector3 },
        date: lap.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/leaderboards/update - Update leaderboard entries (admin only)
router.post('/update', authMiddleware, async (req: AuthRequest, res, next: NextFunction) => {
  try {
    // Get all users' best laps grouped by track and simulator
    const bestLaps = await prisma.lap.findMany({
      orderBy: [{ session: { track: 'asc' } }, { lapTime: 'asc' }],
      include: {
        session: { select: { track: true, simulator: true } },
      },
    });

    // Group by user-track-simulator combination
    const grouped = bestLaps.reduce((acc: any, lap) => {
      const key = `${lap.userId}-${lap.session.track}-${lap.session.simulator}`;
      if (!acc[key] || lap.lapTime < acc[key].lapTime) {
        acc[key] = lap;
      }
      return acc;
    }, {});

    // Update or create leaderboard entries
    for (const key in grouped) {
      const lap = grouped[key];
      const [userId, track, simulator] = key.split('-');

      const existing = await prisma.leaderboardEntry.findUnique({
        where: { userId_track_simulator: { userId, track, simulator } },
      });

      if (existing) {
        if (lap.lapTime < existing.bestLapTime) {
          await prisma.leaderboardEntry.update({
            where: { userId_track_simulator: { userId, track, simulator } },
            data: { bestLapTime: lap.lapTime },
          });
        }
      } else {
        await prisma.leaderboardEntry.create({
          data: {
            userId,
            track,
            simulator,
            bestLapTime: lap.lapTime,
            rank: 0,
          },
        });
      }
    }

    logger.info('Leaderboard updated');
    res.json({ message: 'Leaderboard updated successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
