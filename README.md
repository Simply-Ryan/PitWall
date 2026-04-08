# 🏁 PitWall: The Comprehensive Simracing Hub

> **PitWall** is a professional-grade simracing telemetry and analytics ecosystem designed to transform casual simracers into data-driven competitors. Built with precision, performance, and extensibility in mind.

---

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Architecture Overview](#architecture-overview)
- [Core Features](#core-features)
- [System Requirements](#system-requirements)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [License](#license)

---

## 🚀 Quick Start

### For End Users
1. **[📖 READ FULL SETUP GUIDE](./INSTALL_AND_SETUP.md)** - Complete step-by-step installation (15-20 min)
2. Download the latest PitWall release from the [Releases](https://github.com/yourusername/PitWall/releases) page
3. Run the Windows installer (`PitWall-Setup.exe`) or follow the setup guide
4. Launch the PitWall app on your mobile device or browser
5. Connect to your simracing hardware and start collecting telemetry

### Quick Start Scripts

**Windows:**
```bash
# Run the automated setup script
setup.bat
```

**macOS/Linux:**
```bash
# Run the automated setup script
chmod +x setup.sh
./setup.sh
```

### For Developers

**Prerequisites:** Node.js 18+, PostgreSQL 14+, Git

```bash
# Clone and setup
git clone https://github.com/yourusername/PitWall.git
cd PitWall

# Option 1: Automated setup (recommended)
./setup.sh        # macOS/Linux
# OR
setup.bat         # Windows

# Option 2: Manual setup (see INSTALL_AND_SETUP.md)
npm install       # Install dependencies
npx prisma migrate dev --name init  # Setup database
npm run seed      # Optional: Add test data

# Start development servers
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm run web
```

**Access the app:**
- Frontend: http://localhost:5173 (or shown in terminal)
- Backend: http://localhost:3000
- API Docs: http://localhost:3000/api/docs (when backend running)

---

## 🏗️ Architecture Overview

PitWall is built using a **three-tier microservices architecture** with complete separation of concerns:

### Component 1: Telemetry Bridge (Windows C# Service)
- **Role:** UDP/API stream listener and normalizer
- **Inputs:** iRacing UDP, ACC API, Assetto Corsa UDP, F1 24/25 API
- **Output:** Unified JSON telemetry stream via WebSocket
- **Latency Target:** < 20ms
- **Tech Stack:** C#, .NET 8.0, WebSocket, NUnit Tests

### Component 2: Frontend (React Native + Web)
- **Role:** Real-time HUD, fuel strategy calculator, voice notifications
- **Platforms:** iOS, Android, Web (responsive)
- **Tech Stack:** React Native, TypeScript, Redux Toolkit, Tailwind CSS
- **Testing:** Jest, React Testing Library

### Component 3: Backend (Node.js + PostgreSQL)
- **Role:** Data persistence, user management, historical analytics, LLM integration
- **Tech Stack:** Node.js (Express), TypeScript, PostgreSQL, Prisma ORM, Jest
- **APIs:** RESTful + WebSocket for real-time updates

```
┌─────────────────────────────────────────────────────┐
│         SIMRACING HARDWARE                          │
│  (iRacing, ACC, AC, F1 24/25)                      │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │  TELEMETRY BRIDGE      │
        │  (C# Windows Service)  │
        │  • Normalization       │
        │  • WebSocket Server    │
        │  • < 20ms Latency      │
        └────────────┬───────────┘
                     │
        ┌────────────┴─────────────┐
        │                          │
        ▼                          ▼
    ┌─────────────────┐    ┌──────────────────┐
    │    FRONTEND     │    │  BACKEND         │
    │  (React Native) │◄──►│ (Node.js/Postgre)│
    │  • Live HUD     │    │ • Analytics      │
    │  • Fuel Calc    │    │ • User Mgmt      │
    │  • Voice Coach  │    │ • Setup Lib      │
    └─────────────────┘    └──────────────────┘
```

---

## ✨ Core Features

### Phase 1: Telemetry Engine ✅ (In Development)
- ✅ Multi-sim support (iRacing, ACC, AC, F1 24/25)
- ✅ UDP/API stream normalization
- ✅ WebSocket server for < 20ms latency
- ✅ Connection health monitoring
- ✅ Error recovery and reconnection logic

### Phase 2: Live Race Engineer 🔄 (Planned)
- 📊 Smart Dashboard with high-contrast HUD
- ⚙️ Gear, Speed, Throttle/Brake visualization
- 🎯 Delta tracking (vs. Best Lap / Session Average)
- 🌡️ Tire temperature monitoring (Inner/Middle/Outer)
- ⛽ Fuel strategy calculator with consumption tracking
- 🔊 Voice spotter with dynamic callouts

### Phase 3: Post-Session Analytics 🎓 (Planned)
- 📈 Telemetry overlay (lap-to-lap comparison)
- 🤖 AI-powered debrief using LLM analysis
- 📊 Stint tracker with tire wear history
- 🏁 Pit stop optimization recommendations
- 📉 Braking point and throttle trace analysis

### Phase 4: Ecosystem & Hardware ⚙️ (Planned)
- 💾 Cloud-synced setup library with tagging
- 🔧 Hardware health tracking (rotation hours, switcher clicks)
- 📱 Multi-user and team collaboration
- 🌐 Community leaderboards and comparisons

---

## 💻 System Requirements

### Windows Telemetry Bridge
- **OS:** Windows 10/11 or higher
- **Runtime:** .NET 8.0 SDK
- **RAM:** 256MB (minimal)
- **Network:** Local UDP support for sim games

### Frontend
- **Mobile:** iOS 13+, Android 10+
- **Web:** Chrome 90+, Firefox 88+, Safari 14+
- **RAM:** 2GB (recommended for smooth performance)

### Backend
- **Server:** Ubuntu 20.04 LTS or higher (or Docker)
- **Node.js:** 18.0 or higher
- **PostgreSQL:** 14.0 or higher
- **RAM:** 2GB (minimum), 4GB (recommended)

---

## 📦 Installation

### Prerequisites
- Git 2.30+
- Node.js 18+ and npm 9+
- .NET 8.0 SDK
- PostgreSQL 14+
- Docker (optional, for containerization)

### Step 1: Clone Repository
```bash
git clone https://github.com/yourusername/PitWall.git
cd PitWall
```

### Step 2: Frontend Setup
```bash
cd frontend
npm install

# Create .env.local
echo "REACT_APP_API_URL=http://localhost:3001" > .env.local

npm run dev
```

### Step 3: Backend Setup
```bash
cd ../backend
npm install

# Configure PostgreSQL connection in .env
echo "DATABASE_URL=postgresql://user:password@localhost:5432/pitwall" > .env

# Run migrations
npx prisma migrate dev

npm run dev
```

### Step 4: Telemetry Bridge Setup
```bash
cd ../telemetry-bridge

# Restore NuGet packages
dotnet restore

# Build the solution
dotnet build

# Run the service
dotnet run
```

### Step 5: Verify Installation
```bash
# Frontend should be running on http://localhost:3000
# Backend API on http://localhost:3001
# Telemetry WebSocket on ws://localhost:43200
```

---

## 📁 Project Structure

```
PitWall/
├── .github/
│   └── workflows/               # GitHub Actions CI/CD
│       ├── test.yml            # Run tests on push/PR
│       └── deploy.yml          # Deploy on release
│
├── telemetry-bridge/            # C# Windows Service
│   ├── src/
│   │   ├── Models/             # Data structures
│   │   ├── Services/           # Core business logic
│   │   ├── Connectors/         # Sim protocol handlers
│   │   ├── WebSocket/          # Real-time server
│   │   └── Program.cs          # Entry point
│   ├── tests/
│   │   ├── Unit/               # NUnit tests
│   │   └── Integration/        # E2E tests
│   └── PitWall.Telemetry.csproj
│
├── frontend/                    # React Native + Web
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── screens/            # App screens
│   │   ├── services/           # API clients
│   │   ├── redux/              # State management
│   │   ├── hooks/              # Custom hooks
│   │   ├── utils/              # Utilities
│   │   └── App.tsx             # Root component
│   ├── tests/
│   │   ├── unit/               # Jest unit tests
│   │   └── integration/        # E2E tests
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── backend/                     # Node.js + PostgreSQL
│   ├── src/
│   │   ├── modules/            # Domain modules
│   │   ├── services/           # Business logic
│   │   ├── routes/             # API endpoints
│   │   ├── middlewares/        # Express middlewares
│   │   ├── utils/              # Helper functions
│   │   ├── database/           # Prisma schema
│   │   └── app.ts              # Express app
│   ├── tests/
│   │   ├── unit/               # Jest unit tests
│   │   └── integration/        # API tests
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── prisma/
│       └── schema.prisma       # Database schema
│
├── docs/                        # Documentation
│   ├── architecture.md          # System design
│   ├── api-reference.md         # API documentation
│   ├── telemetry-schema.md      # Unified data model
│   ├── setup-guide.md           # Installation guide
│   └── troubleshooting.md       # Common issues
│
├── README.md                    # This file
├── PROJECT_PLAN.md              # Detailed roadmap
├── AGENT_CONTEXT.md             # AI agent instructions
├── CHANGELOG.md                 # Version history
├── .gitignore                   # Git ignore rules
└── LICENSE                      # Apache 2.0 License
```

---

## 🔄 Development Workflow

### Branching Strategy
- **`main`** - Production-ready code, tagged with version numbers
- **`develop`** - Integration branch for features
- **`feature/*`** - Feature branches (e.g., `feature/fuel-calculator`)
- **`bugfix/*`** - Bug fixes (e.g., `bugfix/websocket-reconnect`)
- **`hotfix/*`** - Production hotfixes

### Creating a Feature
```bash
# Update develop branch
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: add new fuel calculator logic"

# Push and create PR
git push origin feature/my-feature

# Create pull request on GitHub
# → Link to issue if applicable
# → Request review from team
# → Run CI/CD checks
```

### Commit Message Format
Follow [Conventional Commits](https://www.conventionalcommits.org/):
```
<type>(<scope>): <subject>

<body>

<footer>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`

Examples:
```
feat(telemetry): add iRacing UDP parser
fix(frontend): resolve tire temp display bug
docs(backend): update API documentation
test(fuel-calc): add unit tests for consumption tracking
```

---

## 🧪 Testing & Quality Assurance

### Test Coverage Requirements
- **Core modules:** 80%+ coverage (fuel calculations, pit strategy, telemetry parsing)
- **Business logic:** 90%+ coverage
- **UI components:** 60%+ coverage (critical components)

### Running Tests

#### Frontend
```bash
cd frontend

# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

#### Backend
```bash
cd backend

# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run specific test file
npm run test -- telemetry.service.test.ts
```

#### Telemetry Bridge
```bash
cd telemetry-bridge

# Run all tests
dotnet test

# Run with coverage
dotnet test /p:CollectCoverage=true

# Run specific test project
dotnet test tests/PitWall.Telemetry.Tests.csproj
```

### Code Quality Tools
- **Frontend:** ESLint, Prettier, TypeScript strict mode
- **Backend:** ESLint, husky (pre-commit hooks), TypeScript strict mode
- **Telemetry:** StyleCop, FxCop analyzers, Code Coverage tools

### CI/CD Pipeline
Every push triggers:
1. ✅ Linting checks
2. ✅ TypeScript compilation
3. ✅ Unit tests
4. ✅ Code coverage validation
5. ✅ Security scanning

Pull requests require:
- ✅ All tests passing
- ✅ Code review approval
- ✅ Coverage >= thresholds
- ✅ No merge conflicts

---

## 📚 Documentation

### Comprehensive Guides
- [Architecture Documentation](docs/architecture.md) - System design and data flow
- [API Reference](docs/api-reference.md) - Endpoint documentation and examples
- [Telemetry Schema](docs/telemetry-schema.md) - Unified data model specification
- [Setup Guide](docs/setup-guide.md) - Detailed installation and configuration
- [Troubleshooting Guide](docs/troubleshooting.md) - Common issues and solutions

### Code Documentation
- Every function includes JSDoc comments with:
  - **@param** - Parameter types and descriptions
  - **@returns** - Return type and description
  - **@throws** - Possible exceptions
  - **@example** - Usage examples

Example:
```typescript
/**
 * Calculates fuel needed to complete remaining race distance.
 *
 * @param avgConsumption - Fuel consumption (liters per lap)
 * @param remainingDistance - Remaining race distance (km)
 * @param trackLength - Race track length (km)
 * @returns Required fuel amount in liters
 * @throws {Error} If inputs are negative or invalid
 *
 * @example
 * const fuel = calculateFuelToEnd(1.5, 300, 10);
 * // Returns: 45.0 (for 30 laps remaining)
 */
function calculateFuelToEnd(
  avgConsumption: number,
  remainingDistance: number,
  trackLength: number
): number {
  // Implementation...
}
```

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository** and create your feature branch
2. **Follow our code style** - Configure your editor with `.editorconfig`
3. **Write tests** - All new features require corresponding tests
4. **Update documentation** - Keep docs in sync with code changes
5. **Commit with conventional format** - Helps automate CHANGELOG
6. **Submit PR with clear description** - Link related issues

### Code Standards
- **No `any` types** - Always use proper TypeScript types
- **Strict null checks** - `strictNullChecks: true` in tsconfig
- **Error handling** - Use custom error classes with context
- **Comments** - Comment the "why", not the "what"

---

## 📅 Roadmap

### Q2 2026: Foundation (Current)
- ✅ Repository setup and CI/CD
- 🔄 Telemetry Bridge Phase 1 (Multi-sim support)
- 🔄 Basic frontend structure
- 🔄 Backend scaffolding

### Q3 2026: Core Features
- Live telemetry dashboard
- Fuel strategy calculator
- Tire temperature monitoring
- Voice notifications

### Q4 2026: Analytics
- Lap telemetry overlay
- AI-powered debrief
- Historical tracking
- Setup library

### Q1 2027: Advanced Features
- Hardware health tracking
- Team collaboration
- Community features
- Mobile app refinement

### Q2+ 2027: Ecosystem Expansion
- Advanced telemetry analysis
- Predictive AI coaching
- Hardware integrations
- Enterprise features

---

## 🐛 Known Issues & Limitations

### Current Limitations
- Telemetry latency varies by sim (see component documentation)
- Voice spotter limited to English initially
- Fuel calculations assume consistent pace
- Setup library available after Q4 2026

### Tracked Issues
See [GitHub Issues](https://github.com/yourusername/PitWall/issues) for known bugs and feature requests.

---

## 📝 License

PitWall is licensed under the [Apache License 2.0](LICENSE). 

**Third-party licenses:**
- iRacing is a trademark of iRacing.com Motorsports Simulations, LLC
- ACC is a trademark of Kunos Simulazioni
- Assetto Corsa is a trademark of Kunos Simulazioni
- F1 is a trademark of Formula 1

---

## ❓ Support & Community

- **Documentation:** [Full Docs](docs/)
- **Issues:** [GitHub Issues](https://github.com/yourusername/PitWall/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/PitWall/discussions)
- **Email:** support@pitwall-racing.dev

---

## 🎯 Vision

PitWall aims to democratize professional-level simracing analytics. We believe every simracer, from hobbyist to semi-professional, deserves access to telemetry-driven coaching and performance analysis—regardless of budget.

By combining telemetry, AI, and community, PitWall transforms simracing from a hobby into a science.

---

**Built with ❤️ by the PitWall Community**

*Last updated: 2026-04-08*
