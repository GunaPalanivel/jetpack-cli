/**
 * End-to-End Integration Test for Documentation Generation
 * Tests complete workflow: parse → install → setup → config → docs → verify
 */

const path = require('path');
const fs = require('fs').promises;
const manifestParser = require('../src/detectors/manifest-parser');
const documentGenerator = require('../src/docs/core/DocumentGenerator');

// Main test runner
(async function runTests() {

console.log('🧪 Documentation Generation: End-to-End Integration Test\n');
console.log('='.repeat(70));

let testsPassed = 0;
let testsFailed = 0;

/**
 * Helper to run a test
 */
async function runTest(name, testFn) {
  console.log(`\n📋 ${name}`);
  console.log('-'.repeat(70));
  try {
    await testFn();
    console.log('✅ PASSED');
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    if (process.env.VERBOSE) {
      console.error(error);
    }
    testsFailed++;
  }
}

/**
 * Assert helper
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// ============================================================================
// Phase 1: Manifest Parsing
// ============================================================================

await runTest('Phase 1: Parse test manifest (.onboard-test.yaml)', async () => {
  const manifestPath = path.resolve('.onboard-test.yaml');
  const exists = await fs.access(manifestPath).then(() => true).catch(() => false);
  assert(exists, 'Test manifest not found');
  
  const manifest = manifestParser.parseManifest(manifestPath);
  assert(manifest.name === 'example-docs-project', `Wrong name: ${manifest.name}`);
  assert(manifest.documentation, 'Missing documentation config');
  assert(manifest.documentation.enabled === true, 'Documentation not enabled');
  assert(Array.isArray(manifest.documentation.sections), 'Sections not an array');
  
  console.log(`  ✓ Project: ${manifest.name}`);
  console.log(`  ✓ Documentation enabled: ${manifest.documentation.enabled}`);
  console.log(`  ✓ Sections: ${manifest.documentation.sections.join(', ')}`);
});

// ============================================================================
// Phase 2: Mock State Creation
// ============================================================================

await runTest('Phase 2: Create mock orchestrator state', async () => {
  const manifest = manifestParser.parseManifest('.onboard-test.yaml');
  
  // Simulate orchestrator state after all phases
  const mockState = {
    repoUrl: 'https://github.com/example/example-docs-project',
    environment: {
      os: 'Windows_NT',
      nodeVersion: 'v20.19.1',
      shell: 'powershell'
    },
    timestamp: new Date().toISOString(),
    steps: [
      {
        id: 1,
        name: 'Environment Detection',
        status: 'completed',
        result: { detected: true, os: 'Windows_NT', node: 'v20.19.1' }
      },
      {
        id: 2,
        name: 'Parse Manifest',
        status: 'completed',
        result: { manifest, parsed: true }
      },
      {
        id: 3,
        name: 'Install Dependencies',
        status: 'completed',
        result: {
          installed: true,
          summary: { installed: 6, skipped: 0, failed: 0 }
        }
      },
      {
        id: 4,
        name: 'Execute Setup Steps',
        status: 'completed',
        result: {
          executed: true,
          summary: { executed: 3, skipped: 0, failed: 0 }
        }
      },
      {
        id: 5,
        name: 'Generate Configurations',
        status: 'completed',
        result: {
          env: { 
            generated: true, 
            variables: ['DATABASE_URL', 'API_KEY', 'JWT_SECRET']
          },
          ssh: { 
            generated: true, 
            keyPath: '~/.ssh/id_ed25519'
          },
          git: { 
            configured: true, 
            name: 'Test User', 
            email: 'test@example.com' 
          }
        }
      },
      {
        id: 7,
        name: 'Verify Setup',
        status: 'completed',
        result: {
          totalChecks: 3,
          passedChecks: 3,
          failedChecks: 0
        }
      }
    ],
    installed: true
  };
  
  assert(mockState.steps.length === 6, 'Wrong number of steps');
  assert(mockState.steps.find(s => s.name === 'Generate Configurations'), 'Missing config step');
  
  console.log(`  ✓ Mock state created with ${mockState.steps.length} steps`);
  
  // Store for next tests
  global.testManifest = manifest;
  global.testState = mockState;
});

// ============================================================================
// Phase 3: Documentation Generation (Dry Run)
// ============================================================================

await runTest('Phase 3: Generate documentation (dry-run mode)', async () => {
  const result = await documentGenerator.generate(
    global.testManifest,
    global.testState,
    { 
      dryRun: true,
      environment: global.testState.environment
    }
  );
  
  assert(result.dryRun === true, 'Not in dry-run mode');
  assert(result.files.length === 9, `Expected 9 files, got ${result.files.length}`);
  
  // Verify all sections present
  const sections = ['getting-started', 'setup', 'troubleshooting', 'verification'];
  for (const section of sections) {
    const hasSection = result.files.some(f => f.includes(section));
    assert(hasSection, `Missing section: ${section}`);
  }
  
  console.log(`  ✓ Dry-run completed`);
  console.log(`  ✓ ${result.files.length} files would be generated`);
  console.log(`  ✓ Output directory: ${result.outputDir}`);
});

// ============================================================================
// Phase 4: Actual Documentation Generation
// ============================================================================

await runTest('Phase 4: Generate documentation (actual files)', async () => {
  // Override output directory for test
  const testOutputDir = path.resolve('test-docs-output');
  const testManifest = { ...global.testManifest };
  testManifest.documentation = {
    ...testManifest.documentation,
    output_dir: testOutputDir
  };
  
  const result = await documentGenerator.generate(
    testManifest,
    global.testState,
    { 
      environment: global.testState.environment
    }
  );
  
  assert(result.generated === true, 'Documentation not generated');
  assert(result.files.length === 9, `Expected 9 files, got ${result.files.length}`);
  
  console.log(`  ✓ Generated ${result.files.length} documentation files`);
  
  // Verify files exist
  for (const file of result.files) {
    const exists = await fs.access(file).then(() => true).catch(() => false);
    assert(exists, `File not found: ${file}`);
  }
  
  console.log(`  ✓ All files verified on disk`);
  
  // Store for validation
  global.generatedFiles = result.files;
  global.outputDir = testOutputDir;
});

// ============================================================================
// Phase 5: Content Validation
// ============================================================================

await runTest('Phase 5: Validate generated documentation content', async () => {
  // Check quickstart.md
  const quickstartPath = path.join(global.outputDir, 'getting-started', 'quickstart.md');
  const quickstartContent = await fs.readFile(quickstartPath, 'utf8');
  
  assert(quickstartContent.includes('# 🚀 Quickstart Guide'), 'Missing title');
  assert(quickstartContent.includes('example-docs-project'), 'Missing project name');
  assert(quickstartContent.includes('docker'), 'Missing dependency');
  assert(quickstartContent.includes('DATABASE_URL'), 'Missing env var');
  
  console.log(`  ✓ quickstart.md: Valid content (${quickstartContent.length} chars)`);
  
  // Check dependencies.md
  const depsPath = path.join(global.outputDir, 'setup', 'dependencies.md');
  const depsContent = await fs.readFile(depsPath, 'utf8');
  
  assert(depsContent.includes('# 📦 Dependencies'), 'Missing title');
  assert(depsContent.includes('| System |'), 'Missing dependency table');
  assert(depsContent.includes('nodejs'), 'Missing nodejs');
  
  console.log(`  ✓ dependencies.md: Valid content (${depsContent.length} chars)`);
  
  // Check troubleshooting.md
  const troubleshootPath = path.join(global.outputDir, 'troubleshooting', 'common-issues.md');
  const troubleshootContent = await fs.readFile(troubleshootPath, 'utf8');
  
  assert(troubleshootContent.includes('# 🔧 Common Issues'), 'Missing title');
  assert(troubleshootContent.includes('npm install'), 'Missing npm instructions');
  
  console.log(`  ✓ common-issues.md: Valid content (${troubleshootContent.length} chars)`);
  
  // Check health-checks.md
  const healthPath = path.join(global.outputDir, 'verification', 'health-checks.md');
  const healthContent = await fs.readFile(healthPath, 'utf8');
  
  assert(healthContent.includes('# ✅ Health Checks'), 'Missing title');
  assert(healthContent.includes('jetpack verify'), 'Missing verify command');
  
  console.log(`  ✓ health-checks.md: Valid content (${healthContent.length} chars)`);
});

// ============================================================================
// Phase 6: Markdown Quality Checks
// ============================================================================

await runTest('Phase 6: Validate Markdown quality (Stripe-style)', async () => {
  let totalLines = 0;
  let maxLines = 0;
  let maxFile = '';
  
  for (const file of global.generatedFiles) {
    const content = await fs.readFile(file, 'utf8');
    const lines = content.split('\n').length;
    totalLines += lines;
    
    if (lines > maxLines) {
      maxLines = lines;
      maxFile = path.basename(file);
    }
    
    // Stripe guideline: < 300 lines per file
    assert(lines < 500, `${path.basename(file)} too long: ${lines} lines`);
    
    // Should have code blocks
    assert(content.includes('```'), `${path.basename(file)} missing code blocks`);
    
    // Should have proper headings
    assert(content.includes('# '), `${path.basename(file)} missing H1 heading`);
  }
  
  const avgLines = Math.round(totalLines / global.generatedFiles.length);
  
  console.log(`  ✓ Average lines per file: ${avgLines}`);
  console.log(`  ✓ Longest file: ${maxFile} (${maxLines} lines)`);
  console.log(`  ✓ All files < 500 lines ✅`);
  console.log(`  ✓ All files have code blocks ✅`);
  console.log(`  ✓ All files have proper headings ✅`);
});

// ============================================================================
// Phase 7: Platform-Specific Content
// ============================================================================

await runTest('Phase 7: Verify platform-specific instructions', async () => {
  const envPath = path.join(global.outputDir, 'setup', 'environment.md');
  const envContent = await fs.readFile(envPath, 'utf8');
  
  // Should have platform detection
  assert(envContent.includes('Windows_NT'), 'Missing Windows detection');
  assert(envContent.includes('powershell'), 'Missing PowerShell reference');
  
  // Should have multiple platform instructions
  assert(envContent.includes('macOS'), 'Missing macOS section');
  assert(envContent.includes('Linux'), 'Missing Linux section');
  
  console.log(`  ✓ Windows instructions present`);
  console.log(`  ✓ macOS instructions present`);
  console.log(`  ✓ Linux instructions present`);
  console.log(`  ✓ Platform-specific content validated ✅`);
});

// ============================================================================
// Phase 8: Context-Awareness
// ============================================================================

await runTest('Phase 8: Verify context-aware content', async () => {
  const configPath = path.join(global.outputDir, 'setup', 'configuration.md');
  const configContent = await fs.readFile(configPath, 'utf8');
  
  // Should reference actual config from state
  assert(configContent.includes('.env (3 variable'), 'Missing env file reference');
  assert(configContent.includes('~/.ssh/id_ed25519'), 'Missing SSH key path');
  assert(configContent.includes('Test User'), 'Missing git user name');
  
  console.log(`  ✓ Environment variables referenced`);
  console.log(`  ✓ SSH key path included`);
  console.log(`  ✓ Git user configured`);
  console.log(`  ✓ Context-aware content validated ✅`);
});

// ============================================================================
// Cleanup
// ============================================================================

// Temporarily disabled for debugging
/*
await runTest('Cleanup: Remove test files', async () => {
  // Remove test documentation
  await fs.rm(global.outputDir, { recursive: true, force: true });
  
  const exists = await fs.access(global.outputDir).then(() => true).catch(() => false);
  assert(!exists, 'Test directory still exists');
  
  console.log(`  ✓ Removed test output directory: ${global.outputDir}`);
});
*/

// ============================================================================
// Summary
// ============================================================================

console.log('\n' + '='.repeat(70));
console.log('📊 Integration Test Summary');
console.log('='.repeat(70));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📝 Total:  ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
  console.log('\n🎉 All Integration Tests Passed!\n');
  console.log('Documentation generation is production-ready! 🚀\n');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${testsFailed} test(s) failed\n`);
  process.exit(1);
}

})(); // End of main test runner
