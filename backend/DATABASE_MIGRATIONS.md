# Database Migration & Setup Guide

This guide covers all database setup, migration, and indexing for the PitWall race strategy system.

## Overview

The PitWall database schema includes:
- **User & Session Management** - Core session recording
- **Telemetry Data** - Raw sensor data from simulators
- **Lap Performance** - Lap time tracking and analysis
- **Leaderboards** - Global ranking systems
- **Race Strategy** - Strategy calculations and persistence
- **Adjustments** - Real-time deviation tracking

## Quick Start

### 1. Initialize Schema

First time setup - creates all tables:

```bash
# Generate Prisma client
npx prisma generate

# Create database schema
npx prisma db push

# Or use migrations
npx prisma migrate dev --name initial_setup
```

### 2. Initialize Database

Run the setup script to verify schema and seed initial data:

```bash
# From backend directory
npm run db:init
# or
npx ts-node scripts/init-database.ts
```

### 3. Verify Connection

```bash
# Test database connection
npx prisma db execute --stdin < /dev/null

# Or open Prisma Studio
npx prisma studio
```

## Schema Models

### RaceStrategy (New in Phase 2)

Main strategy record with full input/output storage.

**Fields:**
- `id` - Unique identifier
- `sessionId` - Link to racing session
- `strategyInput` - JSON: Race parameters + vehicle specs
- `strategyOutput` - JSON: 3 scenarios + risk assessment
- `activeScenario` - Current selected scenario
- `status` - 'planning' | 'active' | 'executed' | 'completed'
- `trackName` - Quick access for queries
- `totalLaps` - Quick access for queries

**Indexes:**
```sql
CREATE INDEX idx_race_strategies_session_id ON race_strategies(session_id);
CREATE INDEX idx_race_strategies_track_name ON race_strategies(track_name);
CREATE INDEX idx_race_strategies_status ON race_strategies(status);
CREATE INDEX idx_race_strategies_created_at ON race_strategies(created_at);
```

### StrategyAdjustment (New in Phase 2)

Tracks deviations during race execution.

**Fields:**
- `id` - Unique identifier
- `strategyId` - Link to strategy
- `lap` - Lap number of adjustment
- `fuelUsedThisLap` - Actual fuel for lap
- `fuelUsedVsForecast` - Delta from plan
- `tireWearPercent` - Tire wear percentage
- `adjustmentReason` - Why adjustment was needed

**Indexes:**
```sql
CREATE INDEX idx_strategy_adjustments_strategy_id ON strategy_adjustments(strategy_id);
CREATE INDEX idx_strategy_adjustments_lap ON strategy_adjustments(lap);
```

### StrategyTemplate (New in Phase 2)

User-saved strategy presets for reuse.

**Fields:**
- `id` - Unique identifier
- `userId` - Owner
- `trackName` - Track this template is for
- `defaultSettings` - JSON: Vehicle specs, strategy parameters

**Indexes:**
```sql
CREATE INDEX idx_strategy_templates_user_id ON strategy_templates(user_id);
CREATE INDEX idx_strategy_templates_track ON strategy_templates(track_name);
```

## Migrations

### Creating Migrations

After schema changes:

```bash
# Create new migration
npx prisma migrate dev --name <migration_name>

# Example: Adding a new field
npx prisma migrate dev --name add_pit_window_to_strategy
```

### Running Migrations

Applied automatically in development. For production:

```bash
# Apply pending migrations
npx prisma migrate deploy

# Status check
npx prisma migrate status
```

### Rolling Back

```bash
# Revert last migration (development only)
npx prisma migrate resolve --rolled_back <migration_name>

# Then reset schema
npx prisma db push
```

## Performance Optimization

### Index Strategy

All critical lookup paths are indexed:

```
User sessions:        sessions(user_id)
Strategy by session:  race_strategies(session_id)
Strategy by status:   race_strategies(status, created_at)
Adjustments:          strategy_adjustments(strategy_id, lap)
Telemetry timeseries: telemetry(session_id, timestamp)
Leaderboard rankings: leaderboard_entries(track, rank)
```

### Query Optimization Tips

```typescript
// Good: Use indexed fields
await prisma.raceStrategy.findMany({
  where: {
    sessionId: sessionId,      // Indexed
    status: 'active',           // Indexed
  },
  orderBy: { createdAt: 'desc' } // Index supports ordering
});

// Avoid: Non-indexed lookups
await prisma.raceStrategy.findMany({
  where: {
    strategyOutput: { contains: 'pit' }, // Slow - JSON search
  }
});
```

## Backup & Recovery

### Database Backup

```bash
# PostgreSQL dump
pg_dump $DATABASE_URL > backup.sql

# With compression
pg_dump $DATABASE_URL | gzip > backup.sql.gz
```

### Database Restore

```bash
# From backup
psql $DATABASE_URL < backup.sql

# Or with gunzip
gunzip < backup.sql.gz | psql $DATABASE_URL
```

## Troubleshooting

### Connection Issues

```bash
# Test connection
psql $DATABASE_URL -c "SELECT NOW();"

# Check environment
echo $DATABASE_URL
```

### Migration Conflicts

```bash
# Reset database (development only)
npx prisma migrate reset --skip-seed

# Then re-run migrations
npx prisma db push
```

### Slow Queries

```bash
# Analyze query performance
npx prisma db execute --stdin < query.sql

# Check indexes
SELECT * FROM pg_indexes WHERE tablename = 'race_strategies';
```

## Monitoring

### Database Health

```bash
# Row counts
npx prisma db execute --stdin << EOF
SELECT 
  'users' as table_name, COUNT(*) as count FROM users UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions UNION ALL
SELECT 'race_strategies', COUNT(*) FROM race_strategies;
EOF

# Storage usage
npx prisma db execute --stdin << EOF
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
EOF
```

## Production Checklist

- [ ] Database backed up
- [ ] All migrations applied
- [ ] Indexes verified
- [ ] Connection pooling configured
- [ ] Read replicas (if applicable)
- [ ] Monitoring alerts set
- [ ] Retention policies defined
- [ ] Disaster recovery plan

## Environment Variables

```bash
# Production database
DATABASE_URL="postgresql://user:password@host:5432/pitwall_prod"

# Connection pool
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20

# Backup location
DATABASE_BACKUP_PATH="/backups/pitwall"
```

## Support

For issues:
1. Check Prisma schema: `npx prisma validate`
2. Review migration status: `npx prisma migrate status`
3. Generate introspection: `npx prisma db pull`
4. Check logs: `tail -f backend/logs/database.log`
