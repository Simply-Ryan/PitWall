# Phase 2: Backend API - Setup & Configuration Guide

## Overview

The Phase 2 backend is a fully-featured REST API built with **Express.js**, **TypeScript**, and **PostgreSQL** using **Prisma ORM**. This guide covers installation, configuration, and usage.

## Technology Stack

- **Framework**: Express.js 4.x
- **Language**: TypeScript 5.3 (strict mode)
- **Database**: PostgreSQL 14+ with Prisma ORM 5.0
- **Authentication**: JWT tokens + bcrypt password hashing
- **API Security**: Helmet, CORS, rate limiting
- **Logging**: Winston structured logging
- **Testing**: Jest + Supertest
- **Development**: ts-node-dev for hot reloading

## Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **PostgreSQL**: v14 or higher (or Docker)
- **Git**: For version control

## Installation

### 1. Navigate to Backend Directory

```bash
cd WebApps/StockLeague/backend
```

### 2. Install Dependencies

```bash
npm install
```

This installs all production and development dependencies specified in `package.json`.

### 3. Configure Environment Variables

Create a `.env` file in the backend root directory from the example:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/stockleague"

# Server
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars-long-12345678
JWT_EXPIRY=7d

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Logging
LOG_LEVEL=info

# API
API_PREFIX=/api

# WebSocket (Phase 1 Integration)
WEBSOCKET_HOST=localhost
WEBSOCKET_PORT=9999

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Session
SESSION_TIMEOUT_MS=3600000
```

### 4. Setup PostgreSQL Database

#### Option A: Using Docker (Recommended for development)

```bash
docker run -d \
  --name stockleague-db \
  -e POSTGRES_DB=stockleague \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:14
```

Verify connection:
```bash
docker exec stockleague-db psql -U postgres -d stockleague -c "SELECT 1"
```

#### Option B: Local PostgreSQL Installation

```bash
# macOS
brew install postgresql
brew services start postgresql

# Linux (Ubuntu/Debian)
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql

# Windows
# Download from https://www.postgresql.org/download/windows/
```

Create database:
```bash
psql -U postgres
CREATE DATABASE stockleague;
\q
```

## Database Setup

### 1. Generate Prisma Client

```bash
npx prisma generate
```

### 2. Run Migrations

```bash
# Create initial schema
npx prisma migrate dev --name init

# View database
npx prisma studio
```

This creates all tables, indexes, and relationships defined in `prisma/schema.prisma`.

## Development

### Start Development Server

```bash
npm run dev
```

The server starts on `http://localhost:3000` with hot-reloading enabled.

Output:
```
[API Server] Listening on 0.0.0.0:3000
```

### Build for Production

```bash
npm run build
```

Compiles TypeScript to JavaScript in the `dist/` directory.

### Start Production Server

```bash
npm run start
```

Runs the compiled JavaScript from `dist/index.js`.

## Testing

### Run All Tests

```bash
npm test
```

### Run Specific Test Suite

```bash
npm test -- api.integration.test.ts
```

### Run with Coverage

```bash
npm test -- --coverage
```

Tests are located in `src/__tests__/*.test.ts` and cover:
- Authentication flows (register, login)
- User profile management
- Session CRUD operations
- Telemetry data ingestion
- Lap recording with personal best detection
- Leaderboard rankings
- Error handling and validation
- Authorization and security

## API Endpoints

All endpoints are prefixed with `/api` (configurable via `API_PREFIX`).

### Authentication (Public)

```
POST   /api/auth/register     Register new user
POST   /api/auth/login        Authenticate and get JWT token
```

### Users (Protected)

```
GET    /api/users/profile     Get current user profile
PATCH  /api/users/profile     Update user profile
GET    /api/users/stats       Get personal statistics
GET    /api/users/leaderboard-position  Get user's leaderboard positions
```

### Sessions (Protected)

```
GET    /api/sessions          List user's recording sessions
POST   /api/sessions          Create new recording session
GET    /api/sessions/:id      Get session details with laps
PATCH  /api/sessions/:id      Update session metadata
DELETE /api/sessions/:id      Delete session and related data
```

### Telemetry (Protected)

```
POST   /api/telemetry         Bulk insert telemetry data
GET    /api/telemetry/:sessionId  Retrieve telemetry (paginated)
DELETE /api/telemetry/:sessionId  Delete all telemetry for session
```

### Laps (Protected)

```
POST   /api/laps              Record lap completion
GET    /api/laps              List user's laps (paginated)
GET    /api/laps/session/:sessionId  Get lap statistics for session
```

### Leaderboards (Public)

```
GET    /api/leaderboards/global    Get global rankings
GET    /api/leaderboards/track/:track   Get track-specific rankings
GET    /api/leaderboards/personal  Get user's personal bests (protected)
POST   /api/leaderboards/update    Update leaderboard entries (protected)
```

## Authentication

### Getting a Token

1. **Register**:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "racer42",
    "email": "racer42@example.com",
    "password": "SecurePass123!"
  }'
```

2. **Login**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "racer42",
    "password": "SecurePass123!"
  }'
```

Response includes JWT token.

### Using the Token

Include in `Authorization` header:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/users/profile
```

Tokens expire in 7 days (configurable via `JWT_EXPIRY`).

## Database Schema

### Core Models

**User**
- Unique username and email
- Bcrypt-hashed password (10 salt rounds)
- Timestamps (createdAt, updatedAt)

**Session**
- Recording metadata (track, simulator, name)
- User association (ownership)
- Start/end times

**Telemetry**
- 30+ telemetry fields per data point
- High-frequency data (speed, RPM, tires, brakes, etc.)
- Session association
- Indexed for fast queries

**Lap**
- Lap times with sector breakdowns
- Weather and track conditions
- Personal best tracking
- Associated session and user

**LeaderboardEntry**
- Rankings by track and simulator
- Best lap time
- Unique constraint per user-track-simulator combo

**SessionStatistics**
- Aggregated performance metrics
- Denormalized for fast lookups

### Indexes

For optimal performance:
- User: username, email (unique)
- Session: userId, track, simulator
- Telemetry: sessionId, createdAt
- Lap: userId, sessionId, track, lapTime
- LeaderboardEntry: track, simulator, bestLapTime

## Development Workflow

### 1. Start Database

```bash
# Docker
docker start stockleague-db

# Or Local PostgreSQL already running
```

### 2. Generate Prisma Client

```bash
npx prisma generate
```

### 3. Start Dev Server

```bash
npm run dev
```

### 4. Test Changes

```bash
# In another terminal
npm test
```

### 5. View Database

```bash
# In another terminal
npx prisma studio
```

Opens interactive database browser at `http://localhost:5555`

## Logging

All operations are logged with **Winston** structurally:

- **Console Output**: Colored logs with timestamps (development)
- **error.log**: Error-level logs with stack traces
- **combined.log**: All logs for debugging

Configure log level in `.env`:
```
LOG_LEVEL=debug    # Verbose
LOG_LEVEL=info     # Standard (default)
LOG_LEVEL=warn     # Warnings only
LOG_LEVEL=error    # Errors only
```

## Error Handling

All API errors follow this format:

```json
{
  "error": "ValidationError",
  "message": "Valid email is required",
  "status": 400,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `204` - No Content (delete)
- `400` - Validation Error
- `401` - Unauthorized (no token)
- `404` - Not Found
- `409` - Conflict (duplicate)
- `500` - Server Error

## Performance Optimization

### Query Optimization

1. **Pagination**: All GET list endpoints support pagination
   ```bash
   GET /api/laps?limit=50&offset=100
   ```

2. **Filtering**: Filter by track, simulator, session
   ```bash
   GET /api/sessions?track=Silverstone&simulator=iRacing
   ```

3. **Indexing**: Database indexes on frequently queried fields

### Rate Limiting

Default: 100 requests per 15 minutes per IP address (configurable)

### Caching

Leaderboard data is computed on-demand. For frequent access, implement Redis caching in production.

## Docker Deployment

### Build Docker Image

```bash
docker build -t stockleague-api:1.0 .
```

### Run Docker Container

```bash
docker run \
  -e DATABASE_URL=postgresql://user:pass@db:5432/stockleague \
  -e JWT_SECRET=your-secret \
  -p 3000:3000 \
  stockleague-api:1.0
```

### Docker Compose

```bash
docker-compose up
```

(Includes PostgreSQL + API service)

## Troubleshooting

### "Cannot find module '@prisma/client'"

```bash
npm install
npx prisma generate
```

### "Connection to database failed"

1. Verify PostgreSQL is running
2. Check `DATABASE_URL` in `.env`
3. Test connection:
   ```bash
   psql $DATABASE_URL
   ```

### "Port 3000 already in use"

Change port in `.env`:
```env
PORT=3001
```

### "JWT token invalid"

1. Ensure `JWT_SECRET` is set in `.env`
2. Token may be expired (7 day default)
3. Regenerate token by logging in again

## Monitoring

### Health Check

```bash
curl http://localhost:3000/health
```

### Version Check

```bash
curl http://localhost:3000/version
```

## Next Steps

1. **Frontend Integration**: Connect React Native HUD to API
2. **WebSocket Bridge**: Integrate Phase 1 telemetry broker
3. **Authentication UI**: Login/registration screens
4. **Leaderboard UI**: Display rankings and personal stats
5. **Mobile App**: Full StockLeague mobile application

## Support & Debugging

### Enable Debug Logging

```bash
DEBUG=* npm run dev
```

### Check Database Directly

```bash
npx prisma studio
```

### View Server Logs

```bash
tail -f logs/*.log
```

### Test Endpoint Directly

```bash
curl -v -X GET http://localhost:3000/api/sessions \
  -H "Authorization: Bearer TOKEN"
```

---

**Phase 2 Backend Ready**: All core API endpoints implemented, tested, and documented.
