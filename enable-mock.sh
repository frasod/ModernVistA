#!/bin/bash
# Enable mock mode for development

echo "📝 Enabling mock mode in backend/.env..."

ENV_FILE="/media/frasod/4T NVMe/ModernVista/backend/.env"

# Check if VISTA_BROKER_EXPERIMENTAL exists
if grep -q "VISTA_BROKER_EXPERIMENTAL" "$ENV_FILE"; then
  # Update existing line
  sed -i 's/VISTA_BROKER_EXPERIMENTAL=.*/VISTA_BROKER_EXPERIMENTAL=false/' "$ENV_FILE"
  echo "✅ Updated VISTA_BROKER_EXPERIMENTAL=false"
else
  # Add new line
  echo "" >> "$ENV_FILE"
  echo "# Mock mode (no real Azure VistA needed)" >> "$ENV_FILE"
  echo "VISTA_BROKER_EXPERIMENTAL=false" >> "$ENV_FILE"
  echo "✅ Added VISTA_BROKER_EXPERIMENTAL=false"
fi

echo ""
echo "📊 Current .env settings:"
grep -E "(VISTA_HOST|VISTA_BROKER_EXPERIMENTAL)" "$ENV_FILE"

echo ""
echo "✅ Mock mode enabled!"
echo ""
echo "Restart backend (Ctrl+C and run again):"
echo "  cd backend && PORT=3001 npm run dev"
echo ""
echo "The app will now use sample data instead of Azure VistA"
