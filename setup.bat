@echo off
REM PitWall Quick Start Script for Windows
REM This script sets up PitWall with minimal user interaction

setlocal enabledelayedexpansion

echo.
echo PitWall Quick Start Setup
echo ============================
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Node.js is not installed
  echo Please install Node.js 18+ from https://nodejs.org/
  pause
  exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js %NODE_VERSION%

REM Check npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] npm is not installed
  pause
  exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [OK] npm %NPM_VERSION%

REM Check for Docker
where docker >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  echo [OK] Docker is available (will use for PostgreSQL)
  set USE_DOCKER=true
) else (
  echo [WARNING] Docker not detected (will expect local PostgreSQL on localhost:5432)
  set USE_DOCKER=false
)

REM Step 4: Install Dependencies
echo [4/7] Installing dependencies...
echo.
cd backend
echo Configuring backend dependencies...
call npm install > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Failed to install backend dependencies
  pause
  exit /b 1
)
echo [OK] Backend dependencies installed

REM Install frontend dependencies
cd ..\frontend
echo Configuring frontend dependencies...
call npm install > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Failed to install frontend dependencies
  pause
  exit /b 1
)
echo [OK] Frontend dependencies installed

echo.
echo [5/7] Configuring database...

REM Setup database
cd ..\backend

REM Create .env if it doesn't exist
if not exist .env (
  echo Creating .env file from template...
  copy .env.example .env > nul
  echo [OK] Generated .env file
)

if "!USE_DOCKER!"=="true" (
  echo Setting up PostgreSQL with Docker...
  
  REM Check if container exists
  docker ps -a --format "table {{.Names}}" 2>nul | find "pitwall-db" >nul
  if %ERRORLEVEL% NEQ 0 (
    echo Creating PostgreSQL container...
    docker run -d ^
      --name pitwall-db ^
      -e POSTGRES_DB=pitwall ^
      -e POSTGRES_USER=postgres ^
      -e POSTGRES_PASSWORD=password ^
      -p 5432:5432 ^
      postgres:14-alpine > nul 2>&1
    
    echo Waiting 3 seconds for database to start...
    timeout /t 3 /nobreak > nul
  ) else (
    echo PostgreSQL container exists, starting it...
    docker start pitwall-db > nul 2>&1
    timeout /t 1 /nobreak > nul
  )
  echo [OK] PostgreSQL database ready
) else (
  echo [WARNING] Please ensure PostgreSQL is running on localhost:5432
  echo Waiting a moment...
  timeout /t 2 /nobreak > nul
)

REM Step 6: Run Database Migrations
echo [6/7] Running database migrations...
echo Initializing Prisma migrations...
echo.

call npx prisma migrate dev --name init --skip-generate
if %ERRORLEVEL% NEQ 0 (
  echo [WARNING] Migration encountered an issue - may have already been initialized
)
echo [OK] Database migrations completed
echo.

REM Step 7: Seed Database
echo [7/7] Optional: Seed database with test data
set /p SEED_DB="Would you like to seed the database? (y/n): "

if /i "!SEED_DB!"=="y" (
  echo Seeding database...
  call npm run seed > nul 2>&1
  if %ERRORLEVEL% EQU 0 (
    echo [OK] Database seeded with test data
    echo.
    echo Test user credentials:
    echo    Username: racer1   Password: Password123!
    echo    Username: racer2   Password: Password456!
    echo    Username: racer3   Password: Password789!
  ) else (
    echo [WARNING] Seeding failed - but setup is otherwise complete
  )
) else (
  echo Skipping database seeding
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo To start the application:
echo.
echo    Backend (Command Prompt/PowerShell):
echo    cd backend
echo    npm run dev
echo.
echo    Frontend (New terminal):
echo    cd frontend
echo    npm run web
echo.
echo Access the app at: http://localhost:5173
echo API Docs at: http://localhost:3000/api/docs
echo.
echo Happy racing!
echo.
pause
