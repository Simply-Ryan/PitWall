# 🏁 PitWall Application - Complete Setup Guide for New Users

## Quick Overview
PitWall is a professional simracing telemetry and analytics ecosystem with three main components:
- **Backend API** (Node.js/Express) - Data management and analytics
- **Frontend** (React/Expo) - User interface (web & mobile)
- **Database** (PostgreSQL) - Data persistence
- **Telemetry Bridge** (C# .NET) - Connects simulation software (Windows only)

---

## ✅ Prerequisites Checklist

Before you start, ensure you have:

- [ ] **Node.js v18+** (check with `node --version`)
- [ ] **npm v9+** (check with `npm --version`)
- [ ] **Git** (check with `git --version`)
- [ ] **Docker Desktop** (optional but RECOMMENDED - easier database setup)
  - OR **PostgreSQL 14+** installed locally

### Quick System Check
```bash
node --version    # Should show v18.0.0 or higher
npm --version     # Should show v9.0.0 or higher
git --version     # Should show v2.30 or higher
docker --version  # Optional - shows if Docker is available
```

---

## 🚀 Step-by-Step Setup

### **OPTION A: Fastest Way (With Docker) - ⭐ RECOMMENDED**

#### Step 1: Clone the Repository
```bash
git clone https://github.com/Simply-Ryan/PitWall.git
cd PitWall
```

#### Step 2: Make Setup Script Executable (macOS/Linux only)
```bash
chmod +x setup.sh start-all.sh
```

#### Step 3: Run Automated Setup
```bash
./setup.sh
```

This script will:
- ✅ Check Node.js is installed
- ✅ Install backend dependencies
- ✅ Install frontend dependencies
- ✅ Start PostgreSQL via Docker
- ✅ Create database schema
- ✅ Optionally seed sample data

#### Step 4: Start the Application

**In Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

Wait for output: `🚀 Server running at http://localhost:3000`

**In Terminal 2 (Frontend):**
```bash
cd frontend
npm run web
```

Wait for Expo to show: `Local: http://localhost:5173` or similar

#### Step 5: Open in Browser
Visit: **http://localhost:5173**

---

### **OPTION B: Manual Setup (If Scripts Don't Work)**

#### Step 1: Clone Repository
```bash
git clone https://github.com/Simply-Ryan/PitWall.git
cd PitWall
```

#### Step 2: Set Up Environment Files

**Backend .env file** (`backend/.env`):
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/pitwall"
PORT=3000
NODE_ENV="development"
HOST="0.0.0.0"
JWT_SECRET="dev-key-change-in-production-min-32-chars-long-1234567890"
JWT_EXPIRY="7d"
CORS_ORIGIN="http://localhost:3000,http://localhost:5173,http://localhost:19006"
LOG_LEVEL="debug"
API_PREFIX="/api"
WEBSOCKET_URL="ws://localhost:9999"
WEBSOCKET_RECONNECT_INTERVAL=5000
WEBSOCKET_MAX_RETRIES=10
SESSION_TIMEOUT=3600
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
FEATURE_LEADERBOARDS=true
FEATURE_SOCIAL=true
FEATURE_ANALYTICS=true
```

**Frontend .env file** (`frontend/.env`):
```
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_WS_URL=ws://localhost:9999
EXPO_PUBLIC_ENV=development
```

#### Step 3: Install Dependencies

**Backend:**
```bash
cd backend
npm install
cd ..
```

**Frontend:**
```bash
cd frontend
npm install --legacy-peer-deps
cd ..
```

#### Step 4: Start Database

**With Docker (Easiest):**
```bash
docker run -d \
  --name pitwall-db \
  -e POSTGRES_DB=pitwall \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:15-alpine
```

**With Docker Compose:**
```bash
cd backend
docker-compose up -d
cd ..
```

**With Local PostgreSQL:**
```bash
# Make sure PostgreSQL service is running
# On Linux: sudo systemctl start postgresql
# On macOS: brew services start postgresql@14
```

#### Step 5: Set Up Database Schema

```bash
cd backend
npx prisma generate
npx prisma db push
```

#### Step 6: (Optional) Seed Sample Data
```bash
npm run seed
```

#### Step 7: Start Backend
```bash
npm run dev
```

Expected output:
```
🚀 Server running at http://localhost:3000
```

#### Step 8: Start Frontend (New Terminal)
```bash
cd frontend
npm run web
```

Expected: Browser opens to http://localhost:5173

---

## 🌐 Access Your Application

| Component | URL | Purpose |
|-----------|-----|---------|
| Frontend | http://localhost:5173 | Main application UI |
| Backend API | http://localhost:3000 | REST API endpoints |
| API Docs | http://localhost:3000/api/docs | Interactive API documentation |

---

## 🔧 Common Issues & Solutions

### Issue: "Port 3000 already in use"
```bash
# Kill process using port 3000 (macOS/Linux)
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Or change port in backend/.env:
PORT=3001
```

### Issue: "Database connection failed"
1. Check PostgreSQL is running:
   ```bash
   # With Docker:
   docker ps | grep pitwall-db
   
   # With local PostgreSQL:
   psql -U postgres -c "SELECT 1"
   ```

2. Verify DATABASE_URL in `backend/.env` matches your setup
3. Reset database if corrupted:
   ```bash
   cd backend
   npx prisma db reset
   npm run seed
   ```

### Issue: "Port 5173 not available"
Expo will automatically use the next available port (5174, 5175, etc). Check terminal output for the actual URL.

### Issue: "@prisma/client" version mismatch
```bash
cd backend
npm install @prisma/client@5.0.0
npx prisma generate
```

### Issue: "Docker daemon is not running"
- Open Docker Desktop application
- OR use local PostgreSQL instead
- OR troubleshoot Docker: `docker ps` should work once Docker is running

### Issue: npm permission denied on Linux
```bash
# Don't use sudo. Instead, fix npm permissions:
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

---

## 📊 Project Structure

```
PitWall/
├── backend/                    # Node.js API Server
│   ├── src/
│   │   ├── app.ts             # Express app setup
│   │   ├── index.ts           # Entry point
│   │   ├── routes/            # API endpoints
│   │   ├── middleware/        # Auth, error handling
│   │   └── utils/
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.ts            # Sample data
│   ├── package.json
│   ├── docker-compose.yml
│   └── .env                   # ⬅️ CREATE THIS
│
├── frontend/                   # React Web App
│   ├── src/
│   │   ├── App.tsx
│   │   ├── screens/           # UI pages
│   │   ├── components/        # Reusable components
│   │   ├── services/          # API integrations
│   │   └── redux/             # State management
│   ├── package.json
│   └── .env                   # ⬅️ CREATE THIS
│
├── telemetry-bridge/          # C# Telemetry Service (Windows only)
│   └── src/
│       ├── Connectors/        # Sim software connections
│       └── Services/          # Data processing
│
└── setup.sh / setup.bat       # Automated setup
```

---

## 🧪 Verify Installation

Once everything is running, test these endpoints in your browser:

1. **Backend is alive:**
   ```
   http://localhost:3000
   ```
   Expected: JSON response

2. **Frontend is loaded:**
   ```
   http://localhost:5173
   ```
   Expected: PitWall app interface

3. **API health check:**
   ```
   http://localhost:3000/api/health
   ```
   Expected: `{"status":"ok"}`

---

## 🛑 Stopping the Application

**Backend:**
- Press `Ctrl+C` in the backend terminal

**Frontend:**
- Press `Ctrl+C` in the frontend terminal

**Database (if using Docker):**
```bash
docker stop pitwall-db
```

---

## 🔄 Restarting After Shutdown

After first setup, you only need to run:

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run web

# Optional: Start database if using Docker and it stopped
docker start pitwall-db
```

---

## 🚀 Development Tips

### Hot Reloading
- **Backend** automatically reloads on file changes (ts-node-dev)
- **Frontend** automatically reloads on file changes (Expo)

### Running Tests
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

### Database Management
```bash
# View/edit database in GUI
cd backend && npx prisma studio

# Rollback migrations
cd backend && npx prisma migrate reset

# Create new migration
cd backend && npx prisma migrate dev --name migration_name
```

### View API Documentation
Once backend is running, visit:
```
http://localhost:3000/api/docs
```

---

## 📱 Building for Mobile (Optional)

### iOS Build
```bash
cd frontend
npm run ios
```
Requires Xcode and iOS simulator

### Android Build
```bash
cd frontend
npm run android
```
Requires Android Studio and emulator

---

## 🐛 Debugging

### Backend Logs
Backend logs are in:
```
backend/logs/
```

Or view in terminal where `npm run dev` is running.

### Frontend Logs
View in:
1. Browser console (F12 / Cmd+Option+I)
2. Terminal where Expo is running

### Full Debugging
Set in `backend/.env`:
```
LOG_LEVEL=debug
```

---

## 🆘 Still Having Issues?

1. **Verify prerequisites are installed:**
   ```bash
   node --version    # Need v18+
   npm --version     # Need v9+
   git --version
   ```

2. **Check database connection:**
   ```bash
   # Test PostgreSQL connection
   psql -U postgres -d pitwall -c "SELECT 1"
   ```

3. **Clear npm cache:**
   ```bash
   npm cache clean --force
   ```

4. **Delete and reinstall modules:**
   ```bash
   cd backend && rm -rf node_modules package-lock.json && npm install
   cd ../frontend && rm -rf node_modules package-lock.json && npm install --legacy-peer-deps
   ```

5. **Check ports are available:**
   ```bash
   # macOS/Linux
   lsof -i :3000
   lsof -i :5173
   ```

---

## 📚 Next Steps

After setup:
1. Create a user account in the app
2. Connect your simracing hardware via the Telemetry Bridge (Windows)
3. Start a race and view telemetry data
4. Explore fuel strategy calculator and analytics features
5. Check out the documentation in individual components

---

## 📞 Support

- **GitHub Issues:** https://github.com/Simply-Ryan/PitWall/issues
- **Documentation:** See README.md and component-specific docs
- **Status:** For latest updates, check CHANGELOG.md

---

**Happy Racing! 🏁**
