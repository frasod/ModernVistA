#!/bin/bash
# Idempotent backend/.env generator for ModernVista (Azure-friendly)
# Usage: ./scripts/create-backend-env.sh

set -e
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
BACKEND_ENV="$ROOT_DIR/backend/.env"
TEMPLATE="$ROOT_DIR/backend/.env.example"

if [ -f "$BACKEND_ENV" ]; then
  echo "✅ backend/.env already exists. No changes made."
  exit 0
fi

if [ ! -f "$TEMPLATE" ]; then
  echo "❌ Missing template: $TEMPLATE" >&2
  exit 1
fi

cp "$TEMPLATE" "$BACKEND_ENV"

# Inline edit for Azure host placeholder (do not touch codes)
sed -i.bak "s|^VISTA_HOST=localhost|VISTA_HOST=vista-demo-frasod-832.eastus.azurecontainer.io|" "$BACKEND_ENV"
rm -f "$BACKEND_ENV.bak"

cat <<'NOTE'
📄 Created backend/.env with Azure host pre-set.
Next steps:
  1. Edit backend/.env and set:
       VISTA_ACCESS_CODE=your-access-code
       VISTA_VERIFY_CODE=your-verify-code
  2. (Optional) Enable experimental broker flags:
       VISTA_BROKER_EXPERIMENTAL=true
       VISTA_CONTEXT="OR CPRS GUI CHART"
  3. Launch:
       ./GO.sh  (or)  ./RUN.sh
NOTE
