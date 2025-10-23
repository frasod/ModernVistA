# 🚀 Azure VistA Quick Reference Card

**Save this for quick access to your Azure VistA instance!**

---

## 📋 Connection Details

```
Host:        vista-demo-frasod-832.eastus.azurecontainer.io
RPC Port:    9430
YottaDB GUI: http://vista-demo-frasod-832.eastus.azurecontainer.io:8089
```

---

## ⚡ Quick Commands

### Test Connection
```bash
# Make test script executable (first time only)
chmod +x test-azure-vista.sh

# Run connection test
./test-azure-vista.sh
```

### Configure ModernVista
```bash
# 1. Copy environment template
cd backend
cp .env.example .env

# 2. Edit .env file and set:
#    VISTA_HOST=vista-demo-frasod-832.eastus.azurecontainer.io
#    VISTA_PORT=9430
#    VISTA_ACCESS_CODE=<your-code>
#    VISTA_VERIFY_CODE=<your-code>
```

### Start ModernVista
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev

# Browser: http://localhost:3000
```

### Manage Azure Container
```bash
# Open container terminal
./deploy-azure-aci.sh terminal

# Stop billing (IMPORTANT when done!)
./deploy-azure-aci.sh delete
```

---

## 🔒 Security Reminders

- ✅ Store credentials in `backend/.env` (git-ignored)
- ❌ Never commit credentials to git
- ❌ Never log access/verify codes
- 💰 Remember to delete ACI when done to stop billing!

---

## 📚 Full Documentation

| Topic | File |
|-------|------|
| Azure VistA Setup | `AZURE_VISTA_CONFIG.md` |
| Quick Start | `QUICKSTART.md` |
| Main Documentation | `README.md` |
| RPC Implementation | `VISTA_RPC_IMPLEMENTATION.md` |

---

## 🆘 Quick Troubleshooting

### Can't Connect
```bash
# Test port
timeout 5 bash -c "echo > /dev/tcp/vista-demo-frasod-832.eastus.azurecontainer.io/9430"

# If fails: check if container is running in Azure portal
```

### Auth Fails
- Double-check access/verify codes in `.env`
- Ensure no extra spaces or quotes
- Verify user exists in VistA

### Slow Performance
- Check latency: `ping vista-demo-frasod-832.eastus.azurecontainer.io`
- Increase timeout: `VISTA_BROKER_TIMEOUT_MS=10000` in `.env`

---

**Last Updated**: October 22, 2025
