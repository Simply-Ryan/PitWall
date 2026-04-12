#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting PitWall App...${NC}\n"

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "Need to navigate to backend directory..."
    cd backend || exit 1
fi

echo -e "${YELLOW}📦 Starting Docker Compose (Database + API)...${NC}"
docker compose up --build

echo -e "${GREEN}✅ Backend running!${NC}"
echo -e "${YELLOW}Next: In a new terminal, run:${NC}"
echo -e "${BLUE}cd frontend && npm install --legacy-peer-deps && npm run web${NC}\n"
echo -e "${YELLOW}Then open: http://localhost:5173${NC}"
