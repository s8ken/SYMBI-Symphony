#!/usr/bin/env node
/**
 * Coverage Merge Script
 * Merges JavaScript (lcov) and Python (coverage.xml) coverage reports
 * to produce a unified coverage-summary.json
 */

const fs = require('fs');
const path = require('path');

/**
 * Parse lcov coverage file
 */
function parseLcov(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  LCOV file not found: ${filePath}`);
    return { lines: 0, coveredLines: 0, branches: 0, coveredBranches: 0, functions: 0, coveredFunctions: 0 };
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  let totalLines = 0;
  let coveredLines = 0;
  let totalBranches = 0;
  let coveredBranches = 0;
  let totalFunctions = 0;
  let coveredFunctions = 0;

  let currentFile = null;
  const fileStats = {};

  for (const line of lines) {
    if (line.startsWith('SF:')) {
      currentFile = line.substring(3);
      fileStats[currentFile] = { lines: 0, coveredLines: 0 };
    } else if (line.startsWith('DA:')) {
      // Line coverage: DA:line_number,execution_count
      const parts = line.substring(3).split(',');
      totalLines++;
      if (parseInt(parts[1]) > 0) {
        coveredLines++;
      }
    } else if (line.startsWith('BRDA:')) {
      // Branch coverage: BRDA:line,block,branch,taken
      const parts = line.substring(5).split(',');
      totalBranches++;
      if (parts[3] !== '0' && parts[3] !== '-') {
        coveredBranches++;
      }
    } else if (line.startsWith('FN:')) {
      totalFunctions++;
    } else if (line.startsWith('FNDA:')) {
      // Function coverage: FNDA:execution_count,function_name
      const parts = line.substring(5).split(',');
      if (parseInt(parts[0]) > 0) {
        coveredFunctions++;
      }
    }
  }

  return {
    lines: totalLines,
    coveredLines,
    branches: totalBranches,
    coveredBranches,
    functions: totalFunctions,
    coveredFunctions
  };
}

/**
 * Parse Python coverage.xml file
 */
function parseCoverageXml(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Coverage XML file not found: ${filePath}`);
    return { lines: 0, coveredLines: 0 };
  }

  const content = fs.readFileSync(filePath, 'utf8');
  
  // Simple XML parsing for coverage data
  const linesMatch = content.match(/lines-covered="(\d+)"/);
  const linesValidMatch = content.match(/lines-valid="(\d+)"/);
  
  const coveredLines = linesMatch ? parseInt(linesMatch[1]) : 0;
  const totalLines = linesValidMatch ? parseInt(linesValidMatch[1]) : 0;

  return {
    lines: totalLines,
    coveredLines,
    branches: 0,
    coveredBranches: 0
  };
}

/**
 * Merge coverage reports
 */
function mergeCoverage() {
  console.log('📊 Merging coverage reports...\n');

  const lcovPath = path.join(__dirname, '..', 'coverage', 'lcov.info');
  const pythonCovPath = path.join(__dirname, '..', 'coverage', 'coverage.xml');
  const outputPath = path.join(__dirname, '..', 'coverage-summary.json');

  // Parse JavaScript coverage
  console.log('📄 Parsing JavaScript coverage (lcov)...');
  const jsCoverage = parseLcov(lcovPath);
  console.log(`   Lines: ${jsCoverage.coveredLines}/${jsCoverage.lines}`);
  console.log(`   Branches: ${jsCoverage.coveredBranches}/${jsCoverage.branches}`);
  console.log(`   Functions: ${jsCoverage.coveredFunctions}/${jsCoverage.functions}`);

  // Parse Python coverage
  console.log('\n📄 Parsing Python coverage (coverage.xml)...');
  const pyCoverage = parseCoverageXml(pythonCovPath);
  console.log(`   Lines: ${pyCoverage.coveredLines}/${pyCoverage.lines}`);

  // Merge totals
  const totalLines = jsCoverage.lines + pyCoverage.lines;
  const totalCoveredLines = jsCoverage.coveredLines + pyCoverage.coveredLines;
  const totalBranches = jsCoverage.branches + pyCoverage.branches;
  const totalCoveredBranches = jsCoverage.coveredBranches + pyCoverage.coveredBranches;
  const totalFunctions = jsCoverage.functions;
  const totalCoveredFunctions = jsCoverage.coveredFunctions;

  const lineCoverage = totalLines > 0 ? (totalCoveredLines / totalLines) * 100 : 0;
  const branchCoverage = totalBranches > 0 ? (totalCoveredBranches / totalBranches) * 100 : 0;
  const functionCoverage = totalFunctions > 0 ? (totalCoveredFunctions / totalFunctions) * 100 : 0;

  const summary = {
    total: {
      lines: {
        total: totalLines,
        covered: totalCoveredLines,
        percentage: parseFloat(lineCoverage.toFixed(2))
      },
      branches: {
        total: totalBranches,
        covered: totalCoveredBranches,
        percentage: parseFloat(branchCoverage.toFixed(2))
      },
      functions: {
        total: totalFunctions,
        covered: totalCoveredFunctions,
        percentage: parseFloat(functionCoverage.toFixed(2))
      }
    },
    javascript: {
      lines: {
        total: jsCoverage.lines,
        covered: jsCoverage.coveredLines,
        percentage: jsCoverage.lines > 0 ? parseFloat(((jsCoverage.coveredLines / jsCoverage.lines) * 100).toFixed(2)) : 0
      }
    },
    python: {
      lines: {
        total: pyCoverage.lines,
        covered: pyCoverage.coveredLines,
        percentage: pyCoverage.lines > 0 ? parseFloat(((pyCoverage.coveredLines / pyCoverage.lines) * 100).toFixed(2)) : 0
      }
    },
    timestamp: new Date().toISOString()
  };

  // Write summary
  fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));

  console.log('\n📊 Merged Coverage Summary:');
  console.log(`   Total Line Coverage:     ${summary.total.lines.percentage}%`);
  console.log(`   Total Branch Coverage:   ${summary.total.branches.percentage}%`);
  console.log(`   Total Function Coverage: ${summary.total.functions.percentage}%`);
  console.log(`\n✅ Coverage summary written to: ${outputPath}`);

  return summary;
}

// Run merge
if (require.main === module) {
  mergeCoverage();
}

module.exports = { mergeCoverage, parseLcov, parseCoverageXml };
