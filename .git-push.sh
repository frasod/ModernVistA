#!/bin/bash
# Quick git push script

cd "/media/frasod/4T NVMe/ModernVista"

echo "📝 Current changes:"
git status --short

echo ""
echo "➕ Adding all changes..."
git add -A

echo ""
echo "💾 Committing..."
git commit -m "Honor Van Curtis: Rename backend layer to VAN MDWS

- Updated README.md to call backend layer 'VAN MDWS' in honor of Van Curtis
- Added tribute section acknowledging his pioneering work in VistA web services
- Updated architecture comparisons to distinguish 'Original MDWS' from 'VAN MDWS'
- Enhanced error logging in patient-search endpoint
- Created smart launcher with Azure hostname validation
- Added diagnostic scripts for Azure VistA connectivity
- Fixed MDWS documentation to be technically accurate and respectful"

echo ""
echo "🚀 Pushing to GitHub..."
git push origin master

echo ""
echo "✅ Done! Check: https://github.com/frasod/ModernVistA"
