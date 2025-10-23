#!/usr/bin/env node

/**
 * VistA Docker Integration Test
 * Tests connection to existing VistA Docker container
 */

const net = require('net');
const fs = require('fs');
const path = require('path');

// Standard VistA Docker connection details
const VISTA_CONFIG = {
  host: 'localhost',
  port: 9430,
  webPort: 8080,
  sshPort: 2222
};

// Common VistA Docker credentials
const COMMON_CREDENTIALS = [
  { access: 'FAKEDOC1', verify: 'FAKEDOC1' },
  { access: 'FAKEADM', verify: 'FAKEADM' },
  { access: 'PROGRAMMER', verify: 'ProgrammerVISTA29' },
  { access: 'VISTA', verify: 'VISTA' }
];

async function checkVistaDocker() {
  console.log('🔍 VistA Docker Integration Test');
  console.log('================================\n');

  // 1. Check if VistA Docker is running
  console.log('1️⃣  Checking VistA Docker status...');
  
  try {
    const response = await fetch(`http://localhost:${VISTA_CONFIG.webPort}/`, {
      method: 'HEAD',
      timeout: 3000
    });
    console.log('   ✅ VistA web interface responding on port 8080');
  } catch (error) {
    console.log('   ❌ VistA web interface not responding on port 8080');
    console.log('   💡 Try: docker start vehu');
    return false;
  }

  // 2. Test RPC port connectivity
  console.log('\n2️⃣  Testing RPC port connectivity...');
  
  const rpcConnectable = await testPort(VISTA_CONFIG.host, VISTA_CONFIG.port);
  if (rpcConnectable) {
    console.log(`   ✅ VistA RPC port ${VISTA_CONFIG.port} is accessible`);
  } else {
    console.log(`   ❌ VistA RPC port ${VISTA_CONFIG.port} not accessible`);
    console.log('   💡 Check if VistA Docker container is running');
    return false;
  }

  // 3. Check .env configuration
  console.log('\n3️⃣  Checking ModernVista configuration...');
  
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.log('   ⚠️  No .env file found. Creating with VistA Docker settings...');
    createVistaEnvFile();
    console.log('   ✅ Created .env with VistA Docker settings');
  } else {
    console.log('   ✅ .env file exists');
  }

  // 4. Test actual RPC connection
  console.log('\n4️⃣  Testing RPC connection with common credentials...');
  
  for (const creds of COMMON_CREDENTIALS) {
    console.log(`   Testing ${creds.access}/${creds.verify}...`);
    const success = await testVistaRPCConnection(creds);
    if (success) {
      console.log(`   ✅ Successfully connected with ${creds.access}/${creds.verify}`);
      return { success: true, credentials: creds };
    }
  }
  
  console.log('   ⚠️  Could not connect with common credentials');
  console.log('   💡 You may need to configure custom credentials in .env');
  
  return { success: false, credentials: null };
}

async function testPort(host, port, timeout = 3000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    
    socket.setTimeout(timeout);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', () => {
      resolve(false);
    });
    
    socket.connect(port, host);
  });
}

async function testVistaRPCConnection(credentials) {
  try {
    // Set environment variables for this test
    process.env.VISTA_ACCESS_CODE = credentials.access;
    process.env.VISTA_VERIFY_CODE = credentials.verify;
    
    // Import after setting env vars
    delete require.cache[require.resolve('./src/vista/broker/session')];
    const { VistaBrokerSession } = require('./src/vista/broker/session');
    
    const session = new VistaBrokerSession();
    const result = await session.call('ORWPT LIST', ['TEST', '5']);
    
    return result.ok && !result.mock;
  } catch (error) {
    return false;
  }
}

function createVistaEnvFile() {
  const envContent = `# ModernVista Configuration for VistA Docker
# Auto-generated configuration for existing VistA Docker container

# Server Configuration  
PORT=3001
NODE_ENV=development
API_PREFIX=/api/v1
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# VistA Docker Connection Settings
VISTA_HOST=localhost
VISTA_PORT=9430
VISTA_ACCESS_CODE=FAKEDOC1
VISTA_VERIFY_CODE=FAKEDOC1
VISTA_CONTEXT=OR CPRS GUI CHART

# VistA Broker Configuration (Real RPC Calls Enabled)
VISTA_BROKER_EXPERIMENTAL=true
VISTA_BROKER_PHASE3_ENABLE=true
VISTA_BROKER_CONNECT_TIMEOUT=8000
VISTA_BROKER_RPC_TIMEOUT=10000
VISTA_BROKER_IDLE_MS=300000

# Security
JWT_SECRET=vista-docker-test-secret-change-in-production-12345
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12

# Logging
LOG_LEVEL=debug
LOG_FILE_PATH=./logs/modernvista.log

# Caching
CACHE_TTL=3600

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Metrics and Monitoring
ADMIN_METRICS_ENABLE=true

# NOTE: These are standard VistA Docker credentials
# If connection fails, try these alternatives in VISTA_ACCESS_CODE/VISTA_VERIFY_CODE:
# - FAKEADM/FAKEADM
# - PROGRAMMER/ProgrammerVISTA29  
# - VISTA/VISTA
`;

  const envPath = path.join(__dirname, '..', '.env');
  fs.writeFileSync(envPath, envContent);
}

// Run the test
checkVistaDocker().then((result) => {
  console.log('\n🎯 Test Summary');
  console.log('===============');
  
  if (result.success) {
    console.log('✅ VistA Docker integration is working!');
    console.log(`✅ Using credentials: ${result.credentials.access}/${result.credentials.verify}`);
    console.log('');
    console.log('🚀 Ready to start ModernVista:');
    console.log('   cd backend && npm run dev');
    console.log('   cd frontend && npm run dev');
    console.log('');
    console.log('🌐 Access URLs:');
    console.log('   - VistA Web: http://localhost:8080');
    console.log('   - ModernVista: http://localhost:3000'); 
    console.log('   - Backend API: http://localhost:3001');
  } else {
    console.log('❌ VistA Docker integration needs setup');
    console.log('');
    console.log('🔧 Troubleshooting steps:');
    console.log('   1. Start VistA Docker: docker start vehu');
    console.log('   2. Verify web access: http://localhost:8080');
    console.log('   3. Check Docker status: docker ps | grep vehu');
    console.log('   4. Edit .env file with correct credentials');
  }
}).catch(console.error);