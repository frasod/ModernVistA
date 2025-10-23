# 🎯 YOU ASKED FOR "GOOOO" - HERE IT IS!

## The Literal One Command You Need:

```bash
./GO.sh
```

That's it. That's the whole thing.

---

## What Happens:

1. ✅ Makes all scripts executable
2. ✅ Creates `.env` if missing (first time)
3. ✅ Tests Azure VistA connection
4. ✅ Checks configuration
5. ✅ Installs dependencies
6. ✅ Starts everything
7. 🚀 Opens http://localhost:3000

---

## First Time? Add Your Credentials:

The script will pause and tell you to edit `backend/.env`:

```bash
VISTA_HOST=vista-demo-frasod-832.eastus.azurecontainer.io
VISTA_ACCESS_CODE=<your-access-code>
VISTA_VERIFY_CODE=<your-verify-code>
```

Then run `./GO.sh` again.

---

## Already Configured?

Just:
```bash
./GO.sh
```

And you're live in **5 seconds**. 🎉

---

## Stop Everything:

`Ctrl+C` in the terminal

---

## Other Useful Commands (if you want them):

```bash
./test-azure-vista.sh    # Detailed diagnostics
./launch-azure.sh        # Launch with preflight
./go.sh                  # Launch (lowercase version)
```

But really, just use `./GO.sh` - it handles everything.

---

## Your Azure VistA:

- **Host**: vista-demo-frasod-832.eastus.azurecontainer.io
- **Port**: 9430
- **GUI**: http://vista-demo-frasod-832.eastus.azurecontainer.io:8089

---

## Access After Launch:

| What | Where |
|------|-------|
| **ModernVista** | http://localhost:3000 |
| **Backend** | http://localhost:3001 |
| **Health** | http://localhost:3001/api/v1/health |

---

## 💰 Remember:

Azure Container Instance bills while running!

**When done:**
```bash
./deploy-azure-aci.sh delete
```

---

## That's The Whole Guide.

**Run `./GO.sh` and you're done.** 🚀

No more reading. No more setup. Just GO! 🏃‍♂️💨
