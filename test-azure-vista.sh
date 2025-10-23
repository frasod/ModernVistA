#!/bin/bash
# Test Azure VistA Connection
# Usage: ./test-azure-vista.sh

set -e

AZURE_HOST="vista-demo-frasod-832.eastus.azurecontainer.io"
RPC_PORT="9430"
GUI_PORT="8089"

echo "=========================================="
echo "🧪 Testing Azure VistA Connection"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: DNS Resolution
echo "1️⃣  Testing DNS resolution..."
if host "$AZURE_HOST" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ DNS resolved successfully${NC}"
    host "$AZURE_HOST" | head -1
else
    echo -e "${RED}❌ DNS resolution failed${NC}"
    echo "Host may be down or unreachable"
    exit 1
fi
echo ""

# Test 2: Ping (may fail if ICMP blocked - that's OK)
echo "2️⃣  Testing ICMP ping..."
if ping -c 2 -W 2 "$AZURE_HOST" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Host responds to ping${NC}"
else
    echo -e "${YELLOW}⚠️  No ping response (may be blocked by firewall - OK)${NC}"
fi
echo ""

# Test 3: RPC Broker Port (9430)
echo "3️⃣  Testing RPC Broker port ($RPC_PORT)..."
if timeout 5 bash -c "echo > /dev/tcp/$AZURE_HOST/$RPC_PORT" 2>/dev/null; then
    echo -e "${GREEN}✅ RPC Broker port $RPC_PORT is OPEN${NC}"
    echo "   ModernVista can connect to VistA!"
else
    echo -e "${RED}❌ RPC Broker port $RPC_PORT is CLOSED or FILTERED${NC}"
    echo "   Check Azure NSG rules or container status"
fi
echo ""

# Test 4: YottaDB GUI Port (8089)
echo "4️⃣  Testing YottaDB GUI port ($GUI_PORT)..."
if timeout 5 bash -c "echo > /dev/tcp/$AZURE_HOST/$GUI_PORT" 2>/dev/null; then
    echo -e "${GREEN}✅ YottaDB GUI port $GUI_PORT is OPEN${NC}"
    echo "   Access at: http://$AZURE_HOST:$GUI_PORT"
else
    echo -e "${YELLOW}⚠️  YottaDB GUI port $GUI_PORT not responding${NC}"
    echo "   (Optional service - not required for ModernVista)"
fi
echo ""

# Test 5: HTTP connectivity to GUI (if port open)
echo "5️⃣  Testing HTTP connectivity..."
if curl -s -m 5 "http://$AZURE_HOST:$GUI_PORT" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ HTTP connection successful${NC}"
else
    echo -e "${YELLOW}⚠️  HTTP not responding (may need credentials)${NC}"
fi
echo ""

# Test 6: Check backend .env configuration
echo "6️⃣  Checking backend configuration..."
BACKEND_ENV="backend/.env"
if [ -f "$BACKEND_ENV" ]; then
    echo -e "${GREEN}✅ Backend .env file exists${NC}"
    
    # Check if VISTA_HOST is configured
    if grep -q "^VISTA_HOST=$AZURE_HOST" "$BACKEND_ENV" 2>/dev/null; then
        echo -e "${GREEN}   ✓ VISTA_HOST correctly set to Azure${NC}"
    elif grep -q "^VISTA_HOST=localhost" "$BACKEND_ENV" 2>/dev/null; then
        echo -e "${YELLOW}   ⚠️  VISTA_HOST still set to localhost${NC}"
        echo "      Update to: VISTA_HOST=$AZURE_HOST"
    else
        echo -e "${YELLOW}   ⚠️  VISTA_HOST not configured${NC}"
    fi
    
    # Check credentials
    if grep -q "^VISTA_ACCESS_CODE=$" "$BACKEND_ENV" 2>/dev/null || \
       ! grep -q "^VISTA_ACCESS_CODE=" "$BACKEND_ENV" 2>/dev/null; then
        echo -e "${YELLOW}   ⚠️  VISTA_ACCESS_CODE not set${NC}"
    else
        echo -e "${GREEN}   ✓ VISTA_ACCESS_CODE configured${NC}"
    fi
    
    if grep -q "^VISTA_VERIFY_CODE=$" "$BACKEND_ENV" 2>/dev/null || \
       ! grep -q "^VISTA_VERIFY_CODE=" "$BACKEND_ENV" 2>/dev/null; then
        echo -e "${YELLOW}   ⚠️  VISTA_VERIFY_CODE not set${NC}"
    else
        echo -e "${GREEN}   ✓ VISTA_VERIFY_CODE configured${NC}"
    fi
else
    echo -e "${RED}❌ Backend .env file not found${NC}"
    echo "   Copy from: cp backend/.env.example backend/.env"
fi
echo ""

# Summary
echo "=========================================="
echo "📊 Summary"
echo "=========================================="
echo ""
echo "Azure VistA Host: $AZURE_HOST"
echo "RPC Broker Port: $RPC_PORT"
echo ""

# Check if critical tests passed
RPC_PASS=0
if timeout 5 bash -c "echo > /dev/tcp/$AZURE_HOST/$RPC_PORT" 2>/dev/null; then
    RPC_PASS=1
fi

if [ $RPC_PASS -eq 1 ] && [ -f "$BACKEND_ENV" ]; then
    echo -e "${GREEN}✅ READY TO USE${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Update credentials in backend/.env (if not done)"
    echo "  2. cd backend && npm run dev"
    echo "  3. cd frontend && npm run dev"
    echo "  4. Open http://localhost:3000"
elif [ $RPC_PASS -eq 1 ]; then
    echo -e "${YELLOW}⚠️  PARTIALLY READY${NC}"
    echo ""
    echo "Network OK, but configuration needed:"
    echo "  1. cp backend/.env.example backend/.env"
    echo "  2. Edit backend/.env with Azure credentials"
elif [ -f "$BACKEND_ENV" ]; then
    echo -e "${RED}❌ NETWORK ISSUE${NC}"
    echo ""
    echo "Configuration OK, but can't reach Azure VistA"
    echo "Possible causes:"
    echo "  • Container not running (check Azure portal)"
    echo "  • NSG rules blocking port $RPC_PORT"
    echo "  • Container deleted (run deploy-azure-aci.sh)"
else
    echo -e "${RED}❌ NOT READY${NC}"
    echo ""
    echo "Multiple issues detected:"
    echo "  • Can't reach Azure VistA on port $RPC_PORT"
    echo "  • Missing backend/.env configuration"
fi

echo ""
echo "📚 Documentation: AZURE_VISTA_CONFIG.md"
echo ""
