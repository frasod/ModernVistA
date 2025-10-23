#!/bin/bash
# Nuclear restart - kill everything, verify, restart from scratch
set -e

echo "🔥 NUCLEAR RESTART 🔥"
echo ""

cd "$(dirname "${BASH_SOURCE[0]}")/.."

echo "1️⃣ Killing ALL node/vite processes..."
pkill -9 node 2>/dev/null || true
pkill -9 ts-node 2>/dev/null || true
pkill -9 vite 2>/dev/null || true
sleep 3

echo ""
echo "2️⃣ Verifying ports are free..."
for port in 3000 3001; do
  if lsof -ti :$port >/dev/null 2>&1; then
    echo "  ⚠️  Port $port still occupied, force killing..."
    lsof -ti :$port | xargs kill -9 2>/dev/null || true
  else
    echo "  ✅ Port $port free"
  fi
done

sleep 2

echo ""
echo "3️⃣ Port status:"
ss -tlnp 2>/dev/null | grep -E ':(3000|3001)' || echo "  ✅ All clear"

echo ""
echo "4️⃣ Starting backend on 3001..."
cd backend
PORT=3001 npm run dev > ../logs/nuclear-backend.log 2>&1 &
BACKEND_PID=$!
echo "  Backend PID: $BACKEND_PID"

sleep 5

if curl -s http://localhost:3001/health >/dev/null 2>&1; then
  echo "  ✅ Backend healthy"
else
  echo "  ❌ Backend failed!"
  tail -20 ../logs/nuclear-backend.log
  exit 1
fi

echo ""
echo "5️⃣ Starting frontend on 3000..."
cd ../frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "  ⚠️  node_modules missing, running npm install..."
  npm install
fi

# Start with explicit logging
npm run dev > ../logs/nuclear-frontend.log 2>&1 &
FRONTEND_PID=$!
echo "  Frontend PID: $FRONTEND_PID"

echo ""
echo "6️⃣ Waiting for frontend (15 seconds)..."
for i in {1..15}; do
  sleep 1
  echo -n "."
  
  # Check if process died
  if ! ps -p $FRONTEND_PID >/dev/null 2>&1; then
    echo ""
    echo "  ❌ Frontend process died!"
    echo ""
    echo "Last 30 lines of log:"
    tail -30 ../logs/nuclear-frontend.log
    exit 1
  fi
  
  # Check if responding
  if curl -s http://localhost:3000/ >/dev/null 2>&1; then
    echo ""
    echo "  ✅ Frontend responding!"
    echo ""
    echo "========================================="
    echo "✅ SUCCESS!"
    echo ""
    echo "  Backend:  http://localhost:3001"
    echo "  Frontend: http://localhost:3000"
    echo ""
    echo "Logs:"
    echo "  tail -f logs/nuclear-backend.log"
    echo "  tail -f logs/nuclear-frontend.log"
    echo "========================================="
    exit 0
  fi
done

echo ""
echo "⚠️  Frontend not responding after 15s"
echo ""
echo "Process check:"
if ps -p $FRONTEND_PID >/dev/null 2>&1; then
  echo "  Process still running (PID $FRONTEND_PID)"
  echo "  Might need more time, or check logs:"
else
  echo "  ❌ Process died"
fi

echo ""
echo "Last 50 lines of frontend log:"
tail -50 ../logs/nuclear-frontend.log

echo ""
echo "Port status:"
ss -tlnp 2>/dev/null | grep -E ':(3000|3001)'
