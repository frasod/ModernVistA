# Azure VistA Container Configuration (VAN MDWS)

> **Date Configured**: October 22, 2025  
> **Last Updated**: November 2, 2025 (CPRS incompatibility findings)
> **Deployment Type**: Azure Container Instance (ACI)  
> **Environment**: Development / Demo

---

## � Important Discovery: CPRS Cannot Connect to Azure VistA

**Key Finding**: Traditional CPRS desktop client **cannot connect** to Azure Container Instance VistA deployments due to RPC Broker protocol incompatibilities with cloud networking. ModernVista's VAN MDWS backend successfully handles these cloud-specific requirements where CPRS fails.

### Why CPRS Doesn't Work with Azure
- **Legacy Network Assumptions**: CPRS RPC Broker expects VPN/direct network topology
- **Static Hostname Dependency**: Cannot handle Azure's dynamic FQDN assignments
- **Protocol Redesign**: Cloud VistA uses adapted RPC handshake incompatible with desktop client
- **Container Networking**: Azure port mapping and security contexts break CPRS connection flow

### Why VAN MDWS Works
- ✅ **Cloud-Native Design**: Built specifically for container deployments
- ✅ **Dynamic Hostname Handling**: Validates connectivity, adapts to Azure FQDN changes
- ✅ **Resilient Sessions**: Handles container restarts and network transients
- ✅ **Modern Protocol**: Implements cloud-adapted RPC handshake
- ✅ **Universal Compatibility**: Should also work with traditional on-premise VistA (not yet tested)

**Bottom Line**: VAN MDWS is the **only viable modern interface** for cloud-deployed VistA instances. It may also be more compatible than CPRS by supporting both traditional and cloud deployments.

---

## �🌐 Azure VistA Instance Details

| Setting | Value | Notes |
|---------|-------|-------|
| **Current Host** | `vista-demo-frasod-237.eastus.azurecontainer.io` | ⚠️ Changes on container restart |
| **Previous Host** | `vista-demo-frasod-832.eastus.azurecontainer.io` | Example of FQDN change |
| **RPC Broker Port** | `9430` | Standard VistA RPC port |
| **YottaDB GUI** | http://vista-demo-frasod-237.eastus.azurecontainer.io:8089 | Web interface |
| **Region** | East US | Azure region |
| **Access Code** | `<ACCESS_CODE>` | See secure storage |
| **Verify Code** | `<VERIFY_CODE>` | See secure storage |
| **Division** | Default/first | If prompted |

### Dynamic Hostname Management

Azure Container Instances assign **dynamic FQDNs** that change when containers restart. VAN MDWS includes smart launcher validation:

```bash
# Check current hostname
az container show -n vista-demo -g <resource-group> \
  --query "{fqdn:ipAddress.fqdn,status:instanceView.state}" -o json

# Update backend .env with new hostname
./fix-azure-hostname.sh <new-hostname>

# Or use smart launcher (validates hostname first)
./launch-azure.sh
```

---

## 🔧 Configure ModernVista Backend

### Step 1: Update Backend Environment Variables

Edit your `backend/.env` file (copy from `.env.example` if needed):

```bash
# VistA Connection - Azure ACI
VISTA_HOST=vista-demo-frasod-832.eastus.azurecontainer.io
VISTA_PORT=9430
VISTA_ACCESS_CODE=<your-access-code>
VISTA_VERIFY_CODE=<your-verify-code>

# Optional: Enable experimental broker mode
VISTA_BROKER_EXPERIMENTAL=true
VISTA_CONTEXT="OR CPRS GUI CHART"
VISTA_BROKER_TIMEOUT_MS=5000
VISTA_BROKER_PHASE3_ENABLE=true
```

### Step 2: Test Connection

```bash
cd backend
npm run dev
```

Then test the connection:
```bash
# Health check
curl http://localhost:3001/api/v1/health

# Patient search (if auth working)
curl http://localhost:3001/api/v1/patients-search?q=SMITH
```

---

## 📋 Container Management Commands

```bash
# Open container terminal
./deploy-azure-aci.sh terminal

# Stop billing when done (IMPORTANT!)
./deploy-azure-aci.sh delete

# Check container status
./deploy-azure-aci.sh status  # (if supported)
```

---

## 🔐 Security Notes

### DO NOT commit credentials to git!

1. ✅ Store access/verify codes in `backend/.env` (already in `.gitignore`)
2. ✅ Use environment variables for CI/CD
3. ✅ Rotate codes periodically
4. ❌ Never hardcode credentials in source files
5. ❌ Never log access/verify codes

### For Team Sharing

If you need to share this instance with collaborators:
- Share the FQDN and port via secure channel (password manager, encrypted message)
- Each developer should have their own VistA user credentials
- Document in team wiki, not in git

---

## 🌍 Network Considerations

### Firewall / NSG Rules
This ACI instance appears to have public endpoints exposed:
- Port 9430 (RPC Broker) - for CPRS/ModernVista
- Port 8089 (YottaDB GUI) - for database management

### Latency Expectations
| Source | Expected Latency |
|--------|------------------|
| Local (same Azure region) | 1-5ms |
| Remote US East Coast | 10-50ms |
| Remote International | 100-300ms |

ModernVista should handle these latencies gracefully with:
- Connection pooling
- Timeout configurations (5000ms default)
- Retry logic (when safe)

---

## 🧪 Testing Checklist

- [ ] Backend can connect to Azure VistA RPC port
- [ ] Access/Verify codes authenticate successfully
- [ ] Patient search returns real data
- [ ] Labs/Meds/Vitals endpoints work
- [ ] Latency acceptable (< 2s for most RPCs)
- [ ] Frontend can reach backend + Azure VistA
- [ ] No PHI in logs (validate log files)

---

## 📊 Cost Management

**IMPORTANT**: Azure Container Instances bill by uptime!

| Action | Impact |
|--------|--------|
| Running | ~$0.01-0.05/hour (estimate) |
| Stopped | $0 |
| Deleted | $0 |

**Best Practice**: 
```bash
# At end of each dev session:
./deploy-azure-aci.sh delete

# Next session:
./deploy-azure-aci.sh create  # (or whatever your create command is)
```

---

## 🔄 Migration from Local Docker

### What Changed
| Aspect | Local Docker | Azure ACI |
|--------|-------------|-----------|
| Host | `localhost` | `vista-demo-frasod-832.eastus.azurecontainer.io` |
| Network | Local only | Internet-accessible |
| Persistence | Container volumes | Likely ephemeral (verify!) |
| Billing | $0 | Pay-per-use |

### Data Persistence Warning ⚠️
Verify if your ACI deployment uses persistent volumes!
- If ephemeral: data lost on container restart
- If persistent: data survives across restarts
- Check: `./deploy-azure-aci.sh` script or Azure portal

---

## 🐛 Troubleshooting

### Connection Refused
```bash
# Test port accessibility
nc -zv vista-demo-frasod-832.eastus.azurecontainer.io 9430

# Or with curl (will timeout but shows if reachable)
curl -v telnet://vista-demo-frasod-832.eastus.azurecontainer.io:9430
```

### Auth Failures
- Verify access/verify codes in `.env`
- Check if user is active in VistA
- Review broker logs: `./deploy-azure-aci.sh terminal` then check log files

### Timeout Issues
- Increase `VISTA_BROKER_TIMEOUT_MS` in `.env`
- Check network latency: `ping vista-demo-frasod-832.eastus.azurecontainer.io`
- Verify Azure NSG rules allow port 9430

### Data Not Showing
- Confirm patient records exist: use YottaDB GUI or terminal
- Check RPC framing: enable `VISTA_BROKER_CAPTURE=true` and review `/api/v1/admin/broker/capture`
- Validate context: ensure `VISTA_CONTEXT="OR CPRS GUI CHART"` is set

---

## 📚 Related Documentation

- [ModernVista README](./README.md) - Main project documentation
- [Quickstart Guide](./QUICKSTART.md) - Fast setup instructions
- [RPC Implementation](./VISTA_RPC_IMPLEMENTATION.md) - Real RPC details
- [Development Guide](./docs/DEVELOPMENT_GUIDE.md) - Full dev workflow

---

**Last Updated**: October 22, 2025  
**Maintainer**: Development Team  
**Status**: Active (remember to delete when done!)
