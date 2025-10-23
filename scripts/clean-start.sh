#!/bin/bash
# Clean restart: kill everything, verify ports free, restart services
# Usage: bash scripts/clean-start.sh

set -e
cd "$(dirname "${BASH_SOURCE[0]}")/.."

echo "🧹 Cleaning up old processes..."

# Kill backend
pkill -f "ts-node.*src/index.ts" 2>/dev/null || true
pkill -f "nodemon.*backend" 2>/dev/null || true

# Kill frontend
pkill -f "vite.*frontend" 2>/dev/null || true
pkill -f "npm run dev.*frontend" 2>/dev/null || true

# Nuclear option for specific ports
for port in 3000 3001 4173; do
  PID=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$PID" ]; then
    echo "  Killing PID $PID on port $port"
    kill -9 $PID 2>/dev/null || true
  fi
done

sleep 2

echo "✅ Ports cleared"
echo ""
echo "📊 Port status:"
ss -tlnp 2>/dev/null | grep -E ':(3000|3001|4173) ' || echo "  All target ports free"

echo ""
echo "🚀 Starting backend..."
cd backend
npm run dev > ../logs/backend.clean.log 2>&1 &
BACKEND_PID=$!
echo "  Backend PID: $BACKEND_PID"

echo ""
echo "⏳ Waiting 5s for backend..."
sleep 5

if curl -s -m 2 http://localhost:3001/health >/dev/null 2>&1; then
  echo "✅ Backend healthy"
else
  echo "❌ Backend not responding. Check logs/backend.clean.log"
  exit 1
fi

echo ""
echo "🎨 Starting frontend..."
cd ../frontend
npm run dev > ../logs/frontend.clean.log 2>&1 &
FRONTEND_PID=$!
echo "  Frontend PID: $FRONTEND_PID"

echo ""
echo "⏳ Waiting 8s for frontend..."
sleep 8

if curl -I -s -m 2 http://localhost:3000/ 2>&1 | grep -q "200\|304"; then
  echo "✅ Frontend responding"
else
  echo "⚠️  Frontend not ready yet (may need more time)"
  echo "   Tail logs: tail -f logs/frontend.clean.log"
fi

echo ""
echo "========================================="
echo "✅ Services started"
echo ""
echo "  Backend:  http://localhost:3001/health"
echo "  Frontend: http://localhost:3000"
echo ""
echo "Logs:"
echo "  Backend:  logs/backend.clean.log"
echo "  Frontend: logs/frontend.clean.log"
echo ""
echo "Stop: pkill -f ts-node; pkill -f vite"
echo "========================================="
