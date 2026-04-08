#!/bin/bash
# PitWall Quick Start Script
# This script sets up PitWall with minimal user interaction

set -e  # Exit on error

echo "🏁 PitWall Quick Start Setup"
echo "============================"
echo ""

# Function to check command availability
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check Node.js
if ! command_exists node; then
  echo "❌ Node.js is not installed"
  echo "Please install Node.js 18+ from https://nodejs.org/"
  exit 1
fi

echo "✅ Node.js $(node --version)"

# Check npm
if ! command_exists npm; then
  echo "❌ npm is not installed"
  exit 1
fi

echo "✅ npm $(npm --version)"

# Check for Docker (optional, but better)
if command_exists docker; then
  echo "✅ Docker is available (will use for PostgreSQL)"
  USE_DOCKER=true
else
  echo "⚠️  Docker not detected (will expect local PostgreSQL)"
  USE_DOCKER=false
fi

echo ""
echo "📦 Installing Dependencies..."
echo ""

# Install backend dependencies
cd backend
echo "📚 Installing backend dependencies..."
npm install --only=prod > /dev/null 2>&1 && npm install --save-dev > /dev/null 2>&1

# Install frontend dependencies
cd ../frontend
echo "📚 Installing frontend dependencies..."
npm install --only=prod > /dev/null 2>&1 && npm install --save-dev > /dev/null 2>&1

echo ""
echo "✅ Dependencies installed"
echo ""

# Setup database
cd ../backend

echo "🗄️  Setting up database..."

# Create .env if it doesn't exist
if [ ! -f .env ]; then
  echo "📝 Creating .env file..."
  cp .env.example .env
  
  # Generate JWT secret
  if command_exists openssl; then
    JWT_SECRET=$(openssl rand -base64 32)
    sed -i.bak "s/your-secret-key-change-in-production/$JWT_SECRET/" .env && rm -f .env.bak
    echo "✅ Generated secure JWT secret"
  fi
fi

# Setup database
if [ "$USE_DOCKER" = true ]; then
  # Check if container already exists
  if ! docker ps -a --format '{{.Names}}' | grep -q pitwall-db; then
    echo "🐳 Starting PostgreSQL container..."
    docker run -d \
      --name pitwall-db \
      -e POSTGRES_DB=pitwall \
      -e POSTGRES_USER=postgres \
      -e POSTGRES_PASSWORD=password \
      -p 5432:5432 \
      postgres:14-alpine > /dev/null 2>&1
    
    echo "⏳ Waiting for database to start..."
    sleep 3
  else
    echo "✅ PostgreSQL container already running"
    docker start pitwall-db > /dev/null 2>&1 || true
  fi
else
  echo "⚠️  Please ensure PostgreSQL is running on localhost:5432"
fi

echo "✅ Database ready"
echo ""

# Run migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy > /dev/null 2>&1 || npx prisma migrate dev --name init

echo "✅ Migrations complete"
echo ""

# Offer to seed database
read -p "Would you like to seed the database with test data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "🌱 Seeding database..."
  npm run seed > /dev/null 2>&1
  echo "✅ Database seeded with test data"
  echo ""
  echo "📝 Test user credentials:"
  echo "   Username: racer1   Password: Password123!"
  echo "   Username: racer2   Password: Password456!"
  echo "   Username: racer3   Password: Password789!"
fi

echo ""
echo "════════════════════════════════════════"
echo "✅ Setup Complete!"
echo "════════════════════════════════════════"
echo ""
echo "📌 To start the application, run:"
echo ""
echo "   Backend:"
echo "   cd backend"
echo "   npm run dev"
echo ""
echo "   Frontend (in a new terminal):"
echo "   cd frontend"
echo "   npm run web"
echo ""
echo "🌐 Access the app at: http://localhost:5173"
echo "📚 API Docs at: http://localhost:3000/api/docs"
echo ""
echo "Happy racing! 🏁"
