#!/bin/bash
# ULTIMATE ONE-LINER - Just paste this and GO!
# Makes everything executable and launches

echo "🔧 Making scripts executable..."
chmod +x *.sh 2>/dev/null

echo "🚀 Launching ModernVista with Azure VistA..."
echo ""

if [ ! -f "backend/.env" ]; then
    echo "📝 First time setup detected..."
    cp backend/.env.example backend/.env
    echo ""
    echo "⚠️  PLEASE EDIT: backend/.env"
    echo ""
    echo "Add your credentials:"
    echo "  VISTA_HOST=vista-demo-frasod-832.eastus.azurecontainer.io"
    echo "  VISTA_ACCESS_CODE=<your-code>"
    echo "  VISTA_VERIFY_CODE=<your-code>"
    echo ""
    echo "Then run: ./GO.sh (this script again)"
    exit 0
fi

# Launch!
exec ./go.sh
