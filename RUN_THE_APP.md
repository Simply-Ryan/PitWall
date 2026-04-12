# 🚀 START THE APP NOW

## Option 1: Automated (Recommended)

### One Command Setup (macOS/Linux):
```bash
cd /workspaces/PitWall
chmod +x startup.sh
./startup.sh
```

The script will:
- ✅ Check all requirements
- ✅ Install backend dependencies
- ✅ Install frontend dependencies
- ✅ Start Docker containers (DB + API)
- ✅ Show you what to do next

**Then in a NEW terminal:**
```bash
cd /workspaces/PitWall/frontend
npm run web
```

**Open in browser:**
```
http://localhost:5173
```

---

## Option 2: Manual Steps

### Terminal 1: Backend
```bash
cd /workspaces/PitWall/backend

# First time only
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npx prisma generate

# Start backend
docker compose up --build
```

Wait for:
```
✅ PostgreSQL healthy
✅ API running on 0.0.0.0:3000
```

### Terminal 2: Frontend (NEW terminal)
```bash
cd /workspaces/PitWall/frontend

# First time only
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Start frontend
npm run web
```

Wait for:
```
✓ Compiled successfully
Local: http://localhost:5173
```

### Terminal 3 (Optional): Monitor Logs
```bash
cd /workspaces/PitWall/backend
docker compose logs -f api
```

---

## 🌐 Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend App** | http://localhost:5173 | Main web interface |
| **Backend API** | http://localhost:3000 | REST API server |
| **Health Check** | http://localhost:3000/health | API status |
| **Database** | localhost:5432 | PostgreSQL (internal) |

---

## ✅ Quick Test

Once running, test these:

1. **Frontend Loads**
   - Open http://localhost:5173
   - Should see home screen with buttons

2. **Settings Screen**
   - Click ⚙️ (Settings icon)
   - Should fade in with new UI components
   - Verify all 8 components visible

3. **Backend is Working**
   - Open http://localhost:3000/health
   - Should show `{"status":"ok",...}`

4. **Animations Work**
   - Settings should fade in smoothly
   - No stuttering or jank

---

## 🛑 Stop Services

### Stop Backend
```bash
# Terminal 1 - press Ctrl+C
# Or from another terminal:
cd /workspaces/PitWall/backend
docker compose down
```

### Stop Frontend
```bash
# Terminal 2 - press Ctrl+C
```

---

## 🐛 Troubleshooting

### "Port 3000 already in use"
```bash
# Kill existing process
docker compose down
# Or find and kill the process
lsof -i :3000
kill -9 <PID>
```

### "Port 5173 already in use"
```bash
# Kill existing frontend
lsof -i :5173
kill -9 <PID>
# Then restart: npm run web
```

### "Module not found errors"
```bash
# Full clean backend
cd backend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Full clean frontend
cd frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### "Docker not running"
```bash
# Start Docker service (varies by OS):
# macOS: open -a Docker
# Linux: sudo systemctl start docker
# Windows: Start Docker Desktop app
```

### "Database connection failed"
```bash
# Check database status
docker compose -f backend/docker-compose.yml ps

# View database logs
docker compose -f backend/docker-compose.yml logs db

# Reset database
docker compose -f backend/docker-compose.yml down -v
docker compose -f backend/docker-compose.yml up
```

---

## 📊 Full Testing Guide

See [APP_TESTING_GUIDE.md](./APP_TESTING_GUIDE.md) for comprehensive testing checklist including:
- ✅ Frontend loading verification
- ✅ Navigation testing
- ✅ UI component verification
- ✅ Theme system validation
- ✅ Animation performance checks
- ✅ Data integration testing
- ✅ Error handling verification
- ✅ Responsive design testing
- ✅ Gesture support testing
- ✅ Performance metrics

---

## 📚 Related Documentation

- **Full Setup Guide:** [SETUP_NEW_USER_GUIDE.md](./SETUP_NEW_USER_GUIDE.md)
- **Component Documentation:** [frontend/QUICK_START_NEW_SCREEN.md](./frontend/QUICK_START_NEW_SCREEN.md)
- **Screen Patterns:** [frontend/SCREEN_DEVELOPMENT_GUIDE.md](./frontend/SCREEN_DEVELOPMENT_GUIDE.md)
- **Design System:** [frontend/DESIGN_SYSTEM.md](./frontend/DESIGN_SYSTEM.md)
- **Session Summary:** [frontend/SESSION_SUMMARY.md](./frontend/SESSION_SUMMARY.md)

---

## 🎯 What's New to Test

This session added the following (test these especially):

1. **SettingsScreen.tsx** (400+ lines)
   - All 8 UI components in action
   - Theme integration
   - Animations
   - State management

2. **TelemetryDataService.ts** (300+ lines)
   - Unified data access layer
   - Formatted telemetry output
   - Alert detection
   - Risk assessment

3. **8 UI Components** (StyledComponents.tsx)
   - StyledButton (3 variants)
   - StyledCard (4 variants)
   - StatusIndicator
   - MetricDisplay
   - SectionHeader
   - AlertBox
   - GridLayout
   - Divider

4. **Theme System** (280+ design tokens)
   - Professional colors
   - Consistent spacing
   - Smooth animations
   - Responsive utilities

---

**Ready to test?** Pick Option 1 or 2 above and run the commands! 🏁
