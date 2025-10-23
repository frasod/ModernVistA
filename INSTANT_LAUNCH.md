# 🚀 INSTANT LAUNCH GUIDE

## The Absolute Fastest Way to Start

### Option 1: One Command (if already configured)
```bash
./go.sh
```

### Option 2: First Time Setup
```bash
# 1. Make scripts executable
chmod +x go.sh launch-azure.sh test-azure-vista.sh start-modernvista.sh

# 2. Edit credentials
nano backend/.env
# Set these lines:
#   VISTA_HOST=vista-demo-frasod-832.eastus.azurecontainer.io
#   VISTA_ACCESS_CODE=<your-code>
#   VISTA_VERIFY_CODE=<your-code>

# 3. Launch!
./go.sh
```

### Option 3: Manual Step-by-Step
```bash
# Test connection
./test-azure-vista.sh

# Launch with Azure
./launch-azure.sh
```

---

## What Happens When You Launch

1. ✅ Tests Azure VistA connection (port 9430)
2. ✅ Checks backend configuration
3. ✅ Installs dependencies (if needed)
4. ✅ Starts backend (http://localhost:3001)
5. ✅ Starts frontend (http://localhost:3000)
6. 🎉 Opens in browser automatically

---

## Quick Commands Reference

| Command | What It Does |
|---------|--------------|
| `./go.sh` | One-command launch (test + start) |
| `./launch-azure.sh` | Launch with pre-flight checks |
| `./test-azure-vista.sh` | Detailed connection diagnostics |
| `./start-modernvista.sh` | Direct startup (no checks) |

---

## Access URLs

| Service | URL |
|---------|-----|
| **ModernVista UI** | http://localhost:3000 |
| **Backend API** | http://localhost:3001 |
| **API Health** | http://localhost:3001/api/v1/health |
| **YottaDB GUI** | http://vista-demo-frasod-832.eastus.azurecontainer.io:8089 |

---

## Stop Everything

Press `Ctrl+C` in the terminal running the services.

---

## Troubleshooting One-Liners

```bash
# Can't connect to Azure?
./test-azure-vista.sh

# Credentials wrong?
nano backend/.env

# Port already in use?
pkill -f "node.*3001"  # Backend
pkill -f "node.*3000"  # Frontend

# Start fresh
./go.sh
```

---

## Cost Reminder 💰

**IMPORTANT**: Your Azure Container Instance bills while running!

```bash
# Stop billing when done:
./deploy-azure-aci.sh delete
```

---

## That's It!

Just run `./go.sh` and you're live in seconds! 🎉
