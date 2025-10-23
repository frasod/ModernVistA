#!/bin/bash
# Force restart frontend with detailed logging
set -e

cd "$(dirname "${BASH_SOURCE[0]}")/.."

echo "🧹 Killing old frontend processes..."
pkill -f "vite.*frontend" 2>/dev/null || true
pkill -f "npm run dev.*frontend" 2>/dev/null || true

# Kill anything on port 3000
PID=$(lsof -ti :3000 2>/dev/null || true)
if [ -n "$PID" ]; then
  echo "  Killing PID $PID on port 3000"
  kill -9 $PID 2>/dev/null || true
fi

sleep 2

echo "✅ Port 3000 cleared"
echo ""

# Check what's listening now
echo "📊 Port check before start:"
ss -tlnp 2>/dev/null | grep :3000 || echo "  Port 3000 is free ✓"

echo ""
echo "🎨 Starting frontend with verbose output..."
cd frontend

# Start in foreground to see immediate errors
npm run dev 2>&1 | tee ../logs/frontend-verbose.log &
FRONTEND_PID=$!

echo "  Frontend PID: $FRONTEND_PID"
echo ""
echo "⏳ Waiting 10s for Vite to start..."

for i in {1..10}; do
  sleep 1
  if curl -s -m 1 http://localhost:3000/ >/dev/null 2>&1; then
    echo ""
    echo "✅ Frontend is responding!"
    echo ""
    echo "🌐 Open: http://localhost:3000"
    echo "📋 Logs: tail -f logs/frontend-verbose.log"
    exit 0
  fi
  echo -n "."
done

echo ""
echo "⚠️  Frontend not responding after 10s"
echo ""
echo "Check logs for errors:"
echo "  tail -20 logs/frontend-verbose.log"
echo ""
echo "Process status:"
if ps -p $FRONTEND_PID >/dev/null 2>&1; then
  echo "  ✓ Process still running (may need more time)"
else
  echo "  ✗ Process died. Check logs for error."
fi
