import { Router, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { ValidationError, NotFoundError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// GET /api/sessions - Get all sessions for user
router.get('/', authMiddleware, async (req: AuthRequest, res, next: NextFunction) => {
  try {
    const { track, simulator } = req.query;

    const where: any = { userId: req.userId };
    if (track) where.track = track;
    if (simulator) where.simulator = simulator;

    const sessions = await prisma.session.findMany({
      where,
      orderBy: { startTime: 'desc' },
      include: {
        laps: {
          select: { lapNumber: true, lapTime: true, bestLapTime: true },
          orderBy: { lapNumber: 'asc' },
        },
      },
    });

    res.json(sessions);
  } catch (error) {
    next(error);
  }
});

// POST /api/sessions - Create new session
router.post('/', authMiddleware, async (req: AuthRequest, res, next: NextFunction) => {
  try {
    const { name, track, simulator } = req.body;

    if (!name || !track || !simulator) {
      throw new ValidationError('Name, track, and simulator are required');
    }

    const session = await prisma.session.create({
      data: {
        userId: req.userId!,
        name,
        track,
        simulator,
      },
    });

    logger.info(`Session created: ${session.id} (${track})`);

    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

// GET /api/sessions/:id - Get session details
router.get('/:id', authMiddleware, async (req: AuthRequest, res, next: NextFunction) => {
  try {
    const { id } = req.params;

    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        laps: true,
      },
    });

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    if (session.userId !== req.userId) {
      res.status(403).json({ error: 'Forbidden', message: 'You do not have permission to access this session' });
      return;
    }

    res.json(session);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/sessions/:id - Update session
router.patch('/:id', authMiddleware, async (req: AuthRequest, res, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, endTime } = req.body;

    const session = await prisma.session.findUnique({ where: { id } });
    if (!session) {
      throw new NotFoundError('Session not found');
    }

    if (session.userId !== req.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const updated = await prisma.session.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(endTime && { endTime: new Date(endTime) }),
      },
    });

    logger.info(`Session updated: ${id}`);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/sessions/:id - Delete session
router.delete('/:id', authMiddleware, async (req: AuthRequest, res, next: NextFunction) => {
  try {
    const { id } = req.params;

    const session = await prisma.session.findUnique({ where: { id } });
    if (!session) {
      throw new NotFoundError('Session not found');
    }

    if (session.userId !== req.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    await prisma.session.delete({ where: { id } });
    logger.info(`Session deleted: ${id}`);

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
