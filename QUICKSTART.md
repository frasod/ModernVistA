# ModernVista Quick Start 🚀

**Status: ✅ WORKING - Connected to Azure VistA with Real Patient Data!**

---

## 🎯 What You're Getting

A modern web interface for VistA with natural language processing:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Browser   │◄──►│  ModernVista    │◄──►│  Azure VistA    │
│  localhost:5173 │    │ Backend: 3001   │    │  Port 9430      │
│                 │    │ Frontend: 5173  │    │                 │
│ • Patient Search│    │ • REST API      │    │ • Real Data     │
│ • Clean Design  │    │ • RPC Client    │    │ • Medical Recs  │
│ • RPC Activity  │    │ • Real-time     │    │ • Lab Results   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Current Status**: Connected to `vista-demo-frasod-832.eastus.azurecontainer.io:9430`

---

## 🏃 Quick Start (2 Commands)

### Terminal 1 - Backend
```bash
cd backend
PORT=3001 npm run dev
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

### Open Browser
http://localhost:5173

**That's it!** The patient search should work with real Azure VistA data.

---
# Test connectivity
curl -v telnet://vista-demo-frasod-832.eastus.azurecontainer.io:9430
# Or check YottaDB GUI:
# http://vista-demo-frasod-832.eastus.azurecontainer.io:8089
```

### Step 2: Start Backend (Terminal 1)
```bash
cd "/media/frasod/4T NVMe/ModernVista/backend"
npm install
npm run dev
```
✅ **Backend ready at http://localhost:3001**

### Step 3: Start Frontend (Terminal 2) 
```bash
cd "/media/frasod/4T NVMe/ModernVista/frontend"
npm install  
npm run dev
```
✅ **Frontend ready at http://localhost:3000**

### Step 4: Use ModernVista
Open browser: **http://localhost:3000**

- **Search patients**: Type "DOE" or any name
- **Click patient**: See all their medical data
- **Browse tabs**: Labs, Meds, Vitals, Allergies
- **Watch activity**: Real VistA RPC calls in the log

---

## 🎉 Success Signs

You know it's working when you see:

- ✅ **Patients found** when you search
- ✅ **"Mock: false"** in the RPC activity log  
- ✅ **Real medical data** in the tabs
- ✅ **Fast responses** (green indicators)

---

## 🆘 Quick Fixes

### ❌ "Connection Failed"
```bash
# Check VistA
docker ps | grep vehu
docker start vehu  # If not running
```

### ❌ "Port in Use" 
- Stop other apps using ports 3000 or 3001
- Or change ports in the config files

### ❌ "No Patients Found"
- VistA is running but credentials might be wrong  
- Check backend logs for authentication errors

### ❌ Still Seeing Mock Data
```bash  
cd backend
node test-vista-connection.js  # Test real connection
```

---

## 🔧 Test Your Connection

Want to verify everything works?
```bash
cd "/media/frasod/4T NVMe/ModernVista/backend"
npx ts-node test-vista-connection.js
```

Should show:
- ✅ Socket connected
- ✅ Sign-on success  
- ✅ Mock: false
- ✅ Patients found

---

## 📱 What You Get

### 🔍 **Smart Patient Search**
- Type any part of name
- Instant results from real VistA
- Click → see complete medical record

### 📊 **Complete Medical Data**
- **Labs**: Blood work, chemistry results
- **Medications**: Current prescriptions  
- **Vitals**: Blood pressure, temperature
- **Allergies**: Drug reactions, food allergies

### 🚀 **Modern Interface**
- Clean, fast design
- Works on phone/tablet/desktop
- Real-time data updates
- No more old CPRS interface!

### 📈 **Activity Monitoring** 
- See every call to VistA
- Performance metrics
- Error tracking

---

## 🎯 One-Line Test

```bash
curl "http://localhost:3001/api/v1/patients-search?q=DOE"
```

Should return JSON with real patients (not mock data)!

---

## 🏗️ Architecture (Simple)

- **Frontend** (`frontend/`): React app → Pretty web interface
- **Backend** (`backend/`): Node.js server → Talks to VistA  
- **VistA** (Docker): Your medical database → Unchanged & safe

**Flow**: Browser → Frontend → Backend → VistA → Data → You

---

## 📞 Need Help?

1. **Check the logs** - Backend terminal shows what's happening
2. **Test connection** - Run `test-vista-connection.js`
3. **Verify ports** - VistA (9430), Backend (3001), Frontend (3000)  
4. **Read errors** - They usually tell you exactly what's wrong

---

## 🎊 Congratulations!

You now have a **beautiful, modern web interface** for your VistA system!

- 🔒 **Your VistA data is safe** - ModernVista just reads it
- 🌐 **Access anywhere** - Any device with a web browser
- ⚡ **Fast & responsive** - No more waiting for old interfaces
- 🛠️ **Easy to customize** - It's your code, modify as needed

**Enjoy your upgraded VistA experience!** 🎉

---

*Want more details? See the full [README.md](./README.md) for complete documentation.*