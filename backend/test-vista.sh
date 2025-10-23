#!/bin/bash

# ModernVista VistA RPC Test Script
# Tests the real VistA integration

set -e  # Exit on any error

echo "🔧 ModernVista VistA RPC Integration Test"
echo "======================================="
echo

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the backend directory"
    echo "   cd backend && ./test-vista.sh"
    exit 1
fi

# Check if .env file exists
if [ ! -f "../.env" ]; then
    echo "⚠️  No .env file found. Creating from example..."
    if [ -f "../.env.example" ]; then
        cp "../.env.example" "../.env"
        echo "✅ Created .env from example"
        echo "📝 Please edit .env with your VistA connection details:"
        echo "   - VISTA_HOST (your VistA server)"
        echo "   - VISTA_PORT (usually 9430)"  
        echo "   - VISTA_ACCESS_CODE (your access code)"
        echo "   - VISTA_VERIFY_CODE (your verify code)"
        echo
        echo "Press Enter when ready to continue..."
        read -r
    else
        echo "❌ No .env.example found. Please create .env manually."
        exit 1
    fi
fi

echo "1️⃣  Installing dependencies..."
npm install --silent

echo "2️⃣  Checking TypeScript compilation..."
npm run build --silent

echo "3️⃣  Testing VistA RPC connection..."
echo "   (This will test real RPC calls to your VistA instance)"
echo
node test-vista-connection.js

echo
echo "4️⃣  Starting backend server..."
echo "   Backend will be available at: http://localhost:3001"
echo "   Health check: http://localhost:3001/api/v1/health"
echo "   Patient search: http://localhost:3001/api/v1/patients-search?q=DOE"
echo
echo "   Press Ctrl+C to stop the server"
echo

npm run dev