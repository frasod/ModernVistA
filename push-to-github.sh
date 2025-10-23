#!/bin/bash
# Push ModernVista to GitHub
set -e

cd "/media/frasod/4T NVMe/ModernVista"

echo "🔧 Initializing git repository..."
if [ ! -d .git ]; then
  git init
  echo "✅ Git repository initialized"
else
  echo "✅ Git repository already exists"
fi

echo ""
echo "🔧 Setting up GitHub remote..."
git remote add origin https://github.com/frasod/ModernVistA.git 2>/dev/null || \
  git remote set-url origin https://github.com/frasod/ModernVistA.git

echo ""
echo "📋 Current remotes:"
git remote -v

echo ""
echo "📦 Staging all files..."
git add .

echo ""
echo "📊 Git status:"
git status

echo ""
echo "💾 Creating commit..."
git commit -m "feat: Azure VistA integration success + port standardization

✅ Major Achievements:
- Successfully connected to Azure Container Instance VistA
- Real patient data flowing (verified with ORWPT LIST RPC)
- Frontend standardized to port 5173 (Vite default)
- Backend stable on port 3001
- Full RPC activity logging operational

🔧 Technical Changes:
- frontend/vite.config.ts: Changed port 3000 → 5173
- README.md: Updated Quick Start with new ports + Azure success
- QUICKSTART.md: Simplified launch guide
- docs/DEVELOPMENT_LOG.md: Added Oct 22 milestone entry

📝 Documentation:
- Comprehensive Azure setup guide (AZURE_VISTA_CONFIG.md)
- RPC implementation details (VISTA_RPC_IMPLEMENTATION.md)
- Quick start guides updated
- Development log with timestamps

🎯 Current Status:
- Backend: http://localhost:3001
- Frontend: http://localhost:5173
- Azure VistA: vista-demo-frasod-832.eastus.azurecontainer.io:9430
- Patient search with real data verified

🏗️ Architecture:
- React 18 + TypeScript + Vite 7
- Node.js + Express backend
- Direct VistA RPC protocol communication
- Real-time activity logging

📦 Project Structure:
- Complete frontend/backend separation
- Comprehensive test scripts
- Diagnostic tools included
- Azure deployment ready" || echo "Nothing to commit (already committed)"

echo ""
echo "🚀 Pushing to GitHub..."
git push -u origin master

echo ""
echo "========================================="
echo "✅ SUCCESS!"
echo ""
echo "Your repo is live at:"
echo "https://github.com/frasod/ModernVistA"
echo ""
echo "View files:"
echo "- README: https://github.com/frasod/ModernVistA/blob/master/README.md"
echo "- Quick Start: https://github.com/frasod/ModernVistA/blob/master/QUICKSTART.md"
echo "========================================="
