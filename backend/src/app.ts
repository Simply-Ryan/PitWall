import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from 'dotenv';

config();

import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

// Import routes
import authRoutes from './routes/auth';
import sessionRoutes from './routes/sessions';
import telemetryRoutes from './routes/telemetry';
import lapRoutes from './routes/laps';
import leaderboardRoutes from './routes/leaderboards';
import userRoutes from './routes/users';
import analyticsRoutes from './routes/analytics';
import strategyRoutes from './routes/strategy';

export const createApp = (): Express => {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Logging
  app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

  // Health check
  app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API version
  app.get('/version', (req: Request, res: Response) => {
    res.json({ version: '1.0.0', phase: 'Phase 2 - Backend API' });
  });

  const apiPrefix = process.env.API_PREFIX || '/api';

  // Public routes (no auth required)
  app.use(`${apiPrefix}/auth`, authRoutes);

  // Protected routes (auth required)
  app.use(`${apiPrefix}/users`, authMiddleware, userRoutes);
  app.use(`${apiPrefix}/sessions`, authMiddleware, sessionRoutes);
  app.use(`${apiPrefix}/sessions`, authMiddleware, analyticsRoutes); // Session analytics routes
  app.use(`${apiPrefix}/analytics`, authMiddleware, analyticsRoutes); // Additional analytics endpoints (fuel, etc)
  app.use(`${apiPrefix}/telemetry`, authMiddleware, telemetryRoutes);
  app.use(`${apiPrefix}/laps`, authMiddleware, lapRoutes);
  app.use(`${apiPrefix}/strategy`, authMiddleware, strategyRoutes); // Race strategy endpoints
  app.use(`${apiPrefix}/leaderboards`, leaderboardRoutes); // Public leaderboards

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not Found',
      message: `${req.method} ${req.path} not found`,
      path: req.path,
    });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
};
