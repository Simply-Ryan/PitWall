#!/bin/bash

# PitWall - Complete App Startup Script
# This script handles all setup and starts both backend and frontend

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# Functions
print_header() {
    echo -e "\n${CYAN}╔════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC} $1"
    echo -e "${CYAN}╚════════════════════════════════════════╝${NC}\n"
}

print_step() {
    echo -e "${BLUE}→${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

check_requirements() {
    print_header "CHECKING REQUIREMENTS"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js not installed"
        echo "   Install from: https://nodejs.org/"
        exit 1
    fi
    print_success "Node.js $(node --version)"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm not installed"
        exit 1
    fi
    print_success "npm $(npm --version)"
    
    # Check Docker
    if command -v docker &> /dev/null; then
        print_success "Docker $(docker --version | cut -d' ' -f3 | cut -d',' -f1)"
    else
        print_info "Docker not found - will use local PostgreSQL if available"
    fi
}

setup_backend() {
    print_header "SETTING UP BACKEND"
    
    cd "$BACKEND_DIR"
    
    # Check if dependencies already installed
    if [ ! -d "node_modules" ]; then
        print_step "Installing backend dependencies..."
        npm install --legacy-peer-deps
        print_success "Backend dependencies installed"
    else
        print_info "Backend dependencies already installed"
    fi
    
    # Generate Prisma client
    print_step "Generating Prisma client..."
    npx prisma generate
    print_success "Prisma client generated"
    
    # Check environment file
    if [ ! -f ".env" ]; then
        print_info "Creating .env file with defaults..."
        cat > .env << 'EOF'
# Database Configuration
DATABASE_URL="postgresql://postgres:password@localhost:5432/pitwall"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="password"
POSTGRES_DB="pitwall"

# Server Configuration
NODE_ENV="development"
PORT=3000
HOST=0.0.0.0

# JWT Configuration
JWT_SECRET="your-super-secret-key-min-32-chars-long-12345"
JWT_EXPIRY="7d"

# CORS Configuration
CORS_ORIGIN="*"

# Logging
LOG_LEVEL="info"

# API Configuration
API_PREFIX="/api"
WEBSOCKET_HOST="localhost"
WEBSOCKET_PORT="9999"
EOF
        print_success ".env file created"
    else
        print_info ".env already exists"
    fi
    
    cd "$PROJECT_DIR"
}

setup_frontend() {
    print_header "SETTING UP FRONTEND"
    
    cd "$FRONTEND_DIR"
    
    # Check if dependencies already installed
    if [ ! -d "node_modules" ]; then
        print_step "Installing frontend dependencies..."
        npm install --legacy-peer-deps
        print_success "Frontend dependencies installed"
    else
        print_info "Frontend dependencies already installed"
    fi
    
    # Check environment file
    if [ ! -f ".env" ]; then
        print_info "Creating .env file with defaults..."
        cat > .env << 'EOF'
# API Configuration
REACT_APP_API_URL="http://localhost:3000/api"
REACT_APP_WEBSOCKET_URL="ws://localhost:9999"
REACT_APP_ENVIRONMENT="development"
EOF
        print_success ".env file created"
    else
        print_info ".env already exists"
    fi
    
    cd "$PROJECT_DIR"
}

start_backend_docker() {
    print_header "STARTING BACKEND (DOCKER)"
    
    cd "$BACKEND_DIR"
    
    print_step "Starting Docker containers..."
    print_info "Building image and starting services..."
    print_info "This may take 2-3 minutes on first run..."
    
    docker compose up --build -d
    
    # Wait for services to be ready
    print_step "Waiting for services to initialize..."
    sleep 5
    
    # Check if API is responding
    for i in {1..30}; do
        if curl -s http://localhost:3000/health >/dev/null 2>&1; then
            print_success "Backend API ready!"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "Backend API failed to start"
            echo "   Run: docker compose logs (in $BACKEND_DIR) to see errors"
            exit 1
        fi
        echo -n "."
        sleep 1
    done
    
    cd "$PROJECT_DIR"
}

start_frontend() {
    print_header "STARTING FRONTEND"
    
    print_info "Frontend will start in development mode"
    print_info "Open a NEW terminal and run:"
    echo ""
    echo -e "  ${CYAN}cd $FRONTEND_DIR${NC}"
    echo -e "  ${CYAN}npm run web${NC}"
    echo ""
    print_info "Frontend will be available at: ${CYAN}http://localhost:5173${NC}"
}

show_urls() {
    print_header "APPLICATION RUNNING"
    
    echo -e "${GREEN}Backend Services:${NC}"
    echo "  API Server        → http://localhost:3000"
    echo "  Health Check      → http://localhost:3000/health"
    echo "  API Docs (if avail)→ http://localhost:3000/api-docs"
    echo ""
    echo -e "${GREEN}Frontend:${NC}"
    echo "  Web App           → http://localhost:5173"
    echo ""
    echo -e "${YELLOW}Testing the App:${NC}"
    echo "  1. Open http://localhost:5173 in your browser"
    echo "  2. Navigate to Settings (⚙️ icon)"
    echo "  3. Check that all new UI components display correctly"
    echo "  4. Verify animations work smoothly"
    echo "  5. Test telemetry data integration"
    echo ""
}

show_docker_logs() {
    print_header "DOCKER LOGS"
    echo -e "${YELLOW}To view backend logs:${NC}"
    echo "  docker compose -f $BACKEND_DIR/docker-compose.yml logs -f api"
    echo ""
    echo -e "${YELLOW}To view database logs:${NC}"
    echo "  docker compose -f $BACKEND_DIR/docker-compose.yml logs -f db"
    echo ""
    echo -e "${YELLOW}To stop services:${NC}"
    echo "  docker compose -f $BACKEND_DIR/docker-compose.yml down"
    echo ""
}

cleanup_old_postgres() {
    print_info "Checking for old PostgreSQL containers..."
    if docker ps -a --format '{{.Names}}' 2>/dev/null | grep -q pitwall-db; then
        print_step "Removing old pitwall-db container..."
        docker rm -f pitwall-db pitwall-api 2>/dev/null || true
    fi
}

# Main execution
main() {
    echo ""
    echo -e "${CYAN}"
    echo "╔═══════════════════════════════════════╗"
    echo "║     🏁 PitWall - Complete Startup     ║"
    echo "╚═══════════════════════════════════════╝"
    echo -e "${NC}"
    
    check_requirements
    cleanup_old_postgres
    setup_backend
    setup_frontend
    start_backend_docker
    show_urls
    show_docker_logs
    
    print_header "WAITING FOR YOUR INPUT"
    echo -e "${BLUE}→${NC} Backend is running in Docker"
    echo -e "${YELLOW}→${NC} Open a NEW terminal window and start frontend with:"
    echo ""
    echo -e "    ${CYAN}cd $FRONTEND_DIR && npm run web${NC}"
    echo ""
    echo -e "${GREEN}→${NC} Then open http://localhost:5173 to test the app"
    echo ""
    
    # Keep the script running to show docker logs
    cd "$BACKEND_DIR"
    print_step "Showing backend logs (Ctrl+C to stop)...\n"
    docker compose logs -f
}

# Run main
main
