# ModernVista Development Guide

## What is ModernVista?

**ModernVista = Modern Web Interface for Your Existing VistA System**

Think of it like this:
- **VistA Docker Container** = Your car engine (runs independently)  
- **ModernVista** = Fancy new dashboard (makes driving nicer, but engine works without it)

## Architecture Overview - How Everything Works Together

### Your Current Setup

```
YOUR COMPUTER
├── Docker System (Hidden Storage)
│   └── worldvista/vehu container ← Your VistA database (6.08GB)
│       ├── Running on localhost:9430 (RPC)
│       ├── Running on localhost:8080 (Web interface) 
│       └── All patient data, medical records, etc.
│
└── /media/frasod/4T NVMe/ModernVista/ ← This new GUI project
    ├── backend/ (Node.js server - connects to Docker VistA)
    ├── frontend/ (React web app - pretty interface)
    └── docs/ (Documentation)
```

### How They Connect

```
User → Modern Web Interface → ModernVista Backend → VistA Docker Container
  ↑                              ↑                        ↑
React App              Node.js API Server        Original VistA System
(Pretty GUI)           (Translator/Bridge)       (Your Medical Data)
```

## Independence Guarantee ✅

### VistA Docker is Completely Independent
- **Can run without ModernVista** - Original CPRS interface still works
- **All data stays in Docker** - Patient records, medical data, everything
- **Delete ModernVista folder** - VistA still works perfectly
- **No dependencies** - VistA doesn't know ModernVista exists

### ModernVista is Optional Enhancement  
- **Connects TO VistA** - Doesn't change VistA
- **Read-only by default** - Won't break your data
- **Easy to remove** - Just delete the project folder
- **Development safe** - Test without fear

## Quick Commands Reference

### Check Your Docker Setup
```bash
# See what's running
docker ps

# See what VistA images you have stored
docker images worldvista/vehu

# Start your VistA (if stopped)
docker start vehu

# Stop your VistA (if running)
docker stop vehu
```

### Work on ModernVista
```bash
# Go to your project
cd "/media/frasod/4T NVMe/ModernVista"

# Start backend development server
cd backend && npm run dev

# Start frontend development server (in another terminal)
cd frontend && npm run dev
```

### Connect ModernVista to VistA
```bash
# Check if VistA is running
curl http://localhost:8080

# Check if VistA RPC is working
telnet localhost 9430
```

## Development Workflow

### Daily Development Process
1. **Start VistA Docker** (your database)
   ```bash
   docker start vehu
   ```

2. **Start ModernVista Backend** (bridge/API)
   ```bash
   cd "/media/frasod/4T NVMe/ModernVista/backend"
   npm run dev
   ```

3. **Start ModernVista Frontend** (web interface)
   ```bash
   cd "/media/frasod/4T NVMe/ModernVista/frontend"  
   npm run dev
   ```

4. **Develop and Test**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Original VistA: http://localhost:8080

### Safety Notes

#### ✅ Safe to Do
- Modify ModernVista code
- Delete ModernVista project folder
- Restart ModernVista servers
- Test connections to VistA
- Break ModernVista (VistA keeps working)

#### ⚠️ Be Careful  
- Don't stop VistA Docker during development (unless intended)
- Don't modify VistA Docker container directly
- Don't change VistA port settings (9430, 8080)
- Keep VistA access codes secure

## Technology Stack Explanation

### VistA Docker Container (Your Database)
- **Language**: MUMPS/M database
- **Interface**: Original CPRS (Delphi/Pascal)
- **Communication**: RPC protocol on port 9430
- **Web Access**: Basic web interface on port 8080

### ModernVista Backend (The Bridge)
- **Language**: Node.js + TypeScript
- **Purpose**: Translates between modern web and old VistA RPC
- **Port**: 3001
- **Features**: NLP processing, authentication, clean APIs

### ModernVista Frontend (Pretty Interface)
- **Language**: React + TypeScript  
- **Purpose**: Beautiful, modern web interface
- **Port**: 3000 (development), 5173 (Vite dev server)
- **Features**: Natural language commands, voice input, modern UX

## Connection Details

### VistA RPC Connection
```javascript
// This is how ModernVista talks to VistA
const vistaConnection = {
  host: 'localhost',
  port: 9430,
  protocol: 'RPC'
};
```

### Environment Variables
```bash
# In ModernVista/backend/.env
VISTA_HOST=localhost
VISTA_PORT=9430
VISTA_ACCESS_CODE=your_access_code
VISTA_VERIFY_CODE=your_verify_code
```

## Troubleshooting

### VistA Docker Issues
```bash
# Check if VistA is running
docker ps | grep vehu

# Check VistA logs
docker logs vehu

# Restart VistA if needed
docker restart vehu
```

### ModernVista Issues
```bash
# Check backend logs
cd "/media/frasod/4T NVMe/ModernVista/backend"
npm run dev

# Check if backend can reach VistA
curl http://localhost:3001/api/v1/health
```

### Connection Issues
```bash
# Test VistA RPC port
telnet localhost 9430

# Test VistA web interface  
curl http://localhost:8080
```

## Benefits of This Architecture

### For Development
- **Safe Testing**: Can't break VistA data
- **Fast Development**: Modern tools (React, Node.js, TypeScript)
- **Easy Debugging**: Clear separation of concerns
- **Version Control**: Track changes in git

### For Users
- **Modern Interface**: Clean, intuitive web UI
- **Natural Language**: "Show labs for John Smith"
- **Voice Commands**: Speak instead of clicking
- **Mobile Ready**: Works on tablets, phones
- **Faster Workflows**: AI-assisted clinical tasks

### for IT/Admin
- **No VistA Changes**: Original system untouched
- **Easy Deployment**: Standard web deployment
- **Secure**: All data stays in existing VistA
- **Scalable**: Can serve multiple users
- **Maintainable**: Modern codebase, good documentation

## Next Steps

1. **Get Backend Running**: Fix TypeScript issues, test VistA connection
2. **Create Frontend**: React app with modern UI components
3. **Test Integration**: Verify data flows correctly
4. **Add NLP**: Natural language processing for commands
5. **Polish UI**: Clean, medical-focused design
6. **Deploy**: Production-ready configuration

---

*Remember: VistA Docker is your foundation. ModernVista is just making it prettier and easier to use!*