#!/bin/bash
# Ensure all key launcher scripts are executable.
# Usage: bash scripts/fix-executables.sh

set -e
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
cd "$ROOT_DIR"

SCRIPT_LIST=(
  GO.sh
  go.sh
  RUN.sh
  START
  start-modernvista.sh
  launch-azure.sh
  test-azure-vista.sh
  INSTANT_LAUNCH.md # not executable, will be skipped
  GOOOO.md          # not executable, will be skipped
  frontend/test-azure.sh
  scripts/create-backend-env.sh
)

changed=0
for s in "${SCRIPT_LIST[@]}"; do
  if [ -f "$s" ]; then
    if [ ! -x "$s" ]; then
      chmod +x "$s" || true
      echo "chmod +x $s"
      changed=$((changed+1))
    fi
  fi
done

echo "Updated $changed scripts with execute bit."

echo "If you still get 'Permission denied', check if the filesystem is mounted with 'noexec':"
mount | grep "$(df -P . | awk 'NR==2{print $6}')" | sed 's/^/  /'

echo "If 'noexec' appears, run scripts via: bash ./GO.sh"