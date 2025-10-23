// Test script to demonstrate revocation functionality
const { EnhancedStatusListManager, FileStatusListStorage } = require('./dist/core/trust/revocation/enhanced-status-list');

async function runDemo() {
  console.log('Revocation Demo Started');
  
  // Create a file storage instance
  const storage = new FileStatusListStorage('./data/demo-status-lists');
  
  // Create manager with configuration
  const manager = new EnhancedStatusListManager({
    issuer: 'did:example:demo-issuer',
    baseUrl: 'https://demo.example.com/status',
    statusPurpose: 'revocation',
    length: 1024
  }, storage);
  
  try {
    // Initialize a new status list
    await manager.initializeList('demo-list-1');
    console.log('Initialized status list: demo-list-1');
    
    // Allocate indices for credentials
    const entry1 = manager.allocateIndex('demo-list-1');
    const entry2 = manager.allocateIndex('demo-list-1');
    const entry3 = manager.allocateIndex('demo-list-1');
    
    console.log('Allocated entries:');
    console.log('  Entry 1:', entry1.statusListIndex);
    console.log('  Entry 2:', entry2.statusListIndex);
    console.log('  Entry 3:', entry3.statusListIndex);
    
    // Revoke the second credential
    const indexToRevoke = parseInt(entry2.statusListIndex);
    await manager.setStatus('demo-list-1', indexToRevoke, true, 'did:example:revoker', 'Demo revocation reason');
    console.log('Revoked credential at index:', indexToRevoke);
    
    // Check status of all credentials
    const status1 = manager.checkStatus('demo-list-1', parseInt(entry1.statusListIndex));
    const status2 = manager.checkStatus('demo-list-1', parseInt(entry2.statusListIndex));
    const status3 = manager.checkStatus('demo-list-1', parseInt(entry3.statusListIndex));
    
    console.log('Status checks:');
    console.log('  Credential 1 status:', status1.status);
    console.log('  Credential 2 status:', status2.status);
    console.log('  Credential 3 status:', status3.status);
    
    // Generate status list credential
    const credential = manager.generateCredential('demo-list-1');
    console.log('Generated StatusList2021Credential:');
    console.log('  ID:', credential.id);
    console.log('  Issuer:', credential.issuer);
    console.log('  Encoded list length:', credential.credentialSubject.encodedList.length);
    
    // Persist the list
    await manager.persistList('demo-list-1');
    console.log('Persisted status list to file system');
    
    // Get statistics
    const stats = manager.getGlobalStats();
    console.log('Global statistics:');
    console.log('  Total lists:', stats.totalLists);
    console.log('  Total credentials:', stats.totalCredentials);
    console.log('  Total revoked:', stats.totalRevoked);
    console.log('  Total suspended:', stats.totalSuspended);
    
    // Create a new manager with the same storage to demonstrate persistence
    const newManager = new EnhancedStatusListManager({
      issuer: 'did:example:demo-issuer',
      baseUrl: 'https://demo.example.com/status',
      statusPurpose: 'revocation',
      length: 1024
    }, storage);
    
    // Load existing list
    await newManager.initializeList('demo-list-1');
    console.log('Loaded existing status list in new manager');
    
    // Verify the revoked status is preserved
    const newStatus2 = newManager.checkStatus('demo-list-1', parseInt(entry2.statusListIndex));
    console.log('Status check in new manager:');
    console.log('  Credential 2 status:', newStatus2.status);
    
    await newManager.shutdown();
  } catch (error) {
    console.error('Demo failed:', error);
  } finally {
    await manager.shutdown();
  }
  
  console.log('Revocation Demo Completed');
}

runDemo();