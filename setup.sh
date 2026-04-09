#!/bin/bash
# PitWall Quick Start Script for Linux/macOS
#
# Optimized for 2026 - Handles dependency patching and DB setup.

set -e  # Exit on error

# Colors for better UI
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Progress counter
STEP=0
TOTAL_STEPS=7

# Function for formatted logging
log_step() {
  STEP=$((STEP + 1))
  echo -e "\n${BLUE}[${STEP}/${TOTAL_STEPS}]${NC} ${CYAN}$1${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

log_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

# Print header
echo -e "\n${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║         🏁 PitWall Quick Setup         ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════╝${NC}\n"

# Check command availability
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Step 1: Check Environment
log_step "Checking environment"
if ! command_exists node; then
  log_error "Node.js is not installed. Please install Node.js 20+"
  exit 1
fi
log_success "Node.js $(node --version)"

# Step 2: Dependency Self-Healing
log_step "Auditing package versions"
if [ -f frontend/package.json ]; then
  echo -e "${BLUE}➜${NC} Patching invalid @react-navigation versions..."
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS requires an empty string for the -i flag
    sed -i '' 's/"@react-navigation\/bottom-tabs": "6.3.4"/"@react-navigation\/bottom-tabs": "^7.0.0"/g' frontend/package.json
  else
    # Standard Linux sed
    sed -i 's/"@react-navigation\/bottom-tabs": "6.3.4"/"@react-navigation\/bottom-tabs": "^7.0.0"/g' frontend/package.json
  fi
  log_success "Frontend package.json patched"
fi

# Step 3: Check Docker
log_step "Checking infrastructure"
if command_exists docker; then
  log_success "Docker detected"
  USE_DOCKER=true
else
  log_warning "Docker not detected. Expecting local PostgreSQL on 5432"
  USE_DOCKER=false
fi

# Step 4: Install Dependencies
log_step "Installing dependencies"

echo -e "${BLUE}➜${NC} Configuring backend..."
cd backend
npm install
log_success "Backend ready"

echo -e "${BLUE}➜${NC} Configuring frontend..."
cd ../frontend
npm install --legacy-peer-deps
log_success "Frontend ready"

# Step 5: Setup Database
log_step "Configuring database"
cd ../backend

if [ ! -f .env ]; then
  cp .env.example .env
  log_success "Generated .env file"
fi

if [ "$USE_DOCKER" = true ]; then
  echo -e "${BLUE}➜${NC} Starting PostgreSQL via Docker..."
  if ! docker ps -a --format '{{.Names}}' | grep -q pitwall-db; then
    docker run -d --name pitwall-db -e POSTGRES_DB=pitwall -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:15-alpine > /dev/null 2>&1
  else
    docker start pitwall-db > /dev/null 2>&1 || true
  fi
  log_info "Waiting for DB to start..."
  sleep 5
  log_success "Database container running"
fi

# Step 6: Sync Database Schema
log_step "Syncing Database Schema"
echo -e "${BLUE}➜${NC} Pushing schema via Prisma..."
npx prisma generate
if npx prisma db push; then
  log_success "Database schema is up to date"
else
  log_warning "Schema sync failed. Ensure PostgreSQL is accessible"
fi

# Step 7: Seed Database (Optional)
log_step "Data Seeding"
read -p "Seed database with sample racers? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  npm run seed > /dev/null 2>&1
  log_success "Sample data injected"
fi

echo -e "\n${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       ✅ PITWALL IS READY TO RACE      ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════╝${NC}\n"
echo -e "1. Start Backend:  ${GREEN}cd backend && npm run dev${NC}"
echo -e "2. Start Frontend: ${GREEN}cd frontend && npm run web${NC}"
echo -e "\nURL: ${GREEN}http://localhost:5173${NC}"