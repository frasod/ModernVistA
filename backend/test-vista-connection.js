#!/usr/bin/env node

/**
 * VistA RPC Connection Test
 * Tests the real VistA RPC implementation against running VistA instance
 */

const { VistaBrokerSession } = require('./src/vista/broker/session');
const { config } = require('./src/config/config');

async function testVistaConnection() {
  console.log('🧪 VistA RPC Connection Test');
  console.log('============================\n');
  
  console.log('Configuration:');
  console.log(`  Host: ${config.vista.host}`);
  console.log(`  Port: ${config.vista.port}`);
  console.log(`  Context: ${config.vista.context}`);
  console.log(`  Access Code: ${config.vista.accessCode ? '[SET]' : '[NOT SET]'}`);
  console.log(`  Verify Code: ${config.vista.verifyCode ? '[SET]' : '[NOT SET]'}`);
  console.log('');

  const session = new VistaBrokerSession();
  
  try {
    console.log('1. Testing Patient Search (ORWPT LIST)...');
    const searchResult = await session.call('ORWPT LIST', ['DOE', '10']);
    console.log(`   ✅ Success: ${searchResult.lines.length} lines returned`);
    console.log(`   📊 Mock: ${searchResult.mock}`);
    if (searchResult.structured?.patients) {
      console.log(`   👥 Patients found: ${searchResult.structured.patients.length}`);
      searchResult.structured.patients.slice(0, 3).forEach((p, i) => {
        console.log(`      ${i+1}. ${p.name} (ID: ${p.id})`);
      });
    }
    console.log('');

    // Test with first patient if available
    const firstPatientId = searchResult.structured?.patients?.[0]?.id || '100';
    
    console.log(`2. Testing Labs (ORWLRR LABS) for patient ${firstPatientId}...`);
    const labsResult = await session.call('ORWLRR LABS', [firstPatientId, '', '', '']);
    console.log(`   ✅ Success: ${labsResult.lines.length} lines returned`);
    console.log(`   📊 Mock: ${labsResult.mock}`);
    console.log('');

    console.log(`3. Testing Medications (ORWPS ACTIVE MEDS) for patient ${firstPatientId}...`);
    const medsResult = await session.call('ORWPS ACTIVE MEDS', [firstPatientId]);
    console.log(`   ✅ Success: ${medsResult.lines.length} lines returned`);
    console.log(`   📊 Mock: ${medsResult.mock}`);
    console.log('');

    console.log(`4. Testing Vitals (ORQQVI VITALS) for patient ${firstPatientId}...`);
    const vitalsResult = await session.call('ORQQVI VITALS', [firstPatientId]);
    console.log(`   ✅ Success: ${vitalsResult.lines.length} lines returned`);
    console.log(`   📊 Mock: ${vitalsResult.mock}`);
    console.log('');

    console.log(`5. Testing Allergies (ORQQAL ALLERGIES) for patient ${firstPatientId}...`);
    const allergiesResult = await session.call('ORQQAL ALLERGIES', [firstPatientId]);
    console.log(`   ✅ Success: ${allergiesResult.lines.length} lines returned`);
    console.log(`   📊 Mock: ${allergiesResult.mock}`);
    console.log('');

    // Summary
    const allReal = !searchResult.mock && !labsResult.mock && !medsResult.mock && 
                   !vitalsResult.mock && !allergiesResult.mock;
    
    if (allReal) {
      console.log('🎉 SUCCESS: All RPC calls are using REAL VistA data!');
      console.log('🔗 VistA RPC integration is working properly.');
    } else {
      console.log('⚠️  WARNING: Some RPC calls are still using mock data.');
      console.log('🔧 Check VistA connection settings and credentials.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('');
    console.log('Troubleshooting tips:');
    console.log('  1. Verify VistA Docker container is running on port 9430');
    console.log('  2. Check VISTA_HOST and VISTA_PORT in .env file');
    console.log('  3. Verify VISTA_ACCESS_CODE and VISTA_VERIFY_CODE');
    console.log('  4. Ensure VistA RPC Broker is enabled');
    process.exit(1);
  }
}

// Run the test
testVistaConnection().catch(console.error);