#!/usr/bin/env node
/**
 * Audit Integrity Verification CLI
 * 
 * Verifies the cryptographic integrity and hash-chain of the audit log.
 * Exits with non-zero status if verification fails.
 * 
 * Usage:
 *   npm run audit:integrity
 *   tsx scripts/audit-integrity.ts
 */

import {
  initializeEnhancedAuditLogger,
  verifyAuditIntegrity,
  EnhancedAuditConfig,
} from '../src/core/trust/audit';

async function main(): Promise<void> {
  console.log('🔍 Starting audit log integrity verification...\n');

  try {
    // Initialize audit logger in read-only mode
    // Using memory backend by default, can be configured via environment
    const config: EnhancedAuditConfig = {
      enabled: true,
      signEntries: false, // We're just reading
      storageBackend: (process.env.AUDIT_STORAGE_BACKEND as any) || 'memory',
      storagePath: process.env.AUDIT_STORAGE_PATH || '.audit-log',
      persistence: {
        type: (process.env.AUDIT_STORAGE_BACKEND as any) || 'memory',
        config: {
          path: process.env.AUDIT_STORAGE_PATH || '.audit-log',
        },
      },
    };

    initializeEnhancedAuditLogger(config);

    // Run integrity verification
    const result = await verifyAuditIntegrity();

    // Display results
    console.log('📊 Verification Results:');
    console.log(`   Total entries: ${result.totalEntries}`);
    console.log(`   Verified entries: ${result.verifiedEntries}`);
    console.log(`   Failed entries: ${result.failedEntries}`);
    console.log(`   Hash chain intact: ${!result.brokenChain ? '✅' : '❌'}`);
    console.log(`   Overall status: ${result.valid ? '✅ VALID' : '❌ INVALID'}\n`);

    if (!result.valid) {
      console.error('❌ Audit log integrity verification FAILED!\n');
      
      if (result.errors.length > 0) {
        console.error('Errors found:');
        for (const error of result.errors.slice(0, 10)) {
          console.error(`  - Entry ${error.entryId}: ${error.error}`);
        }
        
        if (result.errors.length > 10) {
          console.error(`  ... and ${result.errors.length - 10} more errors`);
        }
      }
      
      process.exit(1);
    }

    console.log('✅ Audit log integrity verification PASSED!\n');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error during integrity verification:');
    console.error(`   ${error.message}\n`);
    
    if (error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
