#!/bin/bash
# Update Azure VistA hostname in backend/.env

echo "🔧 Updating Azure VistA hostname..."

ENV_FILE="/media/frasod/4T NVMe/ModernVista/backend/.env"

# Update hostname
sed -i 's/vista-demo-frasod-832\.eastus\.azurecontainer\.io/vista-demo-frasod-237.eastus.azurecontainer.io/' "$ENV_FILE"

# Ensure experimental mode is enabled (not mock)
if grep -q "VISTA_BROKER_EXPERIMENTAL" "$ENV_FILE"; then
  sed -i 's/VISTA_BROKER_EXPERIMENTAL=.*/VISTA_BROKER_EXPERIMENTAL=true/' "$ENV_FILE"
else
  echo "" >> "$ENV_FILE"
  echo "VISTA_BROKER_EXPERIMENTAL=true" >> "$ENV_FILE"
fi

echo "✅ Updated backend/.env"
echo ""
echo "New settings:"
grep -E "(VISTA_HOST|VISTA_BROKER_EXPERIMENTAL)" "$ENV_FILE"

echo ""
echo "📡 Testing new hostname..."
timeout 3 bash -c "cat < /dev/null > /dev/tcp/vista-demo-frasod-237.eastus.azurecontainer.io/9430" 2>/dev/null && \
  echo "✅ Port 9430 is OPEN" || \
  echo "⚠️  Port 9430 not responding"

echo ""
echo "✅ Done! Restart backend:"
echo "  cd backend && PORT=3001 npm run dev"
