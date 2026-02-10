#!/usr/bin/env node

/**
 * Test script for setup step executor
 * Run: node tests/test-setup-executor.js
 */

const setupExecutor = require('../src/core/setup-executor');

console.log('🧪 Testing Setup Step Executor\n');
console.log('='.repeat(60));

let testsPassed = 0;
let testsFailed = 0;

// Test 1: Validate valid step
console.log('\n📋 Test 1: Validate valid step');
console.log('-'.repeat(60));
try {
  const validStep = {
    name: 'Install dependencies',
    command: 'npm install',
    description: 'Install all Node.js dependencies'
  };
  
  const error = setupExecutor.validateStep(validStep, 1);
  
  if (error === null) {
    console.log('✅ PASSED - Valid step accepted');
    testsPassed++;
  } else {
    console.log('❌ FAILED - Valid step rejected:', error);
    testsFailed++;
  }
} catch (error) {
  console.log('❌ FAILED:', error.message);
  testsFailed++;
}

// Test 2: Validate step with missing command
console.log('\n📋 Test 2: Reject step with missing command');
console.log('-'.repeat(60));
try {
  const invalidStep = {
    name: 'Install dependencies'
    // Missing command field
  };
  
  const error = setupExecutor.validateStep(invalidStep, 1);
  
  if (error && error.includes('command')) {
    console.log('✅ PASSED - Missing command detected');
    console.log(`   Error: ${error}`);
    testsPassed++;
  } else {
    console.log('❌ FAILED - Missing command not detected');
    testsFailed++;
  }
} catch (error) {
  console.log('❌ FAILED:', error.message);
  testsFailed++;
}

// Test 3: Validate step with empty command
console.log('\n📋 Test 3: Reject step with empty command');
console.log('-'.repeat(60));
try {
  const invalidStep = {
    name: 'Install dependencies',
    command: '   '  // Empty/whitespace only
  };
  
  const error = setupExecutor.validateStep(invalidStep, 1);
  
  if (error && error.includes('empty')) {
    console.log('✅ PASSED - Empty command detected');
    console.log(`   Error: ${error}`);
    testsPassed++;
  } else {
    console.log('❌ FAILED - Empty command not detected');
    testsFailed++;
  }
} catch (error) {
  console.log('❌ FAILED:', error.message);
  testsFailed++;
}

// Test 4: Validate step with invalid command type
console.log('\n📋 Test 4: Reject step with non-string command');
console.log('-'.repeat(60));
try {
  const invalidStep = {
    name: 'Install dependencies',
    command: 123  // Number instead of string
  };
  
  const error = setupExecutor.validateStep(invalidStep, 1);
  
  if (error && error.includes('string')) {
    console.log('✅ PASSED - Invalid command type detected');
    console.log(`   Error: ${error}`);
    testsPassed++;
  } else {
    console.log('❌ FAILED - Invalid command type not detected');
    testsFailed++;
  }
} catch (error) {
  console.log('❌ FAILED:', error.message);
  testsFailed++;
}

// Test 5: Validate step with invalid name type
console.log('\n📋 Test 5: Reject step with non-string name');
console.log('-'.repeat(60));
try {
  const invalidStep = {
    name: 123,  // Number instead of string
    command: 'npm install'
  };
  
  const error = setupExecutor.validateStep(invalidStep, 1);
  
  if (error && error.includes('name')) {
    console.log('✅ PASSED - Invalid name type detected');
    console.log(`   Error: ${error}`);
    testsPassed++;
  } else {
    console.log('❌ FAILED - Invalid name type not detected');
    testsFailed++;
  }
} catch (error) {
  console.log('❌ FAILED:', error.message);
  testsFailed++;
}

// Test 6: Execute step in dry-run mode
console.log('\n📋 Test 6: Execute step in dry-run mode');
console.log('-'.repeat(60));
try {
  const step = {
    name: 'List files',
    command: 'echo "Hello from dry-run"',
    description: 'Test command'
  };
  
  const result = setupExecutor.runStep(step, 1, { dryRun: true });
  
  if (result.success && result.skipped) {
    console.log('✅ PASSED - Dry-run executed successfully');
    console.log(`   Step: ${result.name}`);
    console.log(`   Command: ${result.command}`);
    console.log(`   Skipped: ${result.skipped}`);
    testsPassed++;
  } else {
    console.log('❌ FAILED - Dry-run did not work correctly');
    testsFailed++;
  }
} catch (error) {
  console.log('❌ FAILED:', error.message);
  testsFailed++;
}

// Test 7: Execute actual step (safe command)
console.log('\n📋 Test 7: Execute actual step (safe command)');
console.log('-'.repeat(60));
try {
  const step = {
    name: 'Echo test',
    command: 'echo "Setup step test successful"',
    description: 'Test actual execution'
  };
  
  const result = setupExecutor.runStep(step, 1, { dryRun: false });
  
  if (result.success && !result.skipped) {
    console.log('✅ PASSED - Step executed successfully');
    console.log(`   Step: ${result.name}`);
    console.log(`   Command: ${result.command}`);
    testsPassed++;
  } else {
    console.log('❌ FAILED - Step execution failed');
    console.log(`   Result:`, result);
    testsFailed++;
  }
} catch (error) {
  console.log('❌ FAILED:', error.message);
  testsFailed++;
}

// Test 8: Execute failing step
console.log('\n📋 Test 8: Handle failing step correctly');
console.log('-'.repeat(60));
try {
  const step = {
    name: 'Failing command',
    command: 'exit 1',  // This will fail
    description: 'Test error handling'
  };
  
  const result = setupExecutor.runStep(step, 1, { dryRun: false });
  
  if (!result.success && result.error) {
    console.log('✅ PASSED - Failure handled correctly');
    console.log(`   Step: ${result.name}`);
    console.log(`   Exit code: ${result.exitCode}`);
    testsPassed++;
  } else {
    console.log('❌ FAILED - Failure not handled correctly');
    testsFailed++;
  }
} catch (error) {
  console.log('❌ FAILED:', error.message);
  testsFailed++;
}

// Test 9: Execute multiple steps successfully
console.log('\n📋 Test 9: Execute multiple steps (dry-run)');
console.log('-'.repeat(60));
(async () => {
  try {
    const steps = [
      {
        name: 'Step 1',
        command: 'echo "First step"',
        description: 'First test step'
      },
      {
        name: 'Step 2',
        command: 'echo "Second step"',
        description: 'Second test step'
      },
      {
        name: 'Step 3',
        command: 'echo "Third step"',
        description: 'Third test step'
      }
    ];
    
    const result = await setupExecutor.executeSteps(steps, { dryRun: true });
    
    if (result.success && result.executed === 3) {
      console.log('✅ PASSED - Multiple steps executed (dry-run)');
      console.log(`   Executed: ${result.executed}/${steps.length}`);
      console.log(`   Duration: ${result.duration}ms`);
      testsPassed++;
    } else {
      console.log('❌ FAILED - Multiple steps execution failed');
      console.log(`   Result:`, result);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    testsFailed++;
  }

  // Test 10: Execute empty steps array
  console.log('\n📋 Test 10: Handle empty steps array');
  console.log('-'.repeat(60));
  try {
    const result = await setupExecutor.executeSteps([], { dryRun: false });
    
    if (result.success && result.executed === 0) {
      console.log('✅ PASSED - Empty array handled correctly');
      console.log(`   Executed: ${result.executed}`);
      testsPassed++;
    } else {
      console.log('❌ FAILED - Empty array not handled correctly');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    testsFailed++;
  }

  // Test 11: Handle null/undefined steps
  console.log('\n📋 Test 11: Handle null/undefined steps');
  console.log('-'.repeat(60));
  try {
    const result = await setupExecutor.executeSteps(null, { dryRun: false });
    
    if (result.success && result.executed === 0) {
      console.log('✅ PASSED - Null steps handled correctly');
      console.log(`   Executed: ${result.executed}`);
      testsPassed++;
    } else {
      console.log('❌ FAILED - Null steps not handled correctly');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    testsFailed++;
  }

  // Test 12: Stop on failure (actual execution)
  console.log('\n📋 Test 12: Stop on failure behavior');
  console.log('-'.repeat(60));
  try {
    const steps = [
      {
        name: 'Step 1',
        command: 'echo "First step succeeds"'
      },
      {
        name: 'Step 2',
        command: 'exit 1'  // This will fail
      },
      {
        name: 'Step 3',
        command: 'echo "Third step should be skipped"'
      }
    ];
    
    const result = await setupExecutor.executeSteps(steps, { dryRun: false });
    
    // After Step 2 fails, we've executed 2 steps, skipped 0 (because Step 3 wasn't reached), failed 1
    if (!result.success && result.executed === 2 && result.failed === 1) {
      console.log('✅ PASSED - Stopped on failure correctly');
      console.log(`   Executed: ${result.executed} (including failed step)`);
      console.log(`   Failed: ${result.failed}`);
      console.log(`   Failed step: ${result.failedStep.name}`);
      testsPassed++;
    } else {
      console.log('❌ FAILED - Did not stop on failure');
      console.log(`   Result:`, result);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    testsFailed++;
  }

  // Final Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📈 Total: ${testsPassed + testsFailed}`);
  console.log(`🎯 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));

  // Exit with appropriate code
  process.exit(testsFailed > 0 ? 1 : 0);
})();
