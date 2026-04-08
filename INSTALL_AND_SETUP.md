# PitWall Installation & Setup Guide

Welcome to **PitWall**, your professional simracing telemetry and analytics hub!

This guide will walk you through setting up PitWall from scratch. Estimated setup time: **15-20 minutes**.

---

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Prerequisites Installation](#prerequisites-installation)
3. [Project Setup](#project-setup)
4. [Database Setup](#database-setup)
5. [Starting the Application](#starting-the-application)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Minimum Specs
- **OS**: Windows 10+, macOS 10.15+, Linux (Ubuntu 20.04+)
- **CPU**: 4-core processor
- **RAM**: 8GB minimum (16GB recommended)
- **Disk**: 2GB available space
- **Internet**: Required for initial setup

### Required Software
- **Node.js**: v18.0.0 or higher (with npm v9.0.0+)
- **PostgreSQL**: v14 or higher (or Docker for containerized setup)
- **Git**: v2.30 or higher

---

## Prerequisites Installation

### Step 1: Install Node.js & npm

**Windows:**
1. Download from https://nodejs.org/ (LTS version recommended)
2. Run the installer and follow the prompts
3. Verify installation:
   ```bash
   node --version
   npm --version
   ```

**macOS (using Homebrew):**
```bash
brew install node
node --version
npm --version
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install nodejs npm
node --version
npm --version
```

### Step 2: Install PostgreSQL

**Option A: PostgreSQL Directly (Recommended for production)**

**Windows:**
1. Download from https://www.postgresql.org/download/windows/
2. Run the installer
3. Remember the PostgreSQL password (you'll need it)
4. Default port is 5432

**macOS (Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux (Ubuntu):**
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Option B: Docker (Easiest - requires Docker Desktop)**

Install Docker Desktop from https://www.docker.com/products/docker-desktop, then we'll handle the database setup later with a simple command.

### Step 3: Install Git

Download from https://git-scm.com/ and install using the default settings.

---

## Project Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/PitWall.git
cd PitWall
```

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

Expected output: `added XXX packages` (typically 200+ packages)

If you see errors:
- Try deleting `node_modules` and `package-lock.json`, then run `npm install` again
- Ensure you're using Node.js 18+: `node --version`

### Step 3: Install Frontend Dependencies

```bash
cd ../../..
cd frontend
npm install
```

---

## Database Setup

### Option A: Using Docker (Easiest - No PostgreSQL installation needed)

If you have Docker installed:

```bash
cd backend

# Start PostgreSQL container
docker run -d \
  --name pitwall-db \
  -e POSTGRES_DB=pitwall \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=yourpassword \
  -p 5432:5432 \
  postgres:14-alpine
```

Wait 10 seconds for the database to start, then proceed to Step 2.

### Option B: Using Local PostgreSQL

1. **Create the database:**

   **Windows (using psql):**
   ```bash
   psql -U postgres
   ```
   Then in psql:
   ```sql
   CREATE DATABASE pitwall;
   \q
   ```

   **macOS/Linux:**
   ```bash
   createdb -U postgres pitwall
   ```

2. **Verify connection:**
   ```bash
   psql -U postgres -d pitwall -c "SELECT 1;"
   ```

### Step 2: Configure Environment Variables

```bash
cd backend

# Copy the example file
cp .env.example .env

# Edit .env with your database credentials
# On Windows: notepad .env
# On macOS/Linux: nano .env
```

**Update `.env` with these values:**

```env
# Required - Update according to your setup
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/pitwall"
PORT=3000
NODE_ENV=development
HOST=0.0.0.0

# Generate a secure JWT secret
JWT_SECRET="your-super-secret-key-min-32-chars-long-xxxxxxxxxx"
JWT_EXPIRY=7d

# CORS (for local development)
CORS_ORIGIN="http://localhost:3000,http://localhost:5173"

# Optional - for production
LOG_LEVEL=info
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

**To generate a secure JWT secret:**

**Windows (PowerShell):**
```powershell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString() + (New-Guid).ToString())) | Select-Object -First 44
```

**macOS/Linux:**
```bash
openssl rand -base64 32
```

### Step 3: Run Database Migrations

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init
```

You'll be prompted to confirm - type `y` and press Enter.

Expected output:
```
Your database has been successfully migrated!
```

### Step 4: (Optional) Seed Test Data

Populate the database with sample data for testing:

```bash
npm run seed
```

This creates:
- 3 test users (racer1, racer2, racer3)
- 9 test sessions across different tracks
- 900+ telemetry data points
- Test leaderboard entries

Test user credentials:
- Username: `racer1` Password: `Password123!`
- Username: `racer2` Password: `Password456!`
- Username: `racer3` Password: `Password789!`

---

## Starting the Application

### Step 1: Start Backend Server

```bash
cd backend

# Development mode (with auto-reload)
npm run dev

# Production mode
npm run build
npm run start
```

Expected output:
```
✅ Database connected
🚀 Server running at http://0.0.0.0:3000
📚 API Documentation: http://0.0.0.0:3000/api/docs
💪 Health check: http://0.0.0.0:3000/health
```

### Step 2: Start Frontend (In a NEW terminal)

```bash
cd frontend

# Development mode
npm run web

# Opens at http://localhost:5173 (or similar)
```

### Step 3: Verify Everything Works

1. **Backend Health Check:**
   ```bash
   curl http://localhost:3000/health
   ```
   Expected: `{"status":"ok","timestamp":"..."}`

2. **Visit Frontend:**
   Open http://localhost:3000 in your browser

3. **Create an Account:**
   - Click "Register"
   - Enter username, email, password (min. 8 chars)
   - Log in

---

## Testing

### Test Registration & Login

```bash
# Test registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPassword123"
  }'

# Test login (save the token)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "TestPassword123"
  }'
```

### Test Protected Endpoints

```bash
# Replace TOKEN with the token from login
TOKEN="your-jwt-token-here"

# Get user profile
curl "http://localhost:3000/api/users/profile" \
  -H "Authorization: Bearer $TOKEN"

# Get user stats
curl "http://localhost:3000/api/users/stats" \
  -H "Authorization: Bearer $TOKEN"
```

### Run Unit Tests

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode (auto-reload on changes)
npm run test:watch

# Run with coverage
npm test -- --coverage
```

---

## Troubleshooting

### Database Connection Issues

**Error: "connect ECONNREFUSED 127.0.0.1:5432"**
- PostgreSQL is not running
- Fix: Start PostgreSQL (Docker: `docker start pitwall-db`)
- Verify: `psql -U postgres -c "SELECT 1;"`

**Error: "role 'postgres' does not exist"**
- Database user issue
- Fix: Create the user: `createuser -s postgres`

**Error: "database 'pitwall' does not exist"**
- Fix: Run `createdb -U postgres pitwall`

### Node/npm Issues

**Error: "command not found: node" or "command not found: npm"**
- Node.js not installed or not in PATH
- Fix: Reinstall Node.js, restart terminal/IDE

**Error: "npm ERR! ERR! code ERESOLVE"**
Solution:
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Port Already in Use

**Error: "listen EADDRINUSE :::3000"**
- Another application uses port 3000
- Solutions:
  - Change PORT in `.env` to 3001 or 3002
  - Kill the process: 
    - **Windows (PowerShell):** `Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess`
    - **macOS/Linux:** `lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9`

### Frontend Not Loading

**Blank page or connection errors in browser**
- Backend not running: Start backend with `npm run dev`
- Port mismatch: Verify .env CORS_ORIGIN matches frontend URL
- Clear browser cache: Ctrl+Shift+Delete (Cmd+Shift+Delete on macOS)

### Seeding Failed

**Error during npm run seed**
- Database columns don't match seed data
- Fix: Run `npx prisma migrate reset` (WARNING: Deletes all data)
- Then: `npm run seed`

---

## Next Steps

### Useful Commands Reference

```bash
# Backend commands
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm test                 # Run tests
npm run lint             # Check code style
npm run lint:fix         # Fix code style issues

# Database commands
npx prisma migrate dev   # Create new migrations
npx prisma studio       # Open Prisma Studio GUI
npx prisma db push      # Push schema changes to DB
npm run seed             # Reset and seed database

# Frontend commands
npm run web              # Start web dev server
npm run ios              # Start iOS simulator
npm run android          # Start Android emulator
npm run build            # Build for production
```

### Environment Examples

**Development (.env):**
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/pitwall"
NODE_ENV=development
LOG_LEVEL=debug
JWT_SECRET="dev-secret-key-for-testing-only"
```

**Production (.env.production):**
```env
DATABASE_URL="postgresql://user:securepassword@prod-db.example.com:5432/pitwall"
NODE_ENV=production
LOG_LEVEL=info
JWT_SECRET="production-secret-key-change-regularly"
```

---

## Performance Tips

1. **Database Indexing**
   Already configured for optimal performance with indexes on:
   - userId, track, simulator in sessions
   - sessionId, timestamp in telemetry
   - userId, lapTime in laps

2. **Caching**
   Consider Redis for production leaderboards

3. **Rate Limiting**
   Configured at 100 requests per 15 minutes

---

## Support & Documentation

- **API Documentation**: Visit http://localhost:3000/api/docs (when running)
- **Prisma Docs**: https://www.prisma.io/docs/
- **Express.js Docs**: https://expressjs.com/
- **Issue Tracker**: Check GitHub issues

---

## Security Notes

⚠️ **IMPORTANT:**
- Change default `JWT_SECRET` in production
- Don't commit `.env` files to version control
- Ensure `NODE_ENV=production` in production deployments
- Regularly update dependencies: `npm audit fix`
- Never expose database credentials in logs

---

## Getting Help

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review log files in `logs/` directory
3. Check .env configuration
4. Check database connection: `npm run db:validate`
5. Open an issue with:
   - The exact error message
   - Your environment (OS, Node version, PostgreSQL version)
   - Steps to reproduce

---

**Happy Racing! 🏁**

Questions? Visit https://github.com/yourusername/PitWall/issues
