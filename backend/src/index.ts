import { createApp } from './app';
import { PrismaClient } from '@prisma/client';
import { logger } from './utils/logger';

const prisma = new PrismaClient();
const app = createApp();
const port = parseInt(process.env.PORT || '3000', 10);
const host = process.env.HOST || '0.0.0.0';

async function main() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('✅ Database connected');

    // Start server
    app.listen(port, host, () => {
      logger.info(`🚀 Server running at http://${host}:${port}`);
      logger.info(`📚 API Documentation: http://${host}:${port}/api/docs`);
      logger.info(`💪 Health check: http://${host}:${port}/health`);
    });
  } catch (error) {
    logger.error('Fatal error:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

main();
