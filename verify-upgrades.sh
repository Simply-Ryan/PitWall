#!/bin/bash

# PitWall Dependency Upgrade Verification Script
# Run this to verify all upgrades are complete

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║   PitWall Dependency Upgrade - Verification Script         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ISSUES=0

# Check Backend Package.json
echo -e "${BLUE}[1] Checking Backend Dependencies...${NC}"
cd backend 2>/dev/null || { echo -e "${RED}❌ Cannot find backend folder${NC}"; ISSUES=$((ISSUES+1)); }

if grep -q '"@prisma/client": "\^7.7.0"' package.json; then
    echo -e "${GREEN}✅ Prisma: ^7.7.0${NC}"
else
    echo -e "${RED}❌ Prisma: Not updated to ^7.7.0${NC}"
    ISSUES=$((ISSUES+1))
fi

if grep -q '"eslint": "\^9.0.0"' package.json; then
    echo -e "${GREEN}✅ ESLint: ^9.0.0${NC}"
else
    echo -e "${RED}❌ ESLint: Not updated to ^9.0.0${NC}"
    ISSUES=$((ISSUES+1))
fi

if grep -q '"supertest": "\^7.1.3"' package.json; then
    echo -e "${GREEN}✅ supertest: ^7.1.3${NC}"
else
    echo -e "${RED}⚠️  supertest: May need update${NC}"
fi

echo ""

# Check Frontend Package.json
echo -e "${BLUE}[2] Checking Frontend Dependencies...${NC}"
cd ../frontend 2>/dev/null || { echo -e "${RED}❌ Cannot find frontend folder${NC}"; ISSUES=$((ISSUES+1)); }

if grep -q '"react-native": "\^0.72.10"' package.json; then
    echo -e "${GREEN}✅ react-native: ^0.72.10${NC}"
else
    echo -e "${RED}❌ react-native: Not updated to ^0.72.10${NC}"
    ISSUES=$((ISSUES+1))
fi

if grep -q '"react-native-web": "~0.19.6"' package.json; then
    echo -e "${GREEN}✅ react-native-web: ~0.19.6${NC}"
else
    echo -e "${RED}❌ react-native-web: Not updated to ~0.19.6${NC}"
    ISSUES=$((ISSUES+1))
fi

if grep -q '"expo-constants": "~14.4.2"' package.json; then
    echo -e "${GREEN}✅ expo-constants: ~14.4.2${NC}"
else
    echo -e "${RED}❌ expo-constants: Not updated to ~14.4.2${NC}"
    ISSUES=$((ISSUES+1))
fi

if grep -q '"react-native-screens": "~3.22.0"' package.json; then
    echo -e "${GREEN}✅ react-native-screens: ~3.22.0${NC}"
else
    echo -e "${RED}❌ react-native-screens: Not updated to ~3.22.0${NC}"
    ISSUES=$((ISSUES+1))
fi

if grep -q '"react-native-safe-area-context": "4.6.3"' package.json; then
    echo -e "${GREEN}✅ react-native-safe-area-context: 4.6.3${NC}"
else
    echo -e "${RED}❌ react-native-safe-area-context: Not updated to 4.6.3${NC}"
    ISSUES=$((ISSUES+1))
fi

echo ""

# Check Frontend Assets
echo -e "${BLUE}[3] Checking Frontend Assets...${NC}"
if [ -f "assets/icon.png" ]; then
    echo -e "${GREEN}✅ assets/icon.png${NC}"
else
    echo -e "${RED}❌ assets/icon.png: Missing${NC}"
    ISSUES=$((ISSUES+1))
fi

if [ -f "assets/splash.png" ]; then
    echo -e "${GREEN}✅ assets/splash.png${NC}"
else
    echo -e "${RED}❌ assets/splash.png: Missing${NC}"
    ISSUES=$((ISSUES+1))
fi

if [ -f "assets/adaptive-icon.png" ]; then
    echo -e "${GREEN}✅ assets/adaptive-icon.png${NC}"
else
    echo -e "${RED}❌ assets/adaptive-icon.png: Missing${NC}"
    ISSUES=$((ISSUES+1))
fi

if [ -f "assets/favicon.png" ]; then
    echo -e "${GREEN}✅ assets/favicon.png${NC}"
else
    echo -e "${RED}❌ assets/favicon.png: Missing${NC}"
    ISSUES=$((ISSUES+1))
fi

echo ""

# Check postinstall script
echo -e "${BLUE}[4] Checking Frontend Build Configuration...${NC}"
if grep -q '"postinstall": "node generate-assets.js"' package.json; then
    echo -e "${GREEN}✅ Postinstall hook configured${NC}"
else
    echo -e "${RED}❌ Postinstall hook not configured${NC}"
    ISSUES=$((ISSUES+1))
fi

if [ -f "generate-assets.js" ]; then
    echo -e "${GREEN}✅ generate-assets.js exists${NC}"
else
    echo -e "${RED}❌ generate-assets.js missing${NC}"
    ISSUES=$((ISSUES+1))
fi

echo ""

# Check for node_modules
echo -e "${BLUE}[5] Checking Installation Status...${NC}"
if [ -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  frontend/node_modules exists (reinstall needed for new versions)${NC}"
else
    echo -e "${GREEN}✅ Ready for fresh npm install${NC}"
fi

cd ../backend 2>/dev/null
if [ -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  backend/node_modules exists (reinstall needed for new versions)${NC}"
else
    echo -e "${GREEN}✅ Ready for fresh npm install${NC}"
fi

echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════╗"
if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}║ ✅ All upgrades verified successfully!                  ║${NC}"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Clean install: cd backend && rm -rf node_modules && npm install"
    echo "2. Clean install: cd frontend && rm -rf node_modules && npm install --legacy-peer-deps"
    echo "3. Start backend: cd backend && npm run dev"
    echo "4. Start frontend: cd frontend && npm run web"
else
    echo -e "${RED}║ ❌ Found ${ISSUES} issue(s) that need fixing                ║${NC}"
    echo "╚════════════════════════════════════════════════════════════╝"
    exit 1
fi

echo ""
