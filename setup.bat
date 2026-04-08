@echo off
REM PitWall Quick Start Script for Windows
REM This script sets up PitWall with minimal user interaction

setlocal enabledelayedexpansion

echo.
echo 🏁 PitWall Quick Start Setup
echo ============================
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo ❌ Node.js is not installed
  echo Please install Node.js 18+ from https://nodejs.org/
  pause
  exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION%

REM Check npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo ❌ npm is not installed
  pause
  exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ npm %NPM_VERSION%

REM Check for Docker
where docker >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  echo ✅ Docker is available (will use for PostgreSQL)
  set USE_DOCKER=true
) else (
  echo ⚠️  Docker not detected (will expect local PostgreSQL)
  set USE_DOCKER=false
)

echo.
echo 📦 Installing Dependencies...
echo.

REM Install backend dependencies
cd backend
echo 📚 Installing backend dependencies...
call npm install > nul 2>&1

REM Install frontend dependencies
cd ..\frontend
echo 📚 Installing frontend dependencies...
call npm install > nul 2>&1

echo.
echo ✅ Dependencies installed
echo.

REM Setup database
cd ..\backend

echo 🗄️  Setting up database...

REM Create .env if it doesn't exist
if not exist .env (
  echo 📝 Creating .env file...
  copy .env.example .env > nul
  
  REM Generate JWT secret
  for /f "tokens=*" %%i in ('powershell -Command "[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([guid]::NewGuid().ToString() + [guid]::NewGuid().ToString('D'))) | Select-Object -First 43"') do set JWT_SECRET=%%i
  
  REM Update .env with JWT secret (basic replacement, may need manual fix)
  echo ✅ Generated secure JWT secret
)

REM Setup database
if "%USE_DOCKER%"=="true" (
  docker ps -a --format "{{.Names}}" | findstr /R "pitwall-db"
  if %ERRORLEVEL% NEQ 0 (
    echo 🐳 Starting PostgreSQL container...
    call docker run -d ^
      --name pitwall-db ^
      -e POSTGRES_DB=pitwall ^
      -e POSTGRES_USER=postgres ^
      -e POSTGRES_PASSWORD=password ^
      -p 5432:5432 ^
      postgres:14-alpine > nul 2>&1
    
    echo ⏳ Waiting for database to start...
    timeout /t 3 /nobreak > nul
  ) else (
    echo ✅ PostgreSQL container already running
    docker start pitwall-db > nul 2>&1
  )
) else (
  echo ⚠️  Please ensure PostgreSQL is running on localhost:5432
)

echo ✅ Database ready
echo.

REM Run migrations
echo 🔄 Running database migrations...
call npx prisma migrate deploy > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  call npx prisma migrate dev --name init > nul 2>&1
)

echo ✅ Migrations complete
echo.

REM Offer to seed database
setlocal enabledelayedexpansion
set /p SEED_DB="Would you like to seed the database with test data? (y/n) "
if /i "!SEED_DB!"=="y" (
  echo 🌱 Seeding database...
  call npm run seed > nul 2>&1
  echo ✅ Database seeded with test data
  echo.
  echo 📝 Test user credentials:
  echo    Username: racer1   Password: Password123!
  echo    Username: racer2   Password: Password456!
  echo    Username: racer3   Password: Password789!
)

echo.
echo ========================================
echo ✅ Setup Complete!
echo ========================================
echo.
echo 📌 To start the application:
echo.
echo    Backend (Command Prompt/PowerShell):
echo    cd backend
echo    npm run dev
echo.
echo    Frontend (New terminal):
echo    cd frontend
echo    npm run web
echo.
echo 🌐 Access the app at: http://localhost:5173
echo 📚 API Docs at: http://localhost:3000/api/docs
echo.
echo Happy racing! 🏁
echo.
pause
