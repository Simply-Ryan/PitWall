import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { ValidationError, NotFoundError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// POST /api/laps - Record lap completion
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const {
      sessionId,
      lapNumber,
      sector1,
      sector2,
      sector3,
      lapTime,
      fuel,
      avgSpeed,
      maxSpeed,
      trackCondition,
      weather,
    } = req.body;

    if (!sessionId || !lapNumber || !lapTime) {
      throw new ValidationError('sessionId, lapNumber, and lapTime are required');
    }

    // Verify session belongs to user
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundError('Session not found');
    }

    if (session.userId !== req.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Check if this is best lap for this track
    const bestLapForTrack = await prisma.lap.findFirst({
      where: {
        userId: req.userId,
        session: { track: session.track },
      },
      orderBy: { lapTime: 'asc' },
      take: 1,
    });

    const isBestLap = !bestLapForTrack || lapTime < bestLapForTrack.lapTime ? 1 : 0;

    const lap = await prisma.lap.create({
      data: {
        sessionId,
        userId: req.userId!,
        lapNumber,
        sector1,
        sector2,
        sector3,
        lapTime,
        bestLapTime: isBestLap,
        fuel,
        avgSpeed,
        maxSpeed,
        trackCondition,
        weather,
      },
    });

    logger.info(`Lap recorded: Session ${sessionId}, Lap ${lapNumber}, Time: ${lapTime}ms`);

    res.status(201).json({
      lap,
      isBestLap: isBestLap === 1,
      message: isBestLap ? 'New personal best lap!' : 'Lap recorded',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/laps - Get user's laps (paginated)
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { sessionId, track, limit = 50, offset = 0 } = req.query;

    const where: any = { userId: req.userId };
    if (sessionId) where.sessionId = sessionId;
    if (track) where.session = { track };

    const laps = await prisma.lap.findMany({
      where,
      orderBy: { lapTime: 'asc' },
      skip: parseInt(offset as string),
      take: parseInt(limit as string),
      include: { session: { select: { track: true, simulator: true } } },
    });

    const total = await prisma.lap.count({ where });

    res.json({
      data: laps,
      pagination: {
        total,
        offset: parseInt(offset as string),
        limit: parseInt(limit as string),
        hasMore: parseInt(offset as string) + parseInt(limit as string) < total,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/laps/session/:sessionId - Get laps for a session
router.get('/session/:sessionId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundError('Session not found');
    }

    if (session.userId !== req.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const laps = await prisma.lap.findMany({
      where: { sessionId },
      orderBy: { lapNumber: 'asc' },
    });

    // Calculate statistics
    const stats = {
      totalLaps: laps.length,
      bestLapTime: Math.min(...laps.map((l) => l.lapTime)),
      avgLapTime: laps.reduce((sum, l) => sum + l.lapTime, 0) / laps.length,
      maxSpeed: Math.max(...laps.map((l) => l.maxSpeed || 0)),
      avgSpeed: laps.reduce((sum, l) => sum + (l.avgSpeed || 0), 0) / laps.length,
    };

    res.json({ laps, stats });
  } catch (error) {
    next(error);
  }
});

export default router;
