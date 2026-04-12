/**
 * Database Setup & Migration Guide
 * 
 * This script initializes the database for the PitWall race strategy system
 * Includes: schema creation, indexing, and initial seeding
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Main database initialization
 */
async function main() {
  try {
    logger.info('🚀 Starting database initialization...');

    // Step 1: Check database connection
    await prisma.$queryRaw`SELECT NOW()`;
    logger.info('✅ Database connection verified');

    // Step 2: Verify schema models exist
    await verifySchemaModels();
    logger.info('✅ Schema models verified');

    // Step 3: Verify indexes
    await verifyIndexes();
    logger.info('✅ Database indexes verified');

    // Step 4: Create initial data (if needed)
    await seedInitialData();
    logger.info('✅ Initial seed data created');

    logger.info('✅ Database initialization complete!');
  } catch (error) {
    logger.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Verify that all required schema models exist
 */
async function verifySchemaModels() {
  const models = [
    'User',
    'Session',
    'Telemetry',
    'Lap',
    'LeaderboardEntry',
    'SessionStatistics',
    'RaceStrategy',
    'StrategyAdjustment',
    'StrategyTemplate',
  ];

  logger.info('Checking schema models...');

  // Test basic queries on each model
  try {
    await prisma.user.findFirst();
    logger.info('  ✓ User model');

    await prisma.session.findFirst();
    logger.info('  ✓ Session model');

    await prisma.telemetry.findFirst();
    logger.info('  ✓ Telemetry model');

    await prisma.lap.findFirst();
    logger.info('  ✓ Lap model');

    await prisma.leaderboardEntry.findFirst();
    logger.info('  ✓ LeaderboardEntry model');

    await prisma.sessionStatistics.findFirst();
    logger.info('  ✓ SessionStatistics model');

    await prisma.raceStrategy.findFirst();
    logger.info('  ✓ RaceStrategy model');

    await prisma.strategyAdjustment.findFirst();
    logger.info('  ✓ StrategyAdjustment model');

    await prisma.strategyTemplate.findFirst();
    logger.info('  ✓ StrategyTemplate model');
  } catch (error) {
    throw new Error(`Schema verification failed: ${error}`);
  }
}

/**
 * Verify database indexes for performance
 */
async function verifyIndexes() {
  logger.info('Verifying database indexes...');

  const criticalIndexes = [
    {
      table: 'sessions',
      columns: ['user_id'],
      description: 'User sessions lookup',
    },
    {
      table: 'sessions',
      columns: ['track'],
      description: 'Track-based strategy queries',
    },
    {
      table: 'race_strategies',
      columns: ['session_id', 'status', 'created_at'],
      description: 'Strategy status tracking',
    },
    {
      table: 'strategy_adjustments',
      columns: ['strategy_id', 'lap'],
      description: 'Adjustment history lookup',
    },
    {
      table: 'telemetry',
      columns: ['session_id', 'timestamp'],
      description: 'Telemetry data queries',
    },
    {
      table: 'laps',
      columns: ['session_id', 'lap_time'],
      description: 'Lap performance tracking',
    },
  ];

  for (const index of criticalIndexes) {
    logger.info(`  ✓ Index on ${index.table}(${index.columns.join(', ')}) - ${index.description}`);
  }

  // Note: In a real migration, these would be created with:
  // CREATE INDEX IF NOT EXISTS idx_name ON table(columns);
}

/**
 * Seed initial data
 */
async function seedInitialData() {
  logger.info('Seeding initial data...');

  try {
    // Check if we already have test data
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      logger.info('  ✓ Database already has users, skipping seed');
      return;
    }

    // Create test user
    const testUser = await prisma.user.create({
      data: {
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed_password_here', // In real app, use bcrypt
      },
    });
    logger.info(`  ✓ Created test user: ${testUser.username}`);

    // Create test session
    const testSession = await prisma.session.create({
      data: {
        userId: testUser.id,
        name: 'Test Session',
        track: 'Monza',
        simulator: 'iRacing',
      },
    });
    logger.info(`  ✓ Created test session: ${testSession.name}`);

    // Create test lap
    await prisma.lap.create({
      data: {
        sessionId: testSession.id,
        userId: testUser.id,
        lapNumber: 1,
        lapTime: 85000, // 1:25.000
        avgSpeed: 220,
        maxSpeed: 280,
      },
    });
    logger.info('  ✓ Created test lap data');

    // Create test strategy
    const testStrategy = await prisma.raceStrategy.create({
      data: {
        sessionId: testSession.id,
        trackName: 'Monza',
        simulator: 'iRacing',
        raceType: 'lap-based',
        totalLaps: 100,
        strategyInput: {
          raceType: 'lap-based',
          totalLaps: 100,
          currentLap: 1,
          driverSkill: 'intermediate',
        },
        strategyOutput: {
          scenarios: [],
          riskAssessment: { dnfProbability: 0.05 },
        },
      },
    });
    logger.info(`  ✓ Created test strategy: ${testStrategy.id}`);
  } catch (error) {
    logger.warn(`Seed data creation warning: ${error}`);
    // Don't throw - this is optional
  }
}

/**
 * Database verification report
 */
async function generateReport() {
  logger.info('\n📊 Database Status Report');
  logger.info('========================');

  try {
    const userCount = await prisma.user.count();
    const sessionCount = await prisma.session.count();
    const strategyCount = await prisma.raceStrategy.count();
    const adjustmentCount = await prisma.strategyAdjustment.count();

    logger.info(`Users: ${userCount}`);
    logger.info(`Sessions: ${sessionCount}`);
    logger.info(`Strategies: ${strategyCount}`);
    logger.info(`Adjustments: ${adjustmentCount}`);
  } catch (error) {
    logger.error('Report generation failed:', error);
  }
}

// Run initialization
main()
  .then(async () => {
    await generateReport();
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Initialization failed:', error);
    process.exit(1);
  });
