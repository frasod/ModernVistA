#!/bin/bash
# Quick Azure VistA connectivity test

echo "=== Testing Azure VistA ==="
AZURE_HOST="vista-demo-frasod-832.eastus.azurecontainer.io"

echo ""
echo "1. DNS Resolution:"
nslookup $AZURE_HOST || echo "❌ DNS FAILED"

echo ""
echo "2. Ping test:"
ping -c 2 $AZURE_HOST || echo "❌ PING FAILED"

echo ""
echo "3. Port 9430 (RPC) test:"
timeout 5 bash -c "cat < /dev/null > /dev/tcp/$AZURE_HOST/9430" 2>/dev/null && echo "✅ Port 9430 OPEN" || echo "❌ Port 9430 UNREACHABLE"

echo ""
echo "4. Check backend .env:"
grep VISTA_HOST "/media/frasod/4T NVMe/ModernVista/backend/.env" 2>/dev/null || echo "No .env file"
