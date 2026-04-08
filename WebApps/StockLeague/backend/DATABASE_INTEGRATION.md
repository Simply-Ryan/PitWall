# Phase 2 Week 2-3: Database Integration Guide

## Overview

This guide covers setting up PostgreSQL, running Prisma migrations, seeding test data, and validating the database integration with the Express.js REST API.

## Prerequisites

- **Node.js** v18+ with npm
- **PostgreSQL** v14+ (or Docker)
- **Backend code** from Phase 2 Week 1-2

## Quick Start (5 minutes)

### Step 1: Install Dependencies

```bash
cd WebApps/StockLeague/backend
npm install
```

### Step 2: Start PostgreSQL

**Docker (easiest):**

```bash
docker run -d \
  --name stockleague-db \
  -e POSTGRES_DB=stockleague \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:14-alpine
```

**Or use Docker Compose:**

```bash
docker-compose up -d
```

### Step 3: Configure Environment

```bash
cp .env.example .env
```

Update `.env` with your database:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/stockleague"
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-key-min-32-chars-long-password
```

### Step 4: Run Migrations

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### Step 5: (Optional) Seed Test Data

```bash
npm run seed
```

Creates 3 users, 9 sessions, 900+ telemetry records, and rankings.

### Step 6: Validate Connection

```bash
npm run db:validate
```

## Database Structure

### 6 Prisma Models

1. **User** - Authentication and session ownership
2. **Session** - Recording sessions with track/simulator metadata
3. **Telemetry** - 30+ fields per data point (speed, RPM, tires, brakes)
4. **Lap** - Lap times with personal best tracking
5. **LeaderboardEntry** - Rankings by track/simulator
6. **SessionStatistics** - Aggregated performance metrics

## API Test After Setup

### 1. Register User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Password123!"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Password123!"
  }'
```

Save the returned JWT token.

### 3. Create Session

```bash
curl -X POST http://localhost:3000/api/sessions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Drive",
    "track": "Silverstone",
    "simulator": "iRacing"
  }'
```

Save the session ID.

### 4. Record Lap

```bash
curl -X POST http://localhost:3000/api/laps \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "SESSION_ID",
    "lapNumber": 1,
    "lapTime": 95.234,
    "sector1": 30.1,
    "sector2": 32.5,
    "sector3": 32.6,
    "maxSpeed": 285,
    "avgSpeed": 220,
    "fuelConsumed": 2.5,
    "weather": "clear",
    "trackTemp": 28
  }'
```

### 5. Test Leaderboards

```bash
curl http://localhost:3000/api/leaderboards/global?track=Silverstone&simulator=iRacing
```

## Common Commands

```bash
# Start dev server
npm run dev

# View database GUI
npx prisma studio

# Run tests
npm test

# Seed fresh data
npm run seed

# Validate database
npm run db:validate

# Reset database (WARNING: deletes all data!)
npm run db:reset

# Check migration status
npx prisma db status
```

## Troubleshooting

### "Cannot connect to database"

```bash
# Verify PostgreSQL is running
docker ps | grep stockleague-db

# Test connection directly
psql postgresql://postgres:password@localhost:5432/stockleague
```

### "Prisma client not generated"

```bash
npm install
npx prisma generate
```

### "Migration failed"

```bash
# Check status
npx prisma db status

# Retry
npx prisma migrate deploy
```

## Environment Variables

Key settings in `.env`:

```
DATABASE_URL          # PostgreSQL connection
PORT                  # Server port (3000)
HOST                  # Server host (0.0.0.0)
NODE_ENV              # development/production
JWT_SECRET            # Token signing key
JWT_EXPIRY            # Token lifetime (7d)
LOG_LEVEL             # debug/info/warn/error
CORS_ORIGIN           # Allowed frontend URLs
```

## Next Steps

1. ✅ Database connected and migrated
2. ✅ Test data seeded
3. ⏳ **Frontend development** (React Native)
4. ⏳ **WebSocket integration** (real-time telemetry)
5. ⏳ **Performance testing** (load, optimization)

---

**Phase 2 Week 2-3 Complete**: Database is set up and integrated with the REST API.
