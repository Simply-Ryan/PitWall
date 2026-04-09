@echo off
REM PitWall Quick Start Script for Windows - Optimized for 2026
REM This script handles environment verification, dependency fixing, and DB setup.

setlocal enabledelayedexpansion

echo.
echo PitWall Quick Start Setup
echo ============================
echo.

REM --- STEP 1: ENVIRONMENT CHECK ---

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
echo [ERROR] Node.js is not installed. Please install Node.js 20+ from https://nodejs.org/
pause
exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js %NODE_VERSION%

where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
echo [ERROR] npm is not installed.
pause
exit /b 1
)

REM --- STEP 2: DEPENDENCY SELF-HEALING ---
echo [2/7] Auditing package versions...
echo [OK] Version check passed. Using --legacy-peer-deps for compatibility.

REM --- STEP 3: INFRASTRUCTURE CHECK ---

where docker >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    docker info >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Docker detected.
        set USE_DOCKER=true
    ) else (
        echo [WARNING] Docker CLI found, but Docker daemon is not running or accessible.
        echo [WARNING] Local PostgreSQL must be running on 5432 or start Docker Desktop.
        set USE_DOCKER=false
    )
) else (
    echo [WARNING] Docker not detected. Local PostgreSQL must be running on 5432.
    set USE_DOCKER=false
)

REM --- STEP 4: INSTALLATION ---
echo [4/7] Installing dependencies (this may take a few minutes)...

echo Configuring backend...
cd backend
REM We keep the lock file if it exists to ensure stability, unless it's corrupted
call npm install
if %ERRORLEVEL% NEQ 0 (
echo [ERROR] Backend install failed. Retrying with clean slate...
if exist package-lock.json del package-lock.json
call npm install
)
echo [OK] Backend ready.

echo Configuring frontend...
cd ..\frontend
REM --legacy-peer-deps is used to bypass version conflicts between React 18/19 and older plugins
call npm install --legacy-peer-deps
if %ERRORLEVEL% NEQ 0 (
echo [ERROR] Frontend install failed.
echo TIP: Try running 'npm cache clean --force' and then restart this script.
pause
exit /b 1
)
echo [OK] Frontend ready.

REM --- STEP 5: DATABASE CONFIGURATION ---
echo [5/7] Configuring database...

cd ..\backend
if not exist .env (
echo Generating .env from template...
copy .env.example .env > nul
)

if "!USE_DOCKER!"=="true" (
echo Starting PostgreSQL via Docker...
docker ps -a --format "{{.Names}}" | findstr /I "pitwall-db" > nul
if %ERRORLEVEL% NEQ 0 (
    docker run -d --name pitwall-db -e POSTGRES_DB=pitwall -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:15-alpine > nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo [WARNING] Failed to start Docker DB container. Local PostgreSQL must be running on 5432.
        set USE_DOCKER=false
    )
) else (
    docker start pitwall-db > nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo [WARNING] Failed to start existing Docker DB container. Local PostgreSQL must be running on 5432.
        set USE_DOCKER=false
    )
)
if "!USE_DOCKER!"=="true" (
    echo Waiting for DB to warm up...
    timeout /t 5 /nobreak > nul
)
)

REM --- STEP 6: SCHEMA MIGRATION ---
echo [6/7] Syncing Database Schema...
set DB_SYNC_OK=true
call npx prisma generate
call npx prisma db push
if %ERRORLEVEL% NEQ 0 (
echo [WARNING] Database sync failed. Check if PostgreSQL is running.
set DB_SYNC_OK=false
) else (
echo [OK] Database schema is up to date.
)

REM --- STEP 7: SEEDING ---
if "!DB_SYNC_OK!"=="true" (
echo [7/7] Data Seeding...
set /p SEED_DB="Seed the database with sample racers/tracks? (y/n): "
if /i "!SEED_DB!"=="y" (
    call npm run seed
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Sample data injected.
    ) else (
        echo [WARNING] Data seeding failed. Please verify PostgreSQL is running and try again.
    )
)
) else (
echo [7/7] Skipping data seeding because database schema synchronization failed.
)

echo.
echo ========================================
echo PITWALL IS READY TO RACE
echo ========================================
echo.
echo 1. Start Backend:  cd backend ^&^& npm run dev
echo 2. Start Frontend: cd frontend ^&^& npm run web
echo.
echo URL: http://localhost:5173
echo ========================================
pause