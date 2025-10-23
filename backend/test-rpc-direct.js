#!/usr/bin/env node

/**
 * Direct VistA RPC Test
 * Tests only the RPC connection since we know port 9430 is open
 */

const net = require('net');
const fs = require('fs');
const path = require('path');

async function testRPCOnly() {
  console.log('🔧 Direct VistA RPC Test');
  console.log('========================\n');

  // Create .env file with VistA settings
  console.log('1️⃣  Creating .env configuration...');
  const envPath = path.join(__dirname, '..', '.env');
  
  const envContent = `# ModernVista Configuration for VistA Docker
PORT=3001
NODE_ENV=development
API_PREFIX=/api/v1
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# VistA Connection (RPC Port 9430 is confirmed open)
VISTA_HOST=localhost
VISTA_PORT=9430
VISTA_ACCESS_CODE=FAKEDOC1
VISTA_VERIFY_CODE=FAKEDOC1
VISTA_CONTEXT=OR CPRS GUI CHART

# Enable Real RPC Calls
VISTA_BROKER_EXPERIMENTAL=true
VISTA_BROKER_PHASE3_ENABLE=true
VISTA_BROKER_CONNECT_TIMEOUT=8000
VISTA_BROKER_RPC_TIMEOUT=10000

# Security & Logging
JWT_SECRET=vista-rpc-test-secret-12345
LOG_LEVEL=debug
LOG_FILE_PATH=./logs/modernvista.log
CACHE_TTL=3600
ADMIN_METRICS_ENABLE=true
`;

  fs.writeFileSync(envPath, envContent);
  console.log('   ✅ Created .env file');

  // Test raw socket connection
  console.log('\n2️⃣  Testing raw socket connection to port 9430...');
  const socketConnects = await testSocketConnection('localhost', 9430);
  
  if (!socketConnects) {
    console.log('   ❌ Cannot connect to port 9430');
    return false;
  }
  
  console.log('   ✅ Socket connection to port 9430 successful');

  // Test VistA RPC calls with different credentials
  console.log('\n3️⃣  Testing VistA RPC authentication...');
  
  const credentials = [
    { access: 'FAKEDOC1', verify: 'FAKEDOC1' },
    { access: 'FAKEADM', verify: 'FAKEADM' },
    { access: 'PROGRAMMER', verify: 'ProgrammerVISTA29' },
    { access: 'VISTA', verify: 'VISTA' }
  ];

  for (const cred of credentials) {
    console.log(`   Testing ${cred.access}/${cred.verify}...`);
    
    try {
      // Set credentials for this test
      process.env.VISTA_ACCESS_CODE = cred.access;
      process.env.VISTA_VERIFY_CODE = cred.verify;
      
      // Clear require cache and import fresh
      Object.keys(require.cache).forEach(key => {
        if (key.includes('vista') || key.includes('config')) {
          delete require.cache[key];
        }
      });
      
      const { VistaBrokerSession } = require('./src/vista/broker/session.ts');
      const session = new VistaBrokerSession();
      
      const result = await session.call('ORWPT LIST', ['TEST', '5']);
      
      if (result.ok) {
        console.log(`   ✅ SUCCESS with ${cred.access}/${cred.verify}`);
        console.log(`   📊 Mock: ${result.mock}`);
        console.log(`   📋 Lines returned: ${result.lines.length}`);
        
        if (!result.mock) {
          console.log('\n🎉 REAL VISTA DATA CONFIRMED! 🎉');
          console.log('   No more mock responses - using live VistA RPC calls');
          
          // Update .env with working credentials
          const updatedEnv = envContent.replace(
            'VISTA_ACCESS_CODE=FAKEDOC1', 
            `VISTA_ACCESS_CODE=${cred.access}`
          ).replace(
            'VISTA_VERIFY_CODE=FAKEDOC1', 
            `VISTA_VERIFY_CODE=${cred.verify}`
          );
          fs.writeFileSync(envPath, updatedEnv);
          
          return { success: true, credentials: cred };
        }
      }
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
  }
  
  return { success: false };
}

function testSocketConnection(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    
    socket.setTimeout(3000);
    
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

// Run the test
testRPCOnly().then((result) => {
  console.log('\n🎯 Final Results');
  console.log('=================');
  
  if (result.success) {
    console.log('✅ VistA RPC integration WORKING!');
    console.log(`✅ Credentials: ${result.credentials.access}/${result.credentials.verify}`);
    console.log('✅ Real VistA data (no mocks)');
    console.log('');
    console.log('🚀 Ready to start ModernVista backend:');
    console.log('   npm run dev');
    console.log('');
    console.log('🌐 Test endpoints:');
    console.log('   http://localhost:3001/api/v1/health');
    console.log('   http://localhost:3001/api/v1/patients-search?q=DOE');
  } else {
    console.log('❌ VistA RPC connection failed');
    console.log('🔧 Port 9430 is open but RPC authentication failed');
    console.log('💡 Your VistA might use different credentials');
  }
}).catch(console.error);