# ModernVista Quick Reference Card

## Your System Status

```bash
# Check everything quickly
echo "=== VISTA DOCKER ===" 
docker ps --format "table {{.Names}}\t{{.Status}}" | grep vehu

echo "=== MODERNVISTA PROJECT ==="
ls -la "/media/frasod/4T NVMe/ModernVista" | head -3

echo "=== SERVICES STATUS ==="
curl -s http://localhost:8080 >/dev/null && echo "✅ VistA Web: Running" || echo "❌ VistA Web: Down"
curl -s http://localhost:3001/health >/dev/null && echo "✅ ModernVista Backend: Running" || echo "❌ ModernVista Backend: Down"  
curl -s http://localhost:3000 >/dev/null && echo "✅ ModernVista Frontend: Running" || echo "❌ ModernVista Frontend: Down"
```

## Daily Development Workflow

### 1. Start Your Day
```bash
# Make sure VistA is running
docker start vehu

# Check it's responding  
curl http://localhost:8080
```

### 2. Start ModernVista Development

**Easy Mode (Recommended)** ⭐
```bash
# Start everything with timeout protection
cd "/media/frasod/4T NVMe/ModernVista"
./start-modernvista.sh
```

**Manual Mode**
```bash
# Backend (Terminal 1)
cd "/media/frasod/4T NVMe/ModernVista/backend"
npm run dev

# Frontend (Terminal 2)
cd "/media/frasod/4T NVMe/ModernVista/frontend"  
npm run dev
```

### 3. Development URLs
- **ModernVista Web App**: http://localhost:3000
- **ModernVista API**: http://localhost:3001/api/v1/health
- **Original VistA**: http://localhost:8080
- **VistA RPC Port**: localhost:9430

## Common Commands

### VistA Docker Management
```bash
docker ps | grep vehu          # Check if running
docker start vehu              # Start VistA
docker stop vehu               # Stop VistA  
docker restart vehu            # Restart VistA
docker logs vehu               # See VistA logs
```

### ModernVista Development
```bash
# Navigate to project
cd "/media/frasod/4T NVMe/ModernVista"

# Backend development
cd backend
npm install                    # First time only
npm run dev                    # Development server
npm run build                  # Build for production

# Frontend development  
cd frontend
npm install                    # First time only
npm run dev                    # Development server
npm run build                  # Build for production
```

### Troubleshooting
```bash
# Check if ports are in use
netstat -tulpn | grep :3000   # Frontend port
netstat -tulpn | grep :3001   # Backend port
netstat -tulpn | grep :8080   # VistA web port
netstat -tulpn | grep :9430   # VistA RPC port

# Kill processes if needed
pkill -f "npm run dev"        # Kill all npm dev processes
```

## Project Structure
```
/media/frasod/4T NVMe/ModernVista/
├── backend/              # Node.js + TypeScript API
│   ├── src/
│   │   ├── config/       # Configuration
│   │   ├── api/          # REST endpoints  
│   │   ├── vista/        # VistA RPC client
│   │   └── nlp/          # AI/NLP processing
│   └── package.json
├── frontend/             # React + TypeScript
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── modules/      # Feature modules
│   │   └── services/     # API clients
│   └── package.json
└── docs/                 # Documentation
    ├── DEVELOPMENT_GUIDE.md
    └── DOCKER_VS_MODERNVISTA.md
```

## Environment Variables

### Backend Configuration (.env)
```bash
# VistA Connection
VISTA_HOST=localhost
VISTA_PORT=9430
VISTA_ACCESS_CODE=your_code
VISTA_VERIFY_CODE=your_code

# Server Settings
PORT=3001
NODE_ENV=development

# NLP Settings  
OLLAMA_URL=http://localhost:11434
ENABLE_CLOUD_NLP=false
```

## Safety Reminders

### ✅ Safe Operations
- Modify ModernVista code
- Restart ModernVista servers
- Delete ModernVista project
- Break ModernVista (VistA unaffected)

### ⚠️ Handle With Care
- VistA Docker container
- VistA access codes  
- Patient data (read-only access)

## Timeout & Error Handling 🕐

### Services Hanging or Timing Out
```bash
# Kill all hanging processes
pkill -f "nodemon.*index.ts"
pkill -f "ts-node.*index.ts"  
pkill -f "vite"

# Use timeout-safe startup
cd "/media/frasod/4T NVMe/ModernVista"
./start-modernvista.sh

# Check logs if issues persist
tail -f logs/backend.log
tail -f logs/frontend.log
```

### Backend Timeout Issues
```bash
# Check if backend port is blocked
ss -tlnp | grep :3001

# Kill specific processes on port 3001
sudo lsof -ti:3001 | xargs kill -9

# Restart with timeout protection
timeout 30s npm run dev
```

## Emergency Recovery

### If ModernVista Breaks
```bash
# Nuclear option - stop everything
pkill -f "npm run dev"
pkill -f "nodemon"
pkill -f "ts-node"

# Clean restart
cd "/media/frasod/4T NVMe/ModernVista"
./start-modernvista.sh
```

### If VistA Docker Issues
```bash
# Restart VistA container
docker restart vehu

# Check VistA status
docker ps | grep vehu
docker logs vehu
```

## Getting Help

1. **Check logs**: Backend/frontend terminals show errors
2. **Read documentation**: `./docs/DEVELOPMENT_GUIDE.md`
3. **Test connections**: Use curl commands above
4. **Verify VistA**: Original interface should work at localhost:8080

---
*Remember: Your VistA data is always safe. ModernVista just provides a prettier interface.*