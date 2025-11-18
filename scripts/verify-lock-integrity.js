#!/usr/bin/env node
/**
 * Lockfile Integrity Verification Script
 * Computes SHA256 checksums of lockfiles and compares against tracked values.
 * Fails if mismatch detected unless:
 * - Commit message includes "chore(deps)"
 * - PR has "dependency-update" label
 */

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const CHECKSUMS_FILE = path.join(__dirname, '..', 'LOCKFILE_CHECKSUMS.json');
const LOCKFILE = path.join(__dirname, '..', 'package-lock.json');

/**
 * Compute SHA256 checksum of a file
 */
function computeChecksum(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

/**
 * Main verification function
 */
function verifyLockfileIntegrity() {
  console.log('🔒 Verifying lockfile integrity...');

  // Load tracked checksums
  if (!fs.existsSync(CHECKSUMS_FILE)) {
    console.error('❌ LOCKFILE_CHECKSUMS.json not found!');
    process.exit(1);
  }

  const checksums = JSON.parse(fs.readFileSync(CHECKSUMS_FILE, 'utf8'));
  let hasErrors = false;

  // Verify package-lock.json
  if (fs.existsSync(LOCKFILE)) {
    const currentChecksum = computeChecksum(LOCKFILE);
    const trackedChecksum = checksums.lockfiles['package-lock.json']?.checksum;

    console.log(`\n📦 package-lock.json`);
    console.log(`   Current:  ${currentChecksum}`);
    console.log(`   Expected: ${trackedChecksum}`);

    if (currentChecksum !== trackedChecksum) {
      console.error('\n❌ CHECKSUM MISMATCH DETECTED!');
      console.error('   package-lock.json has been modified.');
      console.error('\n   If this is a legitimate dependency update:');
      console.error('   1. Ensure commit message includes "chore(deps)", OR');
      console.error('   2. Add "dependency-update" label to PR, OR');
      console.error('   3. Update LOCKFILE_CHECKSUMS.json with new checksum:');
      console.error(`      ${currentChecksum}`);
      hasErrors = true;
    } else {
      console.log('   ✅ Checksum verified');
    }
  }

  // Check for poetry.lock if present
  const poetryLock = path.join(__dirname, '..', 'poetry.lock');
  if (fs.existsSync(poetryLock) && checksums.lockfiles['poetry.lock']) {
    const currentChecksum = computeChecksum(poetryLock);
    const trackedChecksum = checksums.lockfiles['poetry.lock'].checksum;

    console.log(`\n📦 poetry.lock`);
    console.log(`   Current:  ${currentChecksum}`);
    console.log(`   Expected: ${trackedChecksum}`);

    if (currentChecksum !== trackedChecksum) {
      console.error('\n❌ CHECKSUM MISMATCH DETECTED!');
      console.error('   poetry.lock has been modified.');
      hasErrors = true;
    } else {
      console.log('   ✅ Checksum verified');
    }
  }

  if (hasErrors) {
    console.error('\n❌ Lockfile integrity check FAILED');
    process.exit(1);
  } else {
    console.log('\n✅ All lockfile checksums verified successfully');
    process.exit(0);
  }
}

// Run verification
if (require.main === module) {
  verifyLockfileIntegrity();
}

module.exports = { verifyLockfileIntegrity, computeChecksum };
