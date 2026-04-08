import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with test data...');

  // Clear existing data (in reverse dependency order)
  await prisma.leaderboardEntry.deleteMany({});
  await prisma.sessionStatistics.deleteMany({});
  await prisma.lap.deleteMany({});
  await prisma.telemetry.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('✓ Cleared existing data');

  // Create test users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        username: 'racer1',
        email: 'racer1@example.com',
        password: await bcrypt.hash('Password123!', 10),
      },
    }),
    prisma.user.create({
      data: {
        username: 'racer2',
        email: 'racer2@example.com',
        password: await bcrypt.hash('Password456!', 10),
      },
    }),
    prisma.user.create({
      data: {
        username: 'racer3',
        email: 'racer3@example.com',
        password: await bcrypt.hash('Password789!', 10),
      },
    }),
  ]);

  console.log(`✓ Created ${users.length} test users`);

  // Define test tracks and simulators
  const tracks = ['Silverstone', 'Monza', 'Monaco', 'Spa-Francorchamps'];
  const simulators = ['iRacing', 'ACC', 'Assetto Corsa', 'F1-24', 'F1-25'];

  // Create sessions
  const sessions = [];
  for (const user of users) {
    for (let i = 0; i < 3; i++) {
      const track = tracks[Math.floor(Math.random() * tracks.length)];
      const simulator = simulators[Math.floor(Math.random() * simulators.length)];

      const session = await prisma.session.create({
        data: {
          userId: user.id,
          name: `Test Session ${i + 1} - ${track}`,
          track,
          simulator,
          startTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          endTime: new Date(Date.now() - Math.random() * 6 * 24 * 60 * 60 * 1000),
        },
      });

      sessions.push({ session, user });
    }
  }

  console.log(`✓ Created ${sessions.length} test sessions`);

  // Create telemetry data for each session
  let telemetryCount = 0;
  for (const { session } of sessions) {
    const telemetryDataArray = [];

    // Generate 100 telemetry points per session
    for (let i = 0; i < 100; i++) {
      telemetryDataArray.push({
        sessionId: session.id,
        timestamp: new Date(session.startTime.getTime() + i * 60000),
        speed: Math.random() * 300,
        rpm: Math.floor(Math.random() * 9000),
        gear: Math.floor(Math.random() * 8),
        throttle: Math.random(),
        brake: Math.random(),
        clutch: Math.random(),
        steering: (Math.random() - 0.5) * 2,
        fuel: Math.random() * 100,
        tireTemp1: 60 + Math.random() * 40,
        tireTemp2: 60 + Math.random() * 40,
        tireTemp3: 60 + Math.random() * 40,
        tireTemp4: 60 + Math.random() * 40,
        tirePressure1: 25 + Math.random() * 5,
        tirePressure2: 25 + Math.random() * 5,
        tirePressure3: 26 + Math.random() * 5,
        tirePressure4: 26 + Math.random() * 5,
        tireWear1: Math.random(),
        tireWear2: Math.random(),
        tireWear3: Math.random(),
        tireWear4: Math.random(),
        lateralG: (Math.random() - 0.5) * 2,
        longitudinalG: (Math.random() - 0.5) * 2,
        verticalG: 0.9 + Math.random() * 0.2,
        airTemp: 20 + Math.random() * 20,
        roadTemp: 20 + Math.random() * 30,
      });
    }

    await prisma.telemetry.createMany({
      data: telemetryDataArray,
    });

    telemetryCount += telemetryDataArray.length;
  }

  console.log(`✓ Created ${telemetryCount} telemetry data points`);

  // Create laps
  let lapCount = 0;
  for (const { session, user } of sessions) {
    for (let lapNum = 1; lapNum <= 5; lapNum++) {
      const lapTime = 90000 + Math.random() * 10000; // milliseconds

      const isBestLap = lapNum === 1 || Math.random() > 0.7 ? 1 : 0;

      const lap = await prisma.lap.create({
        data: {
          userId: user.id,
          sessionId: session.id,
          lapNumber: lapNum,
          lapTime,
          sector1: lapTime * 0.33 + (Math.random() - 0.5) * 1000,
          sector2: lapTime * 0.33 + (Math.random() - 0.5) * 1000,
          sector3: lapTime * 0.34 + (Math.random() - 0.5) * 1000,
          maxSpeed: 280 + Math.random() * 20,
          avgSpeed: 200 + Math.random() * 30,
          fuel: 2 + Math.random() * 2,
          weather: session.name.includes('Spa') ? 'rain' : 'clear',
          trackCondition: 'dry',
          bestLapTime: isBestLap,
        },
      });

      lapCount++;

      // Create leaderboard entry if personal best
      if (isBestLap === 1) {
        await prisma.leaderboardEntry.upsert({
          where: {
            userId_track_simulator: {
              userId: user.id,
              track: session.track,
              simulator: session.simulator,
            },
          },
          update: {
            bestLapTime: Math.min(lap.lapTime, Math.random() * 150000),
          },
          create: {
            userId: user.id,
            track: session.track,
            simulator: session.simulator,
            bestLapTime: lap.lapTime,
            rank: 0,
          },
        });
      }
    }
  }

  console.log(`✓ Created ${lapCount} test laps`);

  // Create session statistics
  let statsCount = 0;
  for (const { session } of sessions) {
    const laps = await prisma.lap.findMany({ where: { sessionId: session.id } });

    if (laps.length > 0) {
      const lapTimes = laps.map(l => l.lapTime);
      const bestLap = Math.min(...lapTimes);
      const speeds = laps.map(l => l.maxSpeed || 0).filter(s => s > 0);
      const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;
      const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;

      await prisma.sessionStatistics.create({
        data: {
          sessionId: session.id,
          totalLaps: laps.length,
          bestLapTime: bestLap,
          maxSpeed,
          avgSpeed,
          totalFuelUsed: laps.reduce((sum, l) => sum + (l.fuel || 0), 0),
          avgTireTemp: 60 + Math.random() * 40,
          maxTireTemp: 90 + Math.random() * 20,
        },
      });

      statsCount++;
    }
  }

  console.log(`✓ Created ${statsCount} session statistics`);

  // Calculate leaderboard rankings
  const leaderboardEntries = await prisma.leaderboardEntry.findMany();
  const grouped: { [key: string]: typeof leaderboardEntries } = {};

  for (const entry of leaderboardEntries) {
    const key = `${entry.track}-${entry.simulator}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(entry);
  }

  // Assign ranks
  for (const key in grouped) {
    const entries = grouped[key].sort((a, b) => a.bestLapTime - b.bestLapTime);
    for (let i = 0; i < entries.length; i++) {
      await prisma.leaderboardEntry.update({
        where: { id: entries[i].id },
        data: { rank: i + 1 },
      });
    }
  }

  console.log(`✓ Updated leaderboard rankings`);

  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('✅ Database seeding completed successfully!');
  console.log('═══════════════════════════════════════════');
  console.log('');
  console.log('Test users:');
  users.forEach(user => {
    console.log(`  • ${user.username} (${user.email})`);
  });
  console.log('');
  console.log('Statistics:');
  console.log(`  • Users: ${users.length}`);
  console.log(`  • Sessions: ${sessions.length}`);
  console.log(`  • Telemetry points: ${telemetryCount}`);
  console.log(`  • Laps: ${lapCount}`);
  console.log(`  • Leaderboard entries: ${leaderboardEntries.length}`);
  console.log('');
}

main()
  .catch(e => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
