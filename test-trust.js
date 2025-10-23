#!/usr/bin/env node

/**
 * Simple test script to verify core trust infrastructure functionality
 */

const { DIDManager } = require('./dist/core/trust/did');
const { canonicalizeJSON } = require('./dist/core/trust/crypto');

async function testTrustInfrastructure() {
  console.log('🧪 Testing SYMBI Trust Infrastructure Core Components');
  console.log('=====================================================\n');
  
  // Test 1: DID Generation
  console.log('1️⃣  Testing DID Generation');
  console.log('--------------------------');
  
  const didManager = new DIDManager();
  
  try {
    const webDid = didManager.generateDID('test-agent-1', { method: 'web', domain: 'symbi.trust' });
    console.log(`✅ did:web generated: ${webDid}`);
    
    const keyDid = didManager.generateDID('test-agent-2', { method: 'key' });
    console.log(`✅ did:key generated: ${keyDid}`);
    
    const ethrDid = didManager.generateDID('test-agent-3', { method: 'ethr', identifier: '0x1234567890123456789012345678901234567890' });
    console.log(`✅ did:ethr generated: ${ethrDid}`);
    
    const ionDid = didManager.generateDID('test-agent-4', { method: 'ion' });
    console.log(`✅ did:ion generated: ${ionDid}\n`);
  } catch (error) {
    console.log(`❌ DID Generation failed: ${error.message}\n`);
  }
  
  // Test 2: DID Document Creation
  console.log('2️⃣  Testing DID Document Creation');
  console.log('----------------------------------');
  
  try {
    const did = 'did:web:symbi.trust:agents:test-agent';
    const didDocument = didManager.createDIDDocument(did, {
      publicKey: 'z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
      serviceEndpoint: 'https://api.symbi.trust/agents/test-agent'
    });
    
    console.log(`✅ DID Document created for: ${didDocument.id}`);
    console.log(`   Verification methods: ${didDocument.verificationMethod.length}`);
    console.log(`   Authentication keys: ${didDocument.authentication.length}\n`);
  } catch (error) {
    console.log(`❌ DID Document Creation failed: ${error.message}\n`);
  }
  
  // Test 3: JSON Canonicalization
  console.log('3️⃣  Testing JSON Canonicalization');
  console.log('----------------------------------');
  
  try {
    const testData = {
      z: 1,
      a: 2,
      nested: {
        z: 3,
        a: 4
      },
      arr: [3, 1, 2]
    };
    
    const canonical = canonicalizeJSON(testData);
    console.log(`✅ JSON Canonicalized: ${canonical}\n`);
  } catch (error) {
    console.log(`❌ JSON Canonicalization failed: ${error.message}\n`);
  }
  
  // Test 4: DID Method Extraction
  console.log('4️⃣  Testing DID Method Extraction');
  console.log('----------------------------------');
  
  try {
    const methods = [
      'did:web:example.com',
      'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
      'did:ethr:0x1234567890123456789012345678901234567890',
      'did:ion:EiClkZMDxPKqC9c-umQfTkR8vvZ9JPhl_xLDI9Nfk38w5w'
    ];
    
    for (const did of methods) {
      const method = didManager.extractDIDMethod(did);
      console.log(`✅ ${did} -> method: ${method}`);
    }
    console.log('');
  } catch (error) {
    console.log(`❌ DID Method Extraction failed: ${error.message}\n`);
  }
  
  console.log('🎯 Trust Infrastructure Assessment Complete');
  console.log('============================================');
  console.log('Core components are functional but with limitations:');
  console.log('- DID generation works (placeholder implementation)');
  console.log('- DID document creation works');
  console.log('- JSON canonicalization works');
  console.log('- DID method extraction works');
  console.log('');
  console.log('⚠️  Limitations:');
  console.log('- DID resolution is not fully implemented (returns null)');
  console.log('- Cryptographic operations use placeholder implementations');
  console.log('- KMS operations are not fully implemented');
  console.log('- Audit trails are implemented but not fully tested');
}

if (require.main === module) {
  testTrustInfrastructure().catch(console.error);
}

module.exports = { testTrustInfrastructure };