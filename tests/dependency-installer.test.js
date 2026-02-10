/**
 * Test suite for dependency-installer
 * Tests installation logic with dry-run mode
 * Run: node tests/test-dependency-installer.js
 */

const installer = require('../src/core/dependency-installer');
const logger = require('../src/ui/logger');

console.log('🧪 Testing Dependency Installer\n');
console.log('='.repeat(60));

let testsPassed = 0;
let testsFailed = 0;

// Helper function to run tests
async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ PASSED: ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAILED: ${name}`);
    console.log(`   Error: ${error.message}`);
    testsFailed++;
  }
}

// Test environment mock
const mockEnvironment = {
  os: 'Windows',
  platform: 'win32',
  packageManagers: {
    npm: true,
    chocolatey: true,
    scoop: false,
    winget: false
  }
};

// Main test runner
(async () => {

// Test 1: Empty dependencies
console.log('\n📋 Test 1: Empty dependencies');
console.log('-'.repeat(60));

await test('Handle empty dependencies', async () => {
  const result = await installer.installDependencies(
    { system: [], npm: [], python: [] },
    mockEnvironment,
    { dryRun: true }
  );
  
  if (result.summary.installed !== 0) {
    throw new Error(`Expected 0 installed, got ${result.summary.installed}`);
  }
});

// Test 2: Dry-run mode
console.log('\n📋 Test 2: Dry-run mode');
console.log('-'.repeat(60));

await test('Dry-run does not execute commands', async () => {
  const result = await installer.installDependencies(
    {
      system: ['git'],
      npm: ['eslint'],
      python: ['requests']
    },
    mockEnvironment,
    { dryRun: true }
  );
  
  // In dry-run, all packages should be marked as "installed" (would install)
  if (result.summary.installed === 0 && result.summary.skipped === 0) {
    throw new Error('Dry-run should show packages that would be installed');
  }
});

// Test 3: Summary calculation
console.log('\n📋 Test 3: Summary calculation');
console.log('-'.repeat(60));

await test('Calculate summary correctly', async () => {
  const testResults = {
    system: { installed: ['git'], skipped: ['nodejs'], failed: [] },
    npm: { installed: ['eslint'], skipped: [], failed: [] },
    python: { installed: [], skipped: [], failed: [{ package: 'requests', reason: 'pip not found' }] }
  };
  
  const summary = installer.calculateSummary(testResults);
  
  if (summary.installed !== 2) {
    throw new Error(`Expected 2 installed, got ${summary.installed}`);
  }
  if (summary.skipped !== 1) {
    throw new Error(`Expected 1 skipped, got ${summary.skipped}`);
  }
  if (summary.failed !== 1) {
    throw new Error(`Expected 1 failed, got ${summary.failed}`);
  }
});

// Test 4: No package manager
console.log('\n📋 Test 4: No package manager available');
console.log('-'.repeat(60));

await test('Handle missing package manager gracefully', async () => {
  const noManagerEnv = {
    os: 'Linux',
    platform: 'linux',
    packageManagers: {
      npm: false,
      apt: false,
      yum: false
    }
  };
  
  const result = await installer.installDependencies(
    { system: ['git'], npm: [], python: [] },
    noManagerEnv,
    { dryRun: true }
  );
  
  // Should fail gracefully
  if (result.system.failed.length === 0) {
    throw new Error('Should report failure when no package manager available');
  }
});

// Test 5: Mixed results
console.log('\n📋 Test 5: Mixed installation results');
console.log('-'.repeat(60));

await test('Handle mixed success/failure scenarios', async () => {
  // This test verifies the structure is correct
  const result = await installer.installDependencies(
    {
      system: ['git', 'nodejs'],
      npm: ['eslint', 'prettier'],
      python: []
    },
    mockEnvironment,
    { dryRun: true }
  );
  
  // Check result structure
  if (!result.system || !result.npm || !result.python) {
    throw new Error('Result should have system, npm, and python properties');
  }
  
  if (!result.summary) {
    throw new Error('Result should have summary property');
  }
  
  if (typeof result.summary.installed !== 'number') {
    throw new Error('Summary.installed should be a number');
  }
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 Test Results:');
console.log(`   ✅ Passed: ${testsPassed}`);
console.log(`   ❌ Failed: ${testsFailed}`);
console.log(`   Total: ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
  console.log('\n✅ All tests passed!\n');
  process.exit(0);
} else {
  console.log(`\n❌ ${testsFailed} test(s) failed\n`);
  process.exit(1);
}

})(); // End of async IIFE
