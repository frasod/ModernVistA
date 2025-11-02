#!/bin/bash
# Check backend error details

echo "=== Backend Process Check ==="
ps aux | grep -E 'ts-node.*backend|nodemon.*backend' | grep -v grep

echo ""
echo "=== Try calling backend health ==="
curl -v http://localhost:3001/health 2>&1

echo ""
echo "=== Check backend .env exists ==="
ls -la "/media/frasod/4T NVMe/ModernVista/backend/.env" 2>&1

echo ""
echo "=== Check backend package.json ==="
cat "/media/frasod/4T NVMe/ModernVista/backend/package.json" | grep -A 3 '"dev"'

echo ""
echo "=== Check if backend started ==="
cat "/media/frasod/4T NVMe/ModernVista/logs/backend.log" 2>/dev/null | tail -30 || echo "No log file"
