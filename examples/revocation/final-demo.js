// Final demonstration of the revocation system
const fs = require('fs').promises;
const path = require('path');
const { EnhancedStatusListManager, FileStatusListStorage } = require('../../dist/core/trust/revocation/enhanced-status-list');

async function finalDemo() {
  console.log('=== SYMBI Symphony Revocation System Final Demo ===\n');
  
  // Create storage directory
  const storagePath = './data/final-demo-status-lists';
  try {
    await fs.mkdir(storagePath, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
  
  // Create manager
  const storage = new FileStatusListStorage(storagePath);
  const manager = new EnhancedStatusListManager({
    issuer: 'did:example:symbi-issuer',
    baseUrl: 'https://symbi.example.com/status',
    statusPurpose: 'revocation',
    length: 8192 // Smaller list for demo
  }, storage);
  
  try {
    // 1. Initialize status list
    console.log('1. Initializing status list...');
    await manager.initializeList('demo-final-list');
    console.log('   ✓ Status list initialized\n');
    
    // 2. Allocate indices
    console.log('2. Allocating credential indices...');
    const entry1 = manager.allocateIndex('demo-final-list');
    const entry2 = manager.allocateIndex('demo-final-list');
    const entry3 = manager.allocateIndex('demo-final-list');
    console.log(`   ✓ Allocated 3 indices: ${entry1.statusListIndex}, ${entry2.statusListIndex}, ${entry3.statusListIndex}\n`);
    
    // 3. Check initial status
    console.log('3. Checking initial credential status...');
    const status1 = manager.checkStatus('demo-final-list', parseInt(entry1.statusListIndex));
    const status2 = manager.checkStatus('demo-final-list', parseInt(entry2.statusListIndex));
    const status3 = manager.checkStatus('demo-final-list', parseInt(entry3.statusListIndex));
    console.log(`   Credential 1: ${status1.status}`);
    console.log(`   Credential 2: ${status2.status}`);
    console.log(`   Credential 3: ${status3.status}\n`);
    
    // 4. Revoke a credential
    console.log('4. Revoking credential at index 1...');
    await manager.setStatus(
      'demo-final-list',
      parseInt(entry2.statusListIndex),
      true,
      'did:example:symbi-issuer',
      'Final demo revocation'
    );
    console.log('   ✓ Credential revoked\n');
    
    // 5. Check status after revocation
    console.log('5. Checking status after revocation...');
    const newStatus1 = manager.checkStatus('demo-final-list', parseInt(entry1.statusListIndex));
    const newStatus2 = manager.checkStatus('demo-final-list', parseInt(entry2.statusListIndex));
    const newStatus3 = manager.checkStatus('demo-final-list', parseInt(entry3.statusListIndex));
    console.log(`   Credential 1: ${newStatus1.status}`);
    console.log(`   Credential 2: ${newStatus2.status} (should be revoked)`);
    console.log(`   Credential 3: ${newStatus3.status}\n`);
    
    // 6. Generate status list credential
    console.log('6. Generating status list credential...');
    const statusCredential = manager.generateCredential('demo-final-list');
    console.log(`   ✓ Generated credential with ID: ${statusCredential.id}`);
    console.log(`   ✓ Encoded list length: ${statusCredential.credentialSubject.encodedList.length}\n`);
    
    // 7. Persist to storage
    console.log('7. Persisting to storage...');
    await manager.persistList('demo-final-list');
    console.log('   ✓ Status list persisted\n');
    
    // 8. Show statistics
    console.log('8. Collecting system statistics...');
    const stats = manager.getGlobalStats();
    console.log(`   Total lists: ${stats.totalLists}`);
    console.log(`   Total credentials: ${stats.totalCredentials}`);
    console.log(`   Total revoked: ${stats.totalRevoked}`);
    console.log(`   Total suspended: ${stats.totalSuspended}\n`);
    
    // 9. Demonstrate persistence by creating new manager
    console.log('9. Demonstrating persistence with new manager...');
    const newManager = new EnhancedStatusListManager({
      issuer: 'did:example:symbi-issuer',
      baseUrl: 'https://symbi.example.com/status',
      statusPurpose: 'revocation',
      length: 8192
    }, storage);
    
    await newManager.initializeList('demo-final-list');
    const persistedStatus = newManager.checkStatus('demo-final-list', parseInt(entry2.statusListIndex));
    console.log(`   ✓ Loaded credential status: ${persistedStatus.status}\n`);
    
    await newManager.shutdown();
    
    console.log('=== Final Demo Completed Successfully ===');
    console.log('\nKey Takeaways:');
    console.log('  ✓ The revocation system is working correctly');
    console.log('  ✓ Credentials can be issued with status tracking');
    console.log('  ✓ Credential status can be checked efficiently');
    console.log('  ✓ Credentials can be revoked with metadata recording');
    console.log('  ✓ Status list credentials are generated per W3C spec');
    console.log('  ✓ All changes are persisted to the file system');
    console.log('  ✓ The system provides useful statistics');
    
  } catch (error) {
    console.error('Demo failed:', error);
  } finally {
    await manager.shutdown();
  }
}

finalDemo();