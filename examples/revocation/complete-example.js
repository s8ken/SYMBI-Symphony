// Complete example showing revocation with verifiable credentials
const fs = require('fs').promises;
const path = require('path');
const { EnhancedStatusListManager, FileStatusListStorage } = require('../../dist/core/trust/revocation/enhanced-status-list');

// Mock DID document for issuer
const issuerDidDoc = {
  "@context": "https://www.w3.org/ns/did/v1",
  "id": "did:example:issuer123",
  "verificationMethod": [{
    "id": "did:example:issuer123#key-1",
    "type": "Ed25519VerificationKey2020",
    "controller": "did:example:issuer123",
    "publicKeyMultibase": "zH3C2AVvLMv6gmMNam3uVAjZpfkcJCwDwnZn6z3wXmqPV"
  }],
  "authentication": ["did:example:issuer123#key-1"],
  "assertionMethod": ["did:example:issuer123#key-1"]
};

// Mock DID document for holder
const holderDidDoc = {
  "@context": "https://www.w3.org/ns/did/v1",
  "id": "did:example:holder456",
  "verificationMethod": [{
    "id": "did:example:holder456#key-1",
    "type": "Ed25519VerificationKey2020",
    "controller": "did:example:holder456",
    "publicKeyMultibase": "zH3C2AVvLMv6gmMNam3uVAjZpfkcJCwDwnZn6z3wXmqPV"
  }],
  "authentication": ["did:example:holder456#key-1"]
};

// Mock verifiable credential
const createCredential = (id, subjectId, statusEntry) => {
  return {
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      "https://www.w3.org/2018/credentials/examples/v1"
    ],
    "id": `http://example.gov/credentials/${id}`,
    "type": ["VerifiableCredential", "UniversityDegreeCredential"],
    "issuer": "did:example:issuer123",
    "issuanceDate": "2025-01-01T19:23:24Z",
    "credentialSubject": {
      "id": subjectId,
      "degree": {
        "type": "BachelorDegree",
        "name": "Bachelor of Science and Arts"
      }
    },
    "credentialStatus": statusEntry
  };
};

async function runCompleteExample() {
  console.log('=== Complete Revocation Example ===\n');
  
  // Create storage directory if it doesn't exist
  const storagePath = './data/complete-example-status-lists';
  try {
    await fs.mkdir(storagePath, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
  
  // Create a file storage instance
  const storage = new FileStatusListStorage(storagePath);
  
  // Create manager with configuration
  const manager = new EnhancedStatusListManager({
    issuer: 'did:example:issuer123',
    baseUrl: 'https://example.com/status',
    statusPurpose: 'revocation',
    length: 131072 // Default length
  }, storage);
  
  try {
    // Initialize a new status list for university degrees
    await manager.initializeList('university-degrees');
    console.log('1. Initialized status list: university-degrees\n');
    
    // Issue several credentials
    console.log('2. Issuing credentials...');
    const entry1 = manager.allocateIndex('university-degrees');
    const credential1 = createCredential('1872', 'did:example:holder456', entry1);
    console.log('   Issued credential 1872 with status index:', entry1.statusListIndex);
    
    const entry2 = manager.allocateIndex('university-degrees');
    const credential2 = createCredential('1873', 'did:example:holder789', entry2);
    console.log('   Issued credential 1873 with status index:', entry2.statusListIndex);
    
    const entry3 = manager.allocateIndex('university-degrees');
    const credential3 = createCredential('1874', 'did:example:holder012', entry3);
    console.log('   Issued credential 1874 with status index:', entry3.statusListIndex);
    
    // Save credentials to files
    await fs.writeFile(
      path.join('./examples/revocation', 'credential-1872.json'),
      JSON.stringify(credential1, null, 2)
    );
    
    await fs.writeFile(
      path.join('./examples/revocation', 'credential-1873.json'),
      JSON.stringify(credential2, null, 2)
    );
    
    await fs.writeFile(
      path.join('./examples/revocation', 'credential-1874.json'),
      JSON.stringify(credential3, null, 2)
    );
    
    console.log('   Saved credentials to files\n');
    
    // Generate initial status list credential
    const initialStatusCredential = manager.generateCredential('university-degrees');
    await fs.writeFile(
      path.join('./examples/revocation', 'status-list-initial.json'),
      JSON.stringify(initialStatusCredential, null, 2)
    );
    console.log('3. Generated initial status list credential\n');
    
    // Verify all credentials are active
    console.log('4. Verifying initial status of credentials:');
    const status1 = manager.checkStatus('university-degrees', parseInt(entry1.statusListIndex));
    const status2 = manager.checkStatus('university-degrees', parseInt(entry2.statusListIndex));
    const status3 = manager.checkStatus('university-degrees', parseInt(entry3.statusListIndex));
    
    console.log('   Credential 1872 status:', status1.status);
    console.log('   Credential 1873 status:', status2.status);
    console.log('   Credential 1874 status:', status3.status);
    console.log('');
    
    // Revoke credential 1873
    console.log('5. Revoking credential 1873...');
    await manager.setStatus(
      'university-degrees', 
      parseInt(entry2.statusListIndex), 
      true, 
      'did:example:issuer123', 
      'Academic misconduct violation'
    );
    console.log('   Revoked credential at index:', entry2.statusListIndex);
    
    // Generate updated status list credential
    const updatedStatusCredential = manager.generateCredential('university-degrees');
    await fs.writeFile(
      path.join('./examples/revocation', 'status-list-updated.json'),
      JSON.stringify(updatedStatusCredential, null, 2)
    );
    console.log('   Generated updated status list credential\n');
    
    // Verify statuses after revocation
    console.log('6. Verifying status after revocation:');
    const newStatus1 = manager.checkStatus('university-degrees', parseInt(entry1.statusListIndex));
    const newStatus2 = manager.checkStatus('university-degrees', parseInt(entry2.statusListIndex));
    const newStatus3 = manager.checkStatus('university-degrees', parseInt(entry3.statusListIndex));
    
    console.log('   Credential 1872 status:', newStatus1.status);
    console.log('   Credential 1873 status:', newStatus2.status, '(should be revoked)');
    console.log('   Credential 1874 status:', newStatus3.status);
    console.log('');
    
    // Demonstrate verification process
    console.log('7. Demonstrating verification process:');
    console.log('   To verify a credential status, a verifier would:');
    console.log('   a. Extract the credentialStatus property from the VC');
    console.log('   b. Fetch the status list credential from the URL');
    console.log('   c. Decode the bitstring and check the specific index');
    console.log('');
    
    // Show the status entry for credential 1873
    console.log('   Credential 1873 status entry:');
    console.log('     Status list credential URL:', entry2.statusListCredential);
    console.log('     Status list index:', entry2.statusListIndex);
    console.log('');
    
    // Show the updated status list credential
    console.log('   Updated status list credential:');
    console.log('     ID:', updatedStatusCredential.id);
    console.log('     Encoded list length:', updatedStatusCredential.credentialSubject.encodedList.length);
    console.log('');
    
    // Persist all changes
    await manager.persistList('university-degrees');
    console.log('8. Persisted status list to file system\n');
    
    // Get and display statistics
    const stats = manager.getGlobalStats();
    console.log('9. Status list statistics:');
    console.log('   Total lists:', stats.totalLists);
    console.log('   Total credentials issued:', stats.totalCredentials);
    console.log('   Total revoked:', stats.totalRevoked);
    console.log('   Total suspended:', stats.totalSuspended);
    console.log('');
    
    // Demonstrate loading from persistence
    console.log('10. Demonstrating persistence by creating new manager...');
    const newManager = new EnhancedStatusListManager({
      issuer: 'did:example:issuer123',
      baseUrl: 'https://example.com/status',
      statusPurpose: 'revocation',
      length: 131072
    }, storage);
    
    await newManager.initializeList('university-degrees');
    const persistedStatus = newManager.checkStatus('university-degrees', parseInt(entry2.statusListIndex));
    console.log('    Loaded status for credential 1873:', persistedStatus.status);
    await newManager.shutdown();
    console.log('');
    
    console.log('=== Example Completed Successfully ===');
    
  } catch (error) {
    console.error('Example failed:', error);
  } finally {
    await manager.shutdown();
  }
}

runCompleteExample();