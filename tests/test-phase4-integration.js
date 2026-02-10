#!/usr/bin/env node

/**
 * Integration test for Phase 4 - Setup Step Execution
 * Tests the full orchestrator workflow with setup steps
 * Run: node tests/test-phase4-integration.js
 */

const path = require('path');
const manifestParser = require('../src/detectors/manifest-parser');
const setupExecutor = require('../src/core/setup-executor');

console.log('🧪 Phase 4 Integration Test\n');
console.log('='.repeat(60));

let testsPassed = 0;
let testsFailed = 0;

// Test 1: Parse example.onboard.yaml and execute setup steps (dry-run)
console.log('\n📋 Test 1: Execute setup steps from example.onboard.yaml (dry-run)');
console.log('-'.repeat(60));

(async () => {
  try {
    const manifestPath = path.join(__dirname, '../templates/example.onboard.yaml');
    const manifest = manifestParser.parseManifest(manifestPath);
    
    console.log(`✓ Manifest parsed: ${manifest.name}`);
    console.log(`✓ Setup steps found: ${manifest.setupSteps.length}`);
    
    // Execute in dry-run mode
    const result = await setupExecutor.executeSteps(manifest.setupSteps, { dryRun: true });
    
    if (result.success && result.executed === 3) {
      console.log('✅ PASSED - Setup steps executed (dry-run)');
      console.log(`   Steps: ${result.executed}/${manifest.setupSteps.length}`);
      testsPassed++;
    } else {
      console.log('❌ FAILED - Setup steps execution failed');
      console.log(`   Result:`, result);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    testsFailed++;
  }

  // Test 2: Parse complex.onboard.yaml and execute setup steps (dry-run)
  console.log('\n📋 Test 2: Execute setup steps from complex.onboard.yaml (dry-run)');
  console.log('-'.repeat(60));
  try {
    const manifestPath = path.join(__dirname, '../templates/complex.onboard.yaml');
    const manifest = manifestParser.parseManifest(manifestPath);
    
    console.log(`✓ Manifest parsed: ${manifest.name}`);
    console.log(`✓ Setup steps found: ${manifest.setupSteps.length}`);
    
    // Execute in dry-run mode
    const result = await setupExecutor.executeSteps(manifest.setupSteps, { dryRun: true });
    
    if (result.success && result.executed === 8) {
      console.log('✅ PASSED - Setup steps executed (dry-run)');
      console.log(`   Steps: ${result.executed}/${manifest.setupSteps.length}`);
      testsPassed++;
    } else {
      console.log('❌ FAILED - Setup steps execution failed');
      console.log(`   Result:`, result);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    testsFailed++;
  }

  // Test 3: Orchestrator integration (simulated)
  console.log('\n📋 Test 3: Orchestrator Step 4 integration (simulated)');
  console.log('-'.repeat(60));
  try {
    const orchestrator = require('../src/core/orchestrator');
    
    // Simulate orchestrator state
    const manifestPath = path.join(__dirname, '../templates/example.onboard.yaml');
    const manifest = manifestParser.parseManifest(manifestPath);
    
    const options = {
      dryRun: true,
      _state: {
        steps: [
          {
            id: 2,
            name: 'Parse Manifest',
            result: { manifest }
          }
        ]
      }
    };
    
    // Call Step 4 handler directly
    const result = await orchestrator.executeSetupSteps(
      'https://github.com/test/repo',
      { os: 'windows' },
      options
    );
    
    if (result.executed && result.summary.executed === 3) {
      console.log('✅ PASSED - Orchestrator Step 4 works correctly');
      console.log(`   Executed: ${result.summary.executed} steps`);
      testsPassed++;
    } else {
      console.log('❌ FAILED - Orchestrator integration failed');
      console.log(`   Result:`, result);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    testsFailed++;
  }

  // Test 4: Handle manifest with no setup steps
  console.log('\n📋 Test 4: Handle manifest with no setup steps');
  console.log('-'.repeat(60));
  try {
    const orchestrator = require('../src/core/orchestrator');
    
    const options = {
      dryRun: true,
      _state: {
        steps: [
          {
            id: 2,
            name: 'Parse Manifest',
            result: {
              manifest: {
                name: 'no-steps-project',
                dependencies: { system: [], npm: [], python: [] },
                environment: { required: [], optional: [] },
                setupSteps: []  // Empty
              }
            }
          }
        ]
      }
    };
    
    const result = await orchestrator.executeSetupSteps(
      'https://github.com/test/repo',
      { os: 'windows' },
      options
    );
    
    if (!result.executed && result.message === 'No setup steps in manifest') {
      console.log('✅ PASSED - Empty setup steps handled correctly');
      console.log(`   Message: ${result.message}`);
      testsPassed++;
    } else {
      console.log('❌ FAILED - Empty setup steps not handled correctly');
      console.log(`   Result:`, result);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    testsFailed++;
  }

  // Test 5: Handle missing manifest
  console.log('\n📋 Test 5: Handle missing manifest gracefully');
  console.log('-'.repeat(60));
  try {
    const orchestrator = require('../src/core/orchestrator');
    
    const options = {
      dryRun: true,
      _state: {
        steps: []  // No manifest in state
      }
    };
    
    const result = await orchestrator.executeSetupSteps(
      'https://github.com/test/repo',
      { os: 'windows' },
      options
    );
    
    if (!result.executed && result.error === 'Manifest not available') {
      console.log('✅ PASSED - Missing manifest handled correctly');
      console.log(`   Error: ${result.error}`);
      testsPassed++;
    } else {
      console.log('❌ FAILED - Missing manifest not handled correctly');
      console.log(`   Result:`, result);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    testsFailed++;
  }

  // Final Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Integration Test Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📈 Total: ${testsPassed + testsFailed}`);
  console.log(`🎯 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));
  
  if (testsFailed === 0) {
    console.log('\n🎉 Phase 4 Integration Tests Complete!\n');
    console.log('Ready for Quality Review (Phase 6)');
  }

  // Exit with appropriate code
  process.exit(testsFailed > 0 ? 1 : 0);
})();
