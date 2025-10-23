#!/bin/bash
# Convenience wrapper to run the root Azure VistA connection test from inside frontend/
# Usage: ./test-azure.sh
# Works even if the root script is not executable.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Running Azure VistA connectivity test from: $ROOT_DIR/test-azure-vista.sh"

# Always invoke via bash to avoid execute bit issues
bash "$ROOT_DIR/test-azure-vista.sh" "$@"