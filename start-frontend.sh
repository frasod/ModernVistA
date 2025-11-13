#!/bin/bash
# Start ModernVista Frontend in Development Mode
cd /mnt/nvme4t/ModernVista/frontend
export VITE_API_URL=http://localhost:3001
exec npm run dev
