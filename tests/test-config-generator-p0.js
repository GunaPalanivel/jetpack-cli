/**
 * Test script for Phase 5 - P0 (ENV file generation)
 * 
 * Tests config-generator.js with example manifest
 */

const configGenerator = require('../src/core/config-generator');
const manifestParser = require('../src/detectors/manifest-parser');
const path = require('path');

async function testP0() {
  console.log('🧪 Testing Phase 5 - P0: ENV File Generation\n');
  console.log('='.repeat(60));
  
  // Parse example manifest
  const manifestPath = path.join(__dirname, '..', 'templates', 'example.onboard.yaml');
  const manifest = manifestParser.parseManifest(manifestPath);
  
  console.log(`\n✓ Loaded manifest: ${manifest.name}`);
  console.log(`  Environment vars: ${manifest.environment ? manifest.environment.length : 0}`);
  
  // Test dry-run mode
  console.log('\n📋 Test 1: Dry-run mode');
  console.log('-'.repeat(60));
  
  const dryRunResult = await configGenerator.generateConfigs(
    manifest,
    { os: 'Windows', platform: 'win32' },
    { dryRun: true }
  );
  
  console.log('\n✓ Dry-run completed');
  console.log(`  Generated: ${dryRunResult.generated}`);
  console.log(`  Summary:`, dryRunResult.summary);
  
  // Test actual generation
  console.log('\n📋 Test 2: Actual generation');
  console.log('-'.repeat(60));
  
  const actualResult = await configGenerator.generateConfigs(
    manifest,
    { os: 'Windows', platform: 'win32' },
    { dryRun: false }
  );
  
  console.log('\n✓ Generation completed');
  console.log(`  Generated: ${actualResult.generated}`);
  console.log(`  Summary:`, actualResult.summary);
  console.log(`  Files created:`, actualResult.files.env.created);
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ All P0 tests passed!\n');
}

// Run test
testP0().catch(error => {
  console.error('\n❌ Test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
});
