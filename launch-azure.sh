#!/bin/bash
# Quick Launch for Azure VistA Configuration
# Tests connection first, then starts ModernVista

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

AZURE_HOST="vista-demo-frasod-832.eastus.azurecontainer.io"
RPC_PORT="9430"

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════╗"
echo "║       ModernVista + Azure VistA Quick Launch         ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Step 1: Quick connection test
echo -e "${BLUE}[1/4]${NC} Testing Azure VistA connection..."
if timeout 5 bash -c "echo > /dev/tcp/$AZURE_HOST/$RPC_PORT" 2>/dev/null; then
    echo -e "${GREEN}✅ Azure VistA is reachable on port $RPC_PORT${NC}"
else
    echo -e "${RED}❌ Cannot reach Azure VistA${NC}"
    echo ""
    echo "Possible issues:"
    echo "  • Container not running (check Azure portal)"
    echo "  • Network/firewall blocking port $RPC_PORT"
    echo ""
    echo "Run for detailed diagnostics: ${YELLOW}./test-azure-vista.sh${NC}"
    exit 1
fi

# Step 2: Check .env configuration
echo -e "${BLUE}[2/4]${NC} Checking backend configuration..."
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  Creating backend/.env from template${NC}"
    cp backend/.env.example backend/.env
    echo -e "${RED}❌ Please edit backend/.env and add your credentials:${NC}"
    echo "   • VISTA_HOST=$AZURE_HOST"
    echo "   • VISTA_ACCESS_CODE=<your-code>"
    echo "   • VISTA_VERIFY_CODE=<your-code>"
    echo ""
    echo "Then run: ${GREEN}./launch-azure.sh${NC}"
    exit 1
fi

# Quick check if Azure host is configured
if grep -q "^VISTA_HOST=$AZURE_HOST" backend/.env 2>/dev/null; then
    echo -e "${GREEN}✅ VISTA_HOST configured for Azure${NC}"
elif grep -q "^VISTA_HOST=localhost" backend/.env 2>/dev/null; then
    echo -e "${YELLOW}⚠️  VISTA_HOST still set to localhost${NC}"
    echo ""
    echo "Update backend/.env:"
    echo "  VISTA_HOST=$AZURE_HOST"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check credentials
if grep -q "^VISTA_ACCESS_CODE=$" backend/.env || ! grep -q "^VISTA_ACCESS_CODE=." backend/.env 2>/dev/null; then
    echo -e "${RED}❌ VISTA_ACCESS_CODE not set in backend/.env${NC}"
    echo "Please configure your credentials before launching."
    exit 1
fi

echo -e "${GREEN}✅ Configuration looks good${NC}"

# Step 3: Install dependencies if needed
echo -e "${BLUE}[3/4]${NC} Checking dependencies..."

if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    cd frontend && npm install && cd ..
fi

echo -e "${GREEN}✅ Dependencies ready${NC}"

# Step 4: Launch!
echo -e "${BLUE}[4/4]${NC} Starting ModernVista..."
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🚀 Launching ModernVista with Azure VistA!${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo "Frontend will open at: http://localhost:3000"
echo "Backend API:           http://localhost:3001"
echo "VistA Host:            $AZURE_HOST:$RPC_PORT"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Use the main startup script
exec ./start-modernvista.sh
