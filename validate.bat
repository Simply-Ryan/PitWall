@echo off
REM PitWall Validation Script for Windows
REM Checks if the environment is ready to run PitWall

cls
echo.
echo 🔍 PitWall Environment Validation
echo ==================================
echo.

set ERRORS=0
set WARNINGS=0

REM Check Node.js
echo Checking Node.js...
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
  echo ✅ !NODE_VER!
) else (
  echo ❌ Not installed
  set /A ERRORS=%ERRORS%+1
)

REM Check npm
echo Checking npm...
where npm >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  for /f "tokens=*" %%i in ('npm --version') do set NPM_VER=%%i
  echo ✅ !NPM_VER!
) else (
  echo ❌ Not installed
  set /A ERRORS=%ERRORS%+1
)

REM Check PostgreSQL
echo Checking PostgreSQL...
where psql >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  for /f "tokens=*" %%i in ('psql --version') do set PG_VER=%%i
  echo ✅ !PG_VER!
) else (
  echo ⚠️  Not installed locally
  set /A WARNINGS=%WARNINGS%+1
  echo    (Docker can be used instead)
)

REM Check Docker  
echo Checking Docker...
where docker >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  echo ✅ Docker installed
) else (
  echo ⚠️  Not installed (optional but recommended)
  set /A WARNINGS=%WARNINGS%+1
)

REM Check Git
echo Checking Git...
where git >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  echo ✅ Git installed
) else (
  echo ❌ Not installed
  set /A ERRORS=%ERRORS%+1
)

echo.
echo 📁 Checking Project Structure...
echo.

REM Check backend directory
if exist "backend" (
  echo ✅ Backend directory exists
  
  if exist "backend\package.json" (
    echo ✅ Backend package.json exists
  ) else (
    echo ❌ Backend package.json missing
    set /A ERRORS=%ERRORS%+1
  )
  
  if exist "backend\.env.example" (
    echo ✅ .env.example exists
  ) else (
    echo ❌ .env.example missing
    set /A ERRORS=%ERRORS%+1
  )
  
  if exist "backend\prisma\schema.prisma" (
    echo ✅ Prisma schema exists
  ) else (
    echo ❌ Prisma schema missing
    set /A ERRORS=%ERRORS%+1
  )
) else (
  echo ❌ Backend directory missing
  set /A ERRORS=%ERRORS%+1
)

REM Check frontend directory
if exist "frontend" (
  echo ✅ Frontend directory exists
  
  if exist "frontend\package.json" (
    echo ✅ Frontend package.json exists
  ) else (
    echo ❌ Frontend package.json missing
    set /A ERRORS=%ERRORS%+1
  )
) else (
  echo ❌ Frontend directory missing
  set /A ERRORS=%ERRORS%+1
)

echo.
echo 🗄️  Checking Database...
echo.

REM Check if Docker container exists
docker ps --format "{{.Names}}" 2>nul | findstr /R "pitwall-db"
if %ERRORLEVEL% EQU 0 (
  echo ✅ Docker container 'pitwall-db' is running
) else (
  echo ⚠️  Docker container not running
  echo    Run: docker start pitwall-db
  set /A WARNINGS=%WARNINGS%+1
)

echo.
echo 📦 Checking Dependencies...
echo.

if exist "backend\node_modules" (
  echo ✅ Backend dependencies installed
) else (
  echo ⚠️  Backend dependencies not installed
  echo    Run: cd backend ^&^& npm install
  set /A WARNINGS=%WARNINGS%+1
)

if exist "frontend\node_modules" (
  echo ✅ Frontend dependencies installed
) else (
  echo ⚠️  Frontend dependencies not installed
  echo    Run: cd frontend ^&^& npm install
  set /A WARNINGS=%WARNINGS%+1
)

echo.
echo ========================================

if %ERRORS% EQU 0 (
  if %WARNINGS% EQU 0 (
    echo ✅ All systems ready! Ready to run PitWall
    echo.
    echo Next steps:
    echo 1. cd backend ^&^& npm run dev
    echo 2. cd frontend ^&^& npm run web
  ) else (
    echo ⚠️  Setup mostly complete (some warnings)
    echo.
    echo You can run PitWall, see warnings above
  )
) else (
  echo ❌ Setup incomplete ^(%ERRORS% errors, %WARNINGS% warnings^)
  echo.
  echo Please fix errors above before running PitWall
  echo See INSTALL_AND_SETUP.md for help
)

echo.
pause
