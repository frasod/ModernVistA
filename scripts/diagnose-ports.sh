#!/bin/bash
# Quick diagnostic for ModernVista port issues
# Usage: bash scripts/diagnose-ports.sh

echo "=== Port Status ==="
echo ""

echo "Backend (should be 3001):"
ss -tlnp 2>/dev/null | grep :3001 || echo "  ❌ Nothing on 3001"

echo ""
echo "Frontend (should be 3000):"
ss -tlnp 2>/dev/null | grep :3000 || echo "  ❌ Nothing on 3000"

echo ""
echo "Preview (4173, fallback):"
ss -tlnp 2>/dev/null | grep :4173 || echo "  (none)"

echo ""
echo "=== What's on 3000 ==="
if ss -tlnp 2>/dev/null | grep -q :3000; then
  PID=$(ss -tlnp 2>/dev/null | grep :3000 | grep -o 'pid=[0-9]*' | head -1 | cut -d= -f2)
  if [ -n "$PID" ]; then
    echo "Process: $(ps -p $PID -o comm=) (PID $PID)"
    echo "Command: $(ps -p $PID -o cmd= | head -c 100)"
  fi
fi

echo ""
echo "=== Quick HTTP Tests ==="
echo "Backend root:"
curl -s -m 2 -H "Accept: application/json" http://localhost:3001/ 2>&1 | head -c 150 || echo "Failed"

echo ""
echo ""
echo "Backend health:"
curl -s -m 2 http://localhost:3001/health 2>&1 | head -c 150 || echo "Failed"

echo ""
echo ""
echo "Frontend root (headers only):"
curl -I -s -m 2 http://localhost:3000/ 2>&1 | head -8

echo ""
echo "=== Recommendations ==="
if ! ss -tlnp 2>/dev/null | grep -q :3001; then
  echo "❌ Backend not running. Start: cd backend && npm run dev"
fi

if ss -tlnp 2>/dev/null | grep -q :3000; then
  curl -I -s -m 2 http://localhost:3000/ 2>&1 | grep -q "X-Powered-By: Express" && {
    echo "⚠️  Port 3000 has an Express server (likely backend misconfigured or old process)"
    echo "   Kill it: pkill -f 'node.*3000' or lsof -ti :3000 | xargs kill"
  }
  curl -I -s -m 2 http://localhost:3000/ 2>&1 | grep -q "404" && {
    echo "⚠️  Port 3000 returning 404. Likely stale process or failed Vite."
    echo "   Kill & restart: pkill -f vite; cd frontend && npm run dev"
  }
else
  echo "❌ Frontend not running. Start: cd frontend && npm run dev"
fi

echo ""
echo "Quick fix: bash scripts/clean-start.sh"
