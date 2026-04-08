import { PrismaClient } from '@prisma/client';

/**
 * Database Connection & Validation Test
 * Verifies that Prisma client can connect to the database and all models are accessible
 */

const prisma = new PrismaClient();

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection and schema...\n');

  try {
    // Test 1: Basic connection
    console.log('Test 1: Database Connection');
    await prisma.$queryRaw`SELECT 1 as result`;
    console.log('✅ Database connection successful\n');

    // Test 2: User model
    console.log('Test 2: User Model');
    const userCount = await prisma.user.count();
    console.log(`✅ User model accessible (${userCount} users exist)\n`);

    // Test 3: Session model
    console.log('Test 3: Session Model');
    const sessionCount = await prisma.session.count();
    console.log(`✅ Session model accessible (${sessionCount} sessions exist)\n`);

    // Test 4: Telemetry model
    console.log('Test 4: Telemetry Model');
    const telemetryCount = await prisma.telemetry.count();
    console.log(`✅ Telemetry model accessible (${telemetryCount} records exist)\n`);

    // Test 5: Lap model
    console.log('Test 5: Lap Model');
    const lapCount = await prisma.lap.count();
    console.log(`✅ Lap model accessible (${lapCount} laps exist)\n`);

    // Test 6: LeaderboardEntry model
    console.log('Test 6: LeaderboardEntry Model');
    const leaderboardCount = await prisma.leaderboardEntry.count();
    console.log(`✅ LeaderboardEntry model accessible (${leaderboardCount} entries exist)\n`);

    // Test 7: SessionStatistics model
    console.log('Test 7: SessionStatistics Model');
    const statsCount = await prisma.sessionStatistics.count();
    console.log(`✅ SessionStatistics model accessible (${statsCount} statistics exist)\n`);

    // Test 8: Relationships
    console.log('Test 8: Model Relationships');

    if (userCount > 0) {
      const userWithSessions = await prisma.user.findFirst({
        include: { sessions: true },
      });

      console.log(
        `✅ User-Session relationship working (user has ${userWithSessions?.sessions.length} sessions)`
      );
    }

    if (sessionCount > 0) {
      const sessionWithTelemetry = await prisma.session.findFirst({
        include: { telemetry: true },
      });

      console.log(
        `✅ Session-Telemetry relationship working (session has ${sessionWithTelemetry?.telemetry.length} telemetry records)`
      );
    }

    console.log('');

    // Summary
    console.log('═════════════════════════════════════════');
    console.log('✅ Database Validation Complete!');
    console.log('═════════════════════════════════════════');
    console.log('\nDatabase Statistics:');
    console.log(`  • Users: ${userCount}`);
    console.log(`  • Sessions: ${sessionCount}`);
    console.log(`  • Telemetry Records: ${telemetryCount}`);
    console.log(`  • Laps: ${lapCount}`);
    console.log(`  • Leaderboard Entries: ${leaderboardCount}`);
    console.log(`  • Session Statistics: ${statsCount}`);
    console.log('');

    if (userCount === 0) {
      console.log('💡 Tip: Run "npm run seed" to populate the database with test data\n');
    }

    return true;
  } catch (error) {
    console.error('❌ Database validation failed:\n');
    console.error(error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run validation
testDatabaseConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
