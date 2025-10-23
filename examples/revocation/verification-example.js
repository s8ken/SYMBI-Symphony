// Verification example showing how a verifier would check credential status
const fs = require('fs').promises;
const path = require('path');
const { Bitstring } = require('../../dist/core/trust/revocation/bitstring');

async function verifyCredentialStatus(credentialFilePath, statusListCredentialFilePath) {
  console.log(`=== Verifying Credential Status ===\n`);
  
  try {
    // Load the credential
    const credentialData = await fs.readFile(credentialFilePath, 'utf-8');
    const credential = JSON.parse(credentialData);
    
    console.log(`Credential ID: ${credential.id}`);
    console.log(`Issuer: ${credential.issuer}`);
    
    // Extract status information
    const statusEntry = credential.credentialStatus;
    console.log(`\nStatus Entry:`);
    console.log(`  Type: ${statusEntry.type}`);
    console.log(`  Purpose: ${statusEntry.statusPurpose}`);
    console.log(`  Status List Credential URL: ${statusEntry.statusListCredential}`);
    console.log(`  Index: ${statusEntry.statusListIndex}`);
    
    // Load the status list credential
    const statusListData = await fs.readFile(statusListCredentialFilePath, 'utf-8');
    const statusListCredential = JSON.parse(statusListData);
    
    console.log(`\nStatus List Credential:`);
    console.log(`  ID: ${statusListCredential.id}`);
    console.log(`  Issuer: ${statusListCredential.issuer}`);
    console.log(`  Encoded List Length: ${statusListCredential.credentialSubject.encodedList.length}`);
    
    // Verify the status
    const encodedList = statusListCredential.credentialSubject.encodedList;
    const index = parseInt(statusEntry.statusListIndex);
    
    // Decode the bitstring
    const bitstring = Bitstring.decode(encodedList);
    
    // Check if the bit at the specified index is set
    const isRevoked = bitstring.get(index);
    const status = isRevoked ? 'revoked' : 'active';
    
    console.log(`\nVerification Result:`);
    console.log(`  Status: ${status}`);
    console.log(`  Bit at index ${index}: ${isRevoked ? 'SET (1)' : 'CLEAR (0)'}`);
    
    return status;
  } catch (error) {
    console.error('Verification failed:', error);
    throw error;
  }
}

async function runVerificationExamples() {
  console.log('Running verification examples...\n');
  
  // Verify active credential
  console.log('1. Verifying active credential (1872):');
  const status1 = await verifyCredentialStatus(
    './examples/revocation/credential-1872.json',
    './examples/revocation/status-list-updated.json'
  );
  console.log(`   Result: ${status1} (expected: active)\n`);
  
  // Verify revoked credential
  console.log('2. Verifying revoked credential (1873):');
  const status2 = await verifyCredentialStatus(
    './examples/revocation/credential-1873.json',
    './examples/revocation/status-list-updated.json'
  );
  console.log(`   Result: ${status2} (expected: revoked)\n`);
  
  // Verify another active credential
  console.log('3. Verifying active credential (1874):');
  const status3 = await verifyCredentialStatus(
    './examples/revocation/credential-1874.json',
    './examples/revocation/status-list-updated.json'
  );
  console.log(`   Result: ${status3} (expected: active)\n`);
  
  console.log('=== Verification Examples Completed ===');
}

runVerificationExamples();