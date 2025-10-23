#!/bin/bash
# Direct frontend test - see the actual error in real-time
set -e

cd "$(dirname "${BASH_SOURCE[0]}")/.."

echo "Killing port 3000..."
pkill -f "vite" 2>/dev/null || true
lsof -ti :3000 2>/dev/null | xargs kill -9 2>/dev/null || true

sleep 2

echo ""
echo "Starting frontend in foreground (you'll see all output)..."
echo ""

cd frontend
npm run dev
