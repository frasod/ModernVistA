#!/bin/bash
# Diagnose port 3000 issue

echo "=== What's on port 3000 ==="
lsof -i :3000

echo ""
echo "=== HTTP test ==="
curl -v http://localhost:3000/ 2>&1 | head -30

echo ""
echo "=== Frontend log ==="
tail -50 "/media/frasod/4T NVMe/ModernVista/logs/final-frontend.log"
