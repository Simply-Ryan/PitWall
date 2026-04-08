#!/bin/bash
# PitWall Validation Script
# Checks if the environment is ready to run PitWall

echo ""
echo "🔍 PitWall Environment Validation"
echo "=================================="
echo ""

ERRORS=0
WARNINGS=0

# Check Node.js
echo -n "Checking Node.js... "
if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
  if [ "$MAJOR_VERSION" -ge 18 ]; then
    echo "✅ $NODE_VERSION"
  else
    echo "❌ $NODE_VERSION (requires 18+)"
    ((ERRORS++))
  fi
else
  echo "❌ Not installed"
  ((ERRORS++))
fi

# Check npm
echo -n "Checking npm... "
if command -v npm &> /dev/null; then
  NPM_VERSION=$(npm --version)
  echo "✅ $NPM_VERSION"
else
  echo "❌ Not installed"
  ((ERRORS++))
fi

# Check PostgreSQL
echo -n "Checking PostgreSQL... "
if command -v psql &> /dev/null; then
  PG_VERSION=$(psql --version 2>/dev/null | awk '{print $NF}')
  echo "✅ $PG_VERSION"
else
  echo "⚠️  Not installed locally"
  ((WARNINGS++))
  echo "   (Docker can be used instead)"
fi

# Check Docker
echo -n "Checking Docker... "
if command -v docker &> /dev/null; then
  DOCKER_VERSION=$(docker --version | awk '{print $NF}')
  echo "✅ $DOCKER_VERSION"
else
  echo "⚠️  Not installed (optional but recommended)"
  ((WARNINGS++))
fi

# Check Git
echo -n "Checking Git... "
if command -v git &> /dev/null; then
  GIT_VERSION=$(git --version | awk '{print $NF}')
  echo "✅ $GIT_VERSION"
else
  echo "❌ Not installed"
  ((ERRORS++))
fi

echo ""
echo "📁 Checking Project Structure..."
echo ""

# Check backend directory
if [ -d "backend" ]; then
  echo "✅ Backend directory exists"
  
  if [ -f "backend/package.json" ]; then
    echo "✅ Backend package.json exists"
  else
    echo "❌ Backend package.json missing"
    ((ERRORS++
  fi
  
  if [ -f "backend/.env.example" ]; then
    echo "✅ .env.example exists"
  else
    echo "❌ .env.example missing"
    ((ERRORS++
  fi
  
  if [ -f "backend/prisma/schema.prisma" ]; then
    echo "✅ Prisma schema exists"
  else
    echo "❌ Prisma schema missing"
    ((ERRORS++))
  fi
else
  echo "❌ Backend directory missing"
  ((ERRORS++))
fi

# Check frontend directory
if [ -d "frontend" ]; then
  echo "✅ Frontend directory exists"
  
  if [ -f "frontend/package.json" ]; then
    echo "✅ Frontend package.json exists"
  else
    echo "❌ Frontend package.json missing"
    ((ERRORS++))
  fi
else
  echo "❌ Frontend directory missing"
  ((ERRORS++))
fi

echo ""
echo "🗄️  Checking Database Connection..."
echo ""

# Try to connect to database
echo -n "Attempting PostgreSQL connection... "

# Check if Docker container is running
if docker ps --format '{{.Names}}' 2>/dev/null | grep -q pitwall-db; then
  echo "✅ Docker container 'pitwall-db' is running"
elif command -v psql &> /dev/null; then
  if psql -U postgres -d postgres -c "SELECT 1;" &>/dev/null; then
    echo "✅ Local PostgreSQL is accessible"
  else
    echo "⚠️  Cannot connect to local PostgreSQL"
    echo "   Start PostgreSQL or Docker container"
    ((WARNINGS++))
  fi
else
  echo "⚠️  No database connection detected"
  echo "   Start PostgreSQL or run: docker start pitwall-db"
  ((WARNINGS++))
fi

echo ""
echo "📦 Checking Dependencies..."
echo ""

if [ -d "backend/node_modules" ]; then
  echo "✅ Backend dependencies installed"
else
  echo "⚠️  Backend dependencies not installed"
  echo "   Run: cd backend && npm install"
  ((WARNINGS++))
fi

if [ -d "frontend/node_modules" ]; then
  echo "✅ Frontend dependencies installed"
else
  echo "⚠️  Frontend dependencies not installed"
  echo "   Run: cd frontend && npm install"
  ((WARNINGS++))
fi

echo ""
echo "════════════════════════════════════════"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo "✅ All systems ready! Ready to run PitWall"
  echo ""
  echo "Next steps:"
  echo "1. cd backend && npm run dev"
  echo "2. cd frontend && npm run web"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo "⚠️  Some optional components missing ($WARNINGS warnings)"
  echo ""
  echo "You can still run PitWall, but see warnings above"
  exit 0
else
  echo "❌ Setup incomplete ($ERRORS errors, $WARNINGS warnings)"
  echo ""
  echo "Please fix the errors above before running PitWall"
  echo "See INSTALL_AND_SETUP.md for detailed instructions"
  exit 1
fi
