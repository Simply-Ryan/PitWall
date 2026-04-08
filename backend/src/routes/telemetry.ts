import { Router, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { ValidationError, NotFoundError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// POST /api/telemetry - Add telemetry data to session
router.post('/', authMiddleware, async (req: AuthRequest, res, next: NextFunction) => {
  try {
    const { sessionId, telemetryData } = req.body;

    if (!sessionId || !telemetryData) {
      throw new ValidationError('sessionId and telemetryData are required');
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

    // Bulk insert telemetry data
    const telemetry = await prisma.telemetry.createMany({
      data: telemetryData.map((t: any) => ({
        sessionId,
        timestamp: new Date(t.timestamp),
        speed: t.speed,
        rpm: t.rpm,
        gear: t.gear,
        throttle: t.throttle,
        brake: t.brake,
        clutch: t.clutch,
        steering: t.steering,
        fuel: t.fuel,
        tireTemp1: t.tireTemp1,
        tireTemp2: t.tireTemp2,
        tireTemp3: t.tireTemp3,
        tireTemp4: t.tireTemp4,
        tirePressure1: t.tirePressure1,
        tirePressure2: t.tirePressure2,
        tirePressure3: t.tirePressure3,
        tirePressure4: t.tirePressure4,
        tireWear1: t.tireWear1,
        tireWear2: t.tireWear2,
        tireWear3: t.tireWear3,
        tireWear4: t.tireWear4,
        lateralG: t.lateralG,
        longitudinalG: t.longitudinalG,
        verticalG: t.verticalG,
        airTemp: t.airTemp,
        roadTemp: t.roadTemp,
      })),
    });

    logger.info(`Telemetry data added: ${telemetry.count} records for session ${sessionId}`);

    res.status(201).json({
      message: 'Telemetry data uploaded successfully',
      count: telemetry.count,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/telemetry/:sessionId - Get telemetry data for session
router.get('/:sessionId', authMiddleware, async (req: AuthRequest, res, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const { limit = 1000, offset = 0 } = req.query;

    // Verify session belongs to user
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundError('Session not found');
    }

    if (session.userId !== req.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const telemetry = await prisma.telemetry.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
      skip: parseInt(offset as string),
      take: parseInt(limit as string),
    });

    const total = await prisma.telemetry.count({ where: { sessionId } });

    res.json({
      data: telemetry,
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

// DELETE /api/telemetry/:sessionId - Delete all telemetry for session
router.delete('/:sessionId', authMiddleware, async (req: AuthRequest, res) => {
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

    const deleted = await prisma.telemetry.deleteMany({ where: { sessionId } });
    logger.info(`Telemetry deleted: ${deleted.count} records for session ${sessionId}`);

    res.json({ message: 'Telemetry data deleted successfully', count: deleted.count });
  } catch (error) {
    next(error);
  }
});

export default router;
