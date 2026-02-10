#!/usr/bin/env node

/**
 * Additional edge case tests for manifest parser
 * Run: node tests/test-edge-cases.js
 */

const path = require('path');
const manifestParser = require('../src/detectors/manifest-parser');

console.log('🧪 Testing Manifest Parser - Edge Cases\n');
console.log('='.repeat(60));

// Test 1: Empty arrays should be allowed
console.log('\n📋 Test 1: Empty dependency arrays should be valid');
console.log('-'.repeat(60));
try {
  const emptyArrays = `
name: docs-only-project
description: Documentation-only project
dependencies:
  system: []
  npm: []
  environment:
    - API_KEY
setup_steps:
  - name: Build docs
    command: npm run build:docs
  `;
  const parsed = manifestParser.parseManifestFromString(emptyArrays);
  console.log('✅ PASSED - Empty arrays accepted as valid');
  console.log(`  Name: ${parsed.name}`);
  console.log(`  System Deps: ${parsed.dependencies.system.length} (empty is OK)`);
  console.log(`  NPM Packages: ${parsed.dependencies.npm.length} (empty is OK)`);
  console.log(`  Required Env Vars: ${parsed.environment.required.join(', ')}`);
} catch (error) {
  console.log('❌ FAILED:', error.message);
}

// Test 2: Environment-only manifest
console.log('\n📋 Test 2: Manifest with only environment variables');
console.log('-'.repeat(60));
try {
  const envOnly = `
name: config-project
dependencies:
  environment:
    required:
      - DATABASE_URL
      - API_KEY
    optional:
      - DEBUG_MODE
setup_steps:
  - name: Validate config
    command: npm run validate
  `;
  const parsed = manifestParser.parseManifestFromString(envOnly);
  console.log('✅ PASSED - Environment-only manifest valid');
  console.log(`  Required Env: ${parsed.environment.required.length} vars`);
  console.log(`  Optional Env: ${parsed.environment.optional.length} vars`);
} catch (error) {
  console.log('❌ FAILED:', error.message);
}

// Test 3: Empty environment array
console.log('\n📋 Test 3: Empty environment array should be valid');
console.log('-'.repeat(60));
try {
  const emptyEnv = `
name: test-project
dependencies:
  system:
    - docker
  environment: []
setup_steps:
  - name: Test
    command: npm test
  `;
  const parsed = manifestParser.parseManifestFromString(emptyEnv);
  console.log('✅ PASSED - Empty environment array accepted');
  console.log(`  System Deps: ${parsed.dependencies.system.join(', ')}`);
  console.log(`  Required Env: ${parsed.environment.required.length} (empty is OK)`);
} catch (error) {
  console.log('❌ FAILED:', error.message);
}

// Test 4: Multiple empty arrays
console.log('\n📋 Test 4: Multiple empty dependency arrays');
console.log('-'.repeat(60));
try {
  const multipleEmpty = `
name: minimal-project
dependencies:
  system: []
  npm: []
  python: []
  environment: []
setup_steps:
  - name: Run
    command: echo "Hello"
  `;
  const parsed = manifestParser.parseManifestFromString(multipleEmpty);
  console.log('✅ PASSED - Multiple empty arrays accepted');
  console.log(`  All dependency arrays: empty (valid)`);
} catch (error) {
  console.log('❌ FAILED:', error.message);
}

// Test 5: Mixed empty and populated arrays
console.log('\n📋 Test 5: Mixed empty and populated arrays');
console.log('-'.repeat(60));
try {
  const mixed = `
name: hybrid-project
dependencies:
  system:
    - docker
    - nodejs
  npm: []
  python:
    - django
  environment: []
setup_steps:
  - name: Setup
    command: npm install
  `;
  const parsed = manifestParser.parseManifestFromString(mixed);
  console.log('✅ PASSED - Mixed arrays accepted');
  console.log(`  System: ${parsed.dependencies.system.length} items`);
  console.log(`  NPM: ${parsed.dependencies.npm.length} items (empty)`);
  console.log(`  Python: ${parsed.dependencies.python.length} items`);
} catch (error) {
  console.log('❌ FAILED:', error.message);
}

console.log('\n' + '='.repeat(60));
console.log('🎉 Edge case tests completed!\n');
