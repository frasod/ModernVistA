#!/bin/bash

# Quick VistA RPC Test Runner
# Tests the real VistA integration against existing Docker container

echo "🧪 Testing VistA RPC Integration"
echo "==============================="
echo

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run from backend directory:"
    echo "   cd /media/frasod/4T\ NVMe/ModernVista/backend"
    echo "   ./quick-test.sh"
    exit 1
fi

echo "🔍 Running VistA Docker integration test..."
node test-vista-docker.js

echo
echo "🧪 Running detailed RPC connection test..."
node test-vista-connection.js

echo
echo "✅ Tests complete! If successful, you can now:"
echo "   npm run dev    # Start backend with real VistA data"