#!/bin/bash

echo "🔍 Checking VistA Docker Status"
echo "==============================="
echo

echo "1️⃣  All running containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo
echo "2️⃣  VistA-related containers (running and stopped):"
docker ps -a | grep -i "vista\|vehu\|worldvista" || echo "   No VistA containers found with common names"

echo
echo "3️⃣  All containers with 'v' in name:"
docker ps -a | grep -i "v" || echo "   No containers with 'v' in name"

echo
echo "4️⃣  Port mappings for running containers:"
docker ps --format "table {{.Names}}\t{{.Ports}}" | grep -E "(9430|8080|2222)" || echo "   No containers using VistA ports (9430, 8080, 2222)"

echo
echo "5️⃣  Testing VistA web interface:"
curl -s -I http://localhost:8080 | head -1 || echo "   No response on port 8080"

echo
echo "6️⃣  Testing VistA RPC port:"
timeout 3 bash -c 'echo > /dev/tcp/localhost/9430' 2>/dev/null && echo "   ✅ Port 9430 is open" || echo "   ❌ Port 9430 not accessible"

echo
echo "7️⃣  Network connections on VistA ports:"
netstat -tulpn 2>/dev/null | grep -E "(8080|9430|2222)" || echo "   No processes listening on VistA ports"

echo
echo "📋 Summary:"
echo "   If you see containers above, note the exact name and ports"
echo "   If port 9430 is open, VistA RPC should work"
echo "   If port 8080 responds, VistA web interface is running"