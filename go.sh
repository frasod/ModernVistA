#!/bin/bash
# ONE COMMAND TO RULE THEM ALL
# Tests connection + configures + launches ModernVista with Azure VistA

AZURE_HOST="vista-demo-frasod-832.eastus.azurecontainer.io"

# Make all scripts executable
chmod +x test-azure-vista.sh 2>/dev/null
chmod +x launch-azure.sh 2>/dev/null
chmod +x start-modernvista.sh 2>/dev/null

echo "🚀 ModernVista + Azure VistA - GOOOO!"
echo ""
echo "Testing connection to $AZURE_HOST..."
echo ""

# Quick port test
if timeout 3 bash -c "echo > /dev/tcp/$AZURE_HOST/9430" 2>/dev/null; then
    echo "✅ Azure VistA is UP!"
    echo ""
    
    # Check if configured
    if [ -f "backend/.env" ] && grep -q "vista-demo-frasod-832" backend/.env 2>/dev/null; then
        echo "✅ Already configured for Azure"
        echo ""
        echo "🎯 Launching ModernVista..."
        exec ./launch-azure.sh
    else
        echo "⚙️  Need to configure credentials first"
        echo ""
        echo "Edit backend/.env and set:"
        echo "  VISTA_HOST=$AZURE_HOST"
        echo "  VISTA_ACCESS_CODE=<your-code>"
        echo "  VISTA_VERIFY_CODE=<your-code>"
        echo ""
        echo "Then run: ./go.sh"
    fi
else
    echo "❌ Cannot reach Azure VistA"
    echo ""
    echo "Check if container is running or run detailed test:"
    echo "  ./test-azure-vista.sh"
fi
