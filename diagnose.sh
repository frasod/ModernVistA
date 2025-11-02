#!/bin/bash
# Quick diagnostic to see what's wrong

echo "=== What's on the ports? ==="
lsof -i :3001 2>/dev/null || echo "Nothing on 3001"
echo ""
lsof -i :5173 2>/dev/null || echo "Nothing on 5173"

echo ""
echo "=== HTTP Tests ==="
echo "Backend (3001):"
curl -s -m 2 http://localhost:3001/health 2>&1 | head -c 100 || echo "FAILED"

echo ""
echo ""
echo "Frontend (5173):"
curl -I -s -m 2 http://localhost:5173/ 2>&1 | head -5 || echo "FAILED"

echo ""
echo "=== Running node processes ==="
ps aux | grep -E 'npm|node|vite' | grep -v grep | head -10

echo ""
echo "=== Backend log check ==="
if [ -f "/media/frasod/4T NVMe/ModernVista/logs/backend.log" ]; then
  tail -20 "/media/frasod/4T NVMe/ModernVista/logs/backend.log"
else
  echo "No backend log found"
fi

echo ""
echo "=== Frontend log check ==="
if [ -f "/media/frasod/4T NVMe/ModernVista/logs/frontend.log" ]; then
  tail -20 "/media/frasod/4T NVMe/ModernVista/logs/frontend.log"
else
  echo "No frontend log found"
fi
