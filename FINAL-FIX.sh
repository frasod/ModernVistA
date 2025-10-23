#!/bin/bash
# FINAL FIX - ensure correct ports
set -e

BASE_DIR="/media/frasod/4T NVMe/ModernVista"

echo "🔥 Killing ALL node processes..."
pkill -9 node 2>/dev/null || true
pkill -9 ts-node 2>/dev/null || true
sleep 3

echo ""
echo "✅ All processes killed"
echo ""

# Verify ports are free
echo "📊 Verifying ports are free..."
ss -tlnp 2>/dev/null | grep -E ':(3000|3001)' && {
  echo "⚠️  Ports still occupied. Force clearing..."
  lsof -ti :3000 2>/dev/null | xargs kill -9 2>/dev/null || true
  lsof -ti :3001 2>/dev/null | xargs kill -9 2>/dev/null || true
  sleep 2
} || echo "✅ Ports 3000 & 3001 are free"

echo ""
echo "🚀 Starting BACKEND on port 3001..."
cd "$BASE_DIR/backend"
PORT=3001 npm run dev > "$BASE_DIR/logs/final-backend.log" 2>&1 &
BACKEND_PID=$!
echo "  Backend PID: $BACKEND_PID"

# Wait for backend to be healthy
for i in {1..10}; do
  sleep 1
  if curl -s http://localhost:3001/health >/dev/null 2>&1; then
    echo "  ✅ Backend healthy on 3001"
    break
  fi
  if [ $i -eq 10 ]; then
    echo "  ❌ Backend failed to start!"
    tail -20 "$BASE_DIR/logs/final-backend.log"
    exit 1
  fi
done

echo ""
echo "🎨 Starting FRONTEND on port 3000..."
cd "$BASE_DIR/frontend"

# Ensure port 3000 is really free
if lsof -ti :3000 >/dev/null 2>&1; then
  echo "  Clearing port 3000 again..."
  lsof -ti :3000 | xargs kill -9 2>/dev/null || true
  sleep 1
fi

npm run dev > "$BASE_DIR/logs/final-frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "  Frontend PID: $FRONTEND_PID"

echo ""
echo "⏳ Waiting for frontend..."
for i in {1..15}; do
  sleep 1
  
  # Check if Vite is on the correct port
  if curl -s http://localhost:3000/ >/dev/null 2>&1; then
    echo ""
    echo "✅ Frontend is on port 3000!"
    break
  fi
  
  # Check if it went to wrong port
  if curl -s http://localhost:3001/ 2>&1 | grep -q "html"; then
    echo ""
    echo "❌ Frontend jumped to 3001 (backend port)!"
    echo "   Something is still holding 3000. Checking..."
    ss -tlnp | grep :3000
    exit 1
  fi
  
  if [ $i -eq 15 ]; then
    echo ""
    echo "⚠️  Frontend not responding after 15s"
  fi
done

echo ""
echo "========================================="
echo "✅ SERVICES RUNNING"
echo ""
echo "  Backend:  http://localhost:3001"
echo "  Frontend: http://localhost:3000"
echo ""
echo "Test:"
echo "  curl http://localhost:3001/health"
echo "  curl http://localhost:3000/"
echo ""
echo "Logs:"
echo "  tail -f $BASE_DIR/logs/final-backend.log"
echo "  tail -f $BASE_DIR/logs/final-frontend.log"
echo "========================================="
