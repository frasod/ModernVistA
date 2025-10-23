#!/bin/bash
# The ULTIMATE ModernVista Launcher
# One script to rule them all!

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

clear

cat << "EOF"
╔═════════════════════════════════════════════════════════════════╗
║                                                                 ║
║    ███╗   ███╗ ██████╗ ██████╗ ███████╗██████╗ ███╗   ██╗     ║
║    ████╗ ████║██╔═══██╗██╔══██╗██╔════╝██╔══██╗████╗  ██║     ║
║    ██╔████╔██║██║   ██║██║  ██║█████╗  ██████╔╝██╔██╗ ██║     ║
║    ██║╚██╔╝██║██║   ██║██║  ██║██╔══╝  ██╔══██╗██║╚██╗██║     ║
║    ██║ ╚═╝ ██║╚██████╔╝██████╔╝███████╗██║  ██║██║ ╚████║     ║
║    ╚═╝     ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝     ║
║                                                                 ║
║    ██╗   ██╗██╗███████╗████████╗ █████╗                        ║
║    ██║   ██║██║██╔════╝╚══██╔══╝██╔══██╗                       ║
║    ██║   ██║██║███████╗   ██║   ███████║                       ║
║    ╚██╗ ██╔╝██║╚════██║   ██║   ██╔══██║                       ║
║     ╚████╔╝ ██║███████║   ██║   ██║  ██║                       ║
║      ╚═══╝  ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝                       ║
║                                                                 ║
║              Modern Interface for Your VistA System            ║
║              Connected to Azure Container Instance             ║
║                                                                 ║
╚═════════════════════════════════════════════════════════════════╝
EOF

echo ""
echo -e "${CYAN}${BOLD}Azure VistA Instance:${NC}"
echo -e "  Host: ${GREEN}vista-demo-frasod-832.eastus.azurecontainer.io${NC}"
echo -e "  Port: ${GREEN}9430${NC}"
echo ""

# Make all launch scripts executable
chmod +x GO.sh go.sh launch-azure.sh start-modernvista.sh test-azure-vista.sh 2>/dev/null

# Check if first time setup
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}${BOLD}⚠️  First Time Setup Required${NC}"
    echo ""
    cp backend/.env.example backend/.env
    echo -e "${BLUE}Created:${NC} backend/.env"
    echo ""
    echo -e "${MAGENTA}${BOLD}📝 Please edit backend/.env and add your credentials:${NC}"
    echo ""
    echo -e "${CYAN}Required settings:${NC}"
    echo -e "  ${GREEN}VISTA_HOST${NC}=vista-demo-frasod-832.eastus.azurecontainer.io"
    echo -e "  ${GREEN}VISTA_ACCESS_CODE${NC}=<your-access-code>"
    echo -e "  ${GREEN}VISTA_VERIFY_CODE${NC}=<your-verify-code>"
    echo ""
    echo -e "${BLUE}Quick edit command:${NC}"
    echo -e "  ${YELLOW}nano backend/.env${NC}"
    echo ""
    echo -e "${BLUE}Then run this script again:${NC}"
    echo -e "  ${GREEN}./RUN.sh${NC}"
    echo ""
    exit 0
fi

# Test Azure connection
echo -e "${BLUE}${BOLD}[1/5]${NC} Testing Azure VistA connection..."
AZURE_HOST="vista-demo-frasod-832.eastus.azurecontainer.io"
if timeout 5 bash -c "echo > /dev/tcp/$AZURE_HOST/9430" 2>/dev/null; then
    echo -e "${GREEN}✅ Azure VistA is reachable!${NC}"
else
    echo -e "${RED}❌ Cannot connect to Azure VistA${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  • Check if container is running in Azure Portal"
    echo "  • Run detailed test: ${YELLOW}./test-azure-vista.sh${NC}"
    echo "  • Verify network/firewall allows port 9430"
    echo ""
    exit 1
fi

# Check configuration
echo -e "${BLUE}${BOLD}[2/5]${NC} Verifying configuration..."
if grep -q "vista-demo-frasod-832" backend/.env 2>/dev/null; then
    echo -e "${GREEN}✅ Configured for Azure${NC}"
else
    echo -e "${YELLOW}⚠️  VISTA_HOST may not be set to Azure endpoint${NC}"
    echo "Expected: vista-demo-frasod-832.eastus.azurecontainer.io"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check credentials
if ! grep -q "^VISTA_ACCESS_CODE=." backend/.env 2>/dev/null || grep -q "^VISTA_ACCESS_CODE=$" backend/.env; then
    echo -e "${RED}❌ VISTA_ACCESS_CODE not configured${NC}"
    echo "Please edit backend/.env and add your credentials"
    exit 1
fi

echo -e "${GREEN}✅ Credentials configured${NC}"

# Install dependencies
echo -e "${BLUE}${BOLD}[3/5]${NC} Checking dependencies..."
NEED_INSTALL=0

if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    cd backend && npm install > /dev/null 2>&1 && cd ..
    NEED_INSTALL=1
fi

if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    cd frontend && npm install > /dev/null 2>&1 && cd ..
    NEED_INSTALL=1
fi

if [ $NEED_INSTALL -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
else
    echo -e "${GREEN}✅ Dependencies installed${NC}"
fi

# Create logs directory
mkdir -p logs

# Launch
echo -e "${BLUE}${BOLD}[4/5]${NC} Starting services..."
echo ""

cat << "EOF"
    ╔═══════════════════════════════════════════════════╗
    ║                                                   ║
    ║              🚀  LAUNCHING MODERNVISTA  🚀        ║
    ║                                                   ║
    ╚═══════════════════════════════════════════════════╝
EOF

echo ""
echo -e "${CYAN}Starting backend and frontend...${NC}"
echo -e "${YELLOW}This may take 10-30 seconds for first startup${NC}"
echo ""

# Execute the main startup script
echo -e "${BLUE}${BOLD}[5/5]${NC} Launching..."
echo ""

exec ./start-modernvista.sh
