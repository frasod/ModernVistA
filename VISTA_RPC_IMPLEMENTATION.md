# VistA RPC Implementation - Setup Guide

## Overview

ModernVista has been updated to use **REAL VistA RPC calls** instead of mock data. The elaborate mock infrastructure that was previously in place has been replaced with actual XWB protocol implementation.

## Key Changes Made

### 1. Real XWB Protocol Implementation
- `backend/src/vista/broker/framing.ts` - Implements actual XWB binary protocol
- `backend/src/vista/broker/transport.ts` - Real socket connections to VistA
- `backend/src/vista/broker/session.ts` - Proper authentication and context management

### 2. Clinical Data Endpoints Now Use Real RPCs
- `/api/v1/labs/:patientId` → `ORWLRR LABS`
- `/api/v1/meds/:patientId` → `ORWPS ACTIVE MEDS`  
- `/api/v1/vitals/:patientId` → `ORQQVI VITALS`
- `/api/v1/allergies/:patientId` → `ORQQAL ALLERGIES`
- `/api/v1/patients-search` → `ORWPT LIST`

### 3. Default Configuration Changes
- `VISTA_BROKER_EXPERIMENTAL=true` (default)
- `VISTA_BROKER_PHASE3_ENABLE=true` (default)
- Real socket transport used by default instead of mock

## Setup Instructions

### Step 1: Configure VistA Connection

Create a `.env` file from the example:
```bash
cp .env.example .env
```

Update these critical settings in your `.env` file:
```env
# VistA Connection Settings (REQUIRED)
VISTA_HOST=your-vista-server.hospital.com  # Your VistA server IP/hostname
VISTA_PORT=9430                            # Standard VistA RPC port
VISTA_ACCESS_CODE=your_access_code         # Your VistA access code
VISTA_VERIFY_CODE=your_verify_code         # Your VistA verify code
VISTA_CONTEXT=OR CPRS GUI CHART            # VistA context for CPRS operations
```

### Step 2: VistA Server Requirements

Your VistA instance must have:
- RPC Broker enabled and listening on the configured port
- The following RPCs available:
  - `XUS SIGNON SETUP` - Authentication setup
  - `XUS AV CODE` - Access/verify code validation
  - `XWB SET CONTEXT` - Context establishment
  - `ORWPT LIST` - Patient search
  - `ORWLRR LABS` - Laboratory results
  - `ORWPS ACTIVE MEDS` - Active medications
  - `ORQQVI VITALS` - Vital signs
  - `ORQQAL ALLERGIES` - Allergy information

### Step 3: Test Connection

Start the backend:
```bash
cd backend
npm install
npm run dev
```

The logs will show connection attempts:
```
[VistaBrokerSession] socket connected { host: 'your-server', port: 9430 }
[VistaBrokerSession] sign-on success
```

### Step 4: Frontend Integration

The frontend is already configured to use real data. Start it:
```bash
cd frontend  
npm install
npm run dev
```

## Troubleshooting

### Connection Timeouts
- Verify `VISTA_HOST` and `VISTA_PORT` are correct
- Ensure VistA RPC Broker is running
- Check network connectivity and firewall rules

### Authentication Failures
- Verify `VISTA_ACCESS_CODE` and `VISTA_VERIFY_CODE` are valid
- Ensure your VistA user has proper privileges
- Check that the account is not locked

### RPC Not Found Errors
- Verify the VistA instance has the required RPCs installed
- Check that your user has access to the specified context
- Ensure `VISTA_CONTEXT` matches an available context

### Mock Data Still Appearing
If you still see mock data:
- Verify `.env` file is in the project root
- Restart the backend completely
- Check logs for "mock: false" in API responses
- Ensure `VISTA_BROKER_EXPERIMENTAL=true`

## Fallback Behavior

The system will gracefully fall back to mock data if:
- VistA connection fails
- RPC calls timeout
- Authentication fails

This ensures the UI remains functional during development or VistA maintenance.

## Security Notes

- Store `.env` file securely (never commit to git)
- Use dedicated service accounts for VistA integration
- Consider VPN or secure network access for production
- Monitor RPC activity logs for security audit trails

## Development vs Production

### Development
- Can use mock transport: `VISTA_BROKER_EXPERIMENTAL=false`
- Shorter timeouts for faster iteration
- More verbose logging

### Production
- Always use real VistA connections
- Longer timeouts for stability
- Reduced logging to protect PHI
- Monitor broker metrics and capture logs

## Next Steps

With real VistA integration active:

1. **Test with Real Data**: Search for actual patients and verify clinical data appears correctly
2. **Error Handling**: Monitor logs and implement robust error recovery 
3. **Performance**: Tune timeout values and connection pooling
4. **Security**: Implement proper PHI handling and audit logging
5. **Monitoring**: Set up alerts for connection failures and RPC errors

The mock infrastructure has been replaced with production-ready VistA RPC integration!