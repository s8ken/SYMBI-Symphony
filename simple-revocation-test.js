#!/usr/bin/env node

/**
 * Simple test to check if revocation modules can be imported
 */

console.log('Testing revocation module imports...');

try {
  const { EnhancedStatusListManager } = require('./dist/core/trust/revocation/enhanced-status-list');
  console.log('✅ EnhancedStatusListManager imported successfully');
} catch (error) {
  console.log('❌ Failed to import EnhancedStatusListManager:', error.message);
}

try {
  const { Bitstring } = require('./dist/core/trust/revocation/bitstring');
  console.log('✅ Bitstring imported successfully');
} catch (error) {
  console.log('❌ Failed to import Bitstring:', error.message);
}

console.log('Import test complete.');