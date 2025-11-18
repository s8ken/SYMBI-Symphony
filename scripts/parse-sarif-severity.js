#!/usr/bin/env node
/**
 * SARIF Severity Parser Script
 * Parses SARIF reports from security tools (Trivy, OWASP DC, Semgrep)
 * and fails CI if HIGH or CRITICAL findings are present.
 * 
 * Bypass: Add "security-risk-accepted" label to PR
 */

const fs = require('fs');
const path = require('path');

/**
 * Parse a SARIF file and extract findings by severity
 */
function parseSarifFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  SARIF file not found: ${filePath}`);
    return { critical: [], high: [], medium: [], low: [] };
  }

  const sarif = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const findings = { critical: [], high: [], medium: [], low: [], info: [] };

  for (const run of sarif.runs || []) {
    const tool = run.tool?.driver?.name || 'Unknown';
    
    for (const result of run.results || []) {
      const ruleId = result.ruleId || 'unknown';
      const message = result.message?.text || 'No description';
      const level = result.level || 'warning';
      const locations = result.locations?.map(loc => 
        loc.physicalLocation?.artifactLocation?.uri || 'unknown'
      ) || [];

      // Map SARIF levels to severity
      let severity = 'low';
      if (level === 'error') {
        severity = result.properties?.['security-severity'] >= '8.0' ? 'critical' : 'high';
      } else if (level === 'warning') {
        severity = 'medium';
      } else if (level === 'note') {
        severity = 'low';
      }

      // Also check for explicit severity properties
      if (result.properties?.severity) {
        severity = result.properties.severity.toLowerCase();
      }

      const finding = {
        tool,
        ruleId,
        message,
        severity,
        locations
      };

      if (findings[severity]) {
        findings[severity].push(finding);
      } else {
        findings.low.push(finding);
      }
    }
  }

  return findings;
}

/**
 * Main function to check all SARIF reports
 */
function checkVulnerabilities() {
  console.log('🔍 Checking vulnerability severity in SARIF reports...\n');

  const sarifDir = path.join(__dirname, '..', 'sarif-reports');
  const findings = { critical: [], high: [], medium: [], low: [] };

  // Look for SARIF files
  if (fs.existsSync(sarifDir)) {
    const files = fs.readdirSync(sarifDir).filter(f => f.endsWith('.sarif') || f.endsWith('.json'));
    
    for (const file of files) {
      const filePath = path.join(sarifDir, file);
      console.log(`📄 Parsing ${file}...`);
      const parsed = parseSarifFile(filePath);
      
      findings.critical.push(...parsed.critical);
      findings.high.push(...parsed.high);
      findings.medium.push(...parsed.medium);
      findings.low.push(...parsed.low);
    }
  } else {
    console.log('⚠️  No sarif-reports directory found. Checking individual files...');
    
    // Check common locations
    const commonPaths = [
      path.join(__dirname, '..', 'trivy-results.sarif'),
      path.join(__dirname, '..', 'dependency-check-report.sarif'),
      path.join(__dirname, '..', 'semgrep.sarif')
    ];

    for (const filePath of commonPaths) {
      if (fs.existsSync(filePath)) {
        console.log(`📄 Parsing ${path.basename(filePath)}...`);
        const parsed = parseSarifFile(filePath);
        
        findings.critical.push(...parsed.critical);
        findings.high.push(...parsed.high);
        findings.medium.push(...parsed.medium);
        findings.low.push(...parsed.low);
      }
    }
  }

  // Report findings
  console.log('\n📊 Vulnerability Summary:');
  console.log(`   🔴 Critical: ${findings.critical.length}`);
  console.log(`   🟠 High:     ${findings.high.length}`);
  console.log(`   🟡 Medium:   ${findings.medium.length}`);
  console.log(`   🟢 Low:      ${findings.low.length}`);

  // Display critical findings
  if (findings.critical.length > 0) {
    console.log('\n🔴 CRITICAL Findings:');
    findings.critical.forEach((f, i) => {
      console.log(`\n${i + 1}. [${f.tool}] ${f.ruleId}`);
      console.log(`   ${f.message}`);
      if (f.locations.length > 0) {
        console.log(`   Location: ${f.locations[0]}`);
      }
    });
  }

  // Display high findings
  if (findings.high.length > 0) {
    console.log('\n🟠 HIGH Findings:');
    findings.high.forEach((f, i) => {
      console.log(`\n${i + 1}. [${f.tool}] ${f.ruleId}`);
      console.log(`   ${f.message}`);
      if (f.locations.length > 0) {
        console.log(`   Location: ${f.locations[0]}`);
      }
    });
  }

  // Fail if critical or high findings exist
  if (findings.critical.length > 0 || findings.high.length > 0) {
    console.error('\n❌ VULNERABILITY GATE FAILED');
    console.error(`   Found ${findings.critical.length} CRITICAL and ${findings.high.length} HIGH severity findings.`);
    console.error('\n   To bypass this check:');
    console.error('   1. Fix the vulnerabilities, OR');
    console.error('   2. Add "security-risk-accepted" label to the PR');
    process.exit(1);
  }

  console.log('\n✅ No HIGH or CRITICAL vulnerabilities found');
  process.exit(0);
}

// Run check
if (require.main === module) {
  checkVulnerabilities();
}

module.exports = { parseSarifFile, checkVulnerabilities };
