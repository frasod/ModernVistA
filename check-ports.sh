#!/bin/bash
# Quick check what's on each port right now

echo "=== What's listening on 3000 and 3001 ==="
echo ""

for port in 3000 3001; do
  echo "Port $port:"
  PID=$(lsof -ti :$port 2>/dev/null | head -1)
  if [ -n "$PID" ]; then
    echo "  PID: $PID"
    echo "  Command: $(ps -p $PID -o cmd= | head -c 200)"
    echo "  HTTP test:"
    curl -I -s -m 2 http://localhost:$port/ 2>&1 | head -5 | sed 's/^/    /'
  else
    echo "  Nothing listening"
  fi
  echo ""
done

echo "=== Quick status ==="
curl -s http://localhost:3001/health 2>&1 | head -c 100
echo ""
echo ""
echo "Port 3000 response:"
curl -s http://localhost:3000/ 2>&1 | head -c 200
