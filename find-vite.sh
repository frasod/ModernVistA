#!/bin/bash
# Find where Vite actually is

echo "=== All listening ports ==="
ss -tlnp 2>/dev/null | grep -E 'node|vite' | grep LISTEN

echo ""
echo "=== All node processes ==="
ps aux | grep -E 'node|vite|ts-node' | grep -v grep

echo ""
echo "=== Testing common Vite ports ==="
for port in 3000 3001 5173 4173; do
  echo "Port $port:"
  if curl -s -m 1 http://localhost:$port/ 2>&1 | grep -q "html\|vite\|<!DOCTYPE"; then
    echo "  ✅ Responding with HTML"
    curl -I -s http://localhost:$port/ 2>&1 | head -3
  else
    echo "  ❌ Not responding or not HTML"
  fi
done
