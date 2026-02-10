/**
 * Test script for Phase 5 - Complete (P0 + P1 + P2)
 * 
 * Tests config-generator.js with all features:
 * - P0: ENV file generation
 * - P1: SSH key generation
 * - P2: Git configuration
 */

const configGenerator = require('../src/core/config-generator');
const manifestParser = require('../src/detectors/manifest-parser');
const path = require('path');
const fs = require('fs');

async function testPhase5Complete() {
  console.log('🧪 Testing Phase 5 - Complete (P0 + P1 + P2)\n');
  console.log('='.repeat(60));
  
  // Parse test manifest with ssh and git
  const manifestPath = path.join(__dirname, '..', 'templates', 'complete-config.yaml');
  const manifest = manifestParser.parseManifest(manifestPath);
  
  console.log(`\n✓ Loaded manifest: ${manifest.name}`);
  console.log(`  Environment vars: ${manifest.environment ? 'YES' : 'NO'}`);
  console.log(`  SSH generation: ${manifest.ssh?.generate ? 'YES' : 'NO'}`);
  console.log(`  Git configuration: ${manifest.git?.configure ? 'YES' : 'NO'}`);
  
  // Test dry-run mode (P0 + P1 + P2)
  console.log('\n📋 Test 1: Dry-run mode (All features)');
  console.log('-'.repeat(60));
  
  const dryRunResult = await configGenerator.generateConfigs(
    manifest,
    { os: 'Windows', platform: 'win32' },
    { dryRun: true }
  );
  
  console.log('\n✓ Dry-run completed');
  console.log(`  Generated: ${dryRunResult.generated}`);
  console.log(`  Summary:`, dryRunResult.summary);
  console.log(`  ENV files: ${dryRunResult.files.env.created.length}`);
  console.log(`  SSH files: ${dryRunResult.files.ssh.created.length}`);
  console.log(`  Git configs: ${dryRunResult.files.git.created.length}`);
  
  // Test actual generation (P0 only - skip SSH/Git for test safety)
  console.log('\n📋 Test 2: Actual generation (P0 ENV only)');
  console.log('-'.repeat(60));
  
  const envOnlyManifest = { ...manifest, ssh: undefined, git: undefined };
  
  const actualResult = await configGenerator.generateConfigs(
    envOnlyManifest,
    { os: 'Windows', platform: 'win32' },
    { dryRun: false }
  );
  
  console.log('\n✓ Generation completed');
  console.log(`  Generated: ${actualResult.generated}`);
  console.log(`  Summary:`, actualResult.summary);
  console.log(`  ENV files created:`, actualResult.files.env.created);
  
  // Verify files exist
  const projectRoot = process.cwd();
  const envFiles = ['.env.template', '.env.example', '.env'];
  
  console.log('\n📋 Test 3: Verify generated files');
  console.log('-'.repeat(60));
  
  let allExist = true;
  envFiles.forEach(file => {
    const exists = fs.existsSync(path.join(projectRoot, file));
    console.log(`  ${exists ? '✓' : '✗'} ${file}: ${exists ? 'EXISTS' : 'MISSING'}`);
    if (!exists) allExist = false;
  });
  
  if (!allExist) {
    throw new Error('Some expected files were not created');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ All Phase 5 tests passed!\n');
  
  // Cleanup test files
  console.log('🧹 Cleaning up test files...');
  envFiles.forEach(file => {
    try {
      fs.unlinkSync(path.join(projectRoot, file));
      console.log(`  ✓ Removed ${file}`);
    } catch (err) {
      // Ignore errors
    }
  });
  
  console.log('\n✅ Phase 5 Complete - Ready for commit!\n');
}

// Run test
testPhase5Complete().catch(error => {
  console.error('\n❌ Test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
});
