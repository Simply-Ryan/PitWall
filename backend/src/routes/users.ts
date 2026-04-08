import { Router, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { ValidationError, NotFoundError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// GET /api/users/profile - Get current user profile
router.get('/profile', authMiddleware, async (req: AuthRequest, res, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/users/profile - Update user profile
router.patch('/profile', authMiddleware, async (req: AuthRequest, res, next: NextFunction) => {
  try {
    const { username } = req.body;

    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      throw new ValidationError('Valid username is required');
    }

    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: { username: username.trim() },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info(`User ${req.userId} profile updated`);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// GET /api/users/stats - Get user statistics
router.get('/stats', authMiddleware, async (req: AuthRequest, res, next: NextFunction) => {
  try {
    // Total sessions
    const sessions = await prisma.session.findMany({
      where: { userId: req.userId },
    });

    // Total laps
    const laps = await prisma.lap.findMany({
      where: { userId: req.userId },
    });

    // Best lap time overall
    const bestLap = laps.length > 0 ? Math.min(...laps.map(l => l.lapTime)) : null;

    // Average lap time
    const avgLapTime = laps.length > 0 ? laps.reduce((sum, l) => sum + l.lapTime, 0) / laps.length : null;

    // Sessions by simulator
    const sessionsBySimulator = sessions.reduce((acc, session) => {
      acc[session.simulator] = (acc[session.simulator] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Tracks driven
    const tracksDriven = new Set(sessions.map(s => s.track)).size;

    // Max speed across all telemetry
    const maxSpeedData = await prisma.telemetry.aggregate({
      _max: { speed: true },
      where: { session: { userId: req.userId } },
    });

    res.json({
      totalSessions: sessions.length,
      totalLaps: laps.length,
      bestLapTime: bestLap,
      averageLapTime: avgLapTime,
      tracksDriven,
      sessionsBySimulator,
      maxSpeed: maxSpeedData._max.speed,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/leaderboard-position - Get user's positions on leaderboards
router.get('/leaderboard-position', authMiddleware, async (req: AuthRequest, res, next: NextFunction) => {
  try {
    const leaderboards = await prisma.leaderboardEntry.findMany({
      where: { userId: req.userId },
      include: { user: { select: { username: true } } },
    });

    // Get rank for each position
    const withRanks = await Promise.all(
      leaderboards.map(async (entry) => {
        const usersAhead = await prisma.leaderboardEntry.count({
          where: {
            track: entry.track,
            simulator: entry.simulator,
            bestLapTime: { lt: entry.bestLapTime },
          },
        });

        return {
          ...entry,
          rank: usersAhead + 1,
        };
      })
    );

    res.json(withRanks);
  } catch (error) {
    next(error);
  }
});

export default router;
