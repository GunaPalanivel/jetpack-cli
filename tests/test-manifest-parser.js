#!/usr/bin/env node

/**
 * Test script for manifest parser
 * Run: node tests/test-manifest-parser.js
 */

const path = require('path');
const manifestParser = require('../src/detectors/manifest-parser');

console.log('🧪 Testing Manifest Parser\n');
console.log('='.repeat(60));

// Test 1: Parse simple example manifest
console.log('\n📋 Test 1: Parse simple example.onboard.yaml');
console.log('-'.repeat(60));
try {
  const simplePath = path.join(__dirname, '../templates/example.onboard.yaml');
  const simpleManifest = manifestParser.parseManifest(simplePath);
  
  console.log('✅ PASSED - Simple manifest parsed successfully');
  console.log('\nParsed Data:');
  console.log(`  Name: ${simpleManifest.name}`);
  console.log(`  Description: ${simpleManifest.description}`);
  console.log(`  System Dependencies: ${simpleManifest.dependencies.system.join(', ')}`);
  console.log(`  NPM Packages: ${simpleManifest.dependencies.npm.join(', ')}`);
  console.log(`  Required Env Vars: ${simpleManifest.environment.required.join(', ')}`);
  console.log(`  Setup Steps: ${simpleManifest.setupSteps.length} steps`);
  simpleManifest.setupSteps.forEach(step => {
    console.log(`    ${step.id}. ${step.name} - ${step.command}`);
  });
} catch (error) {
  console.log('❌ FAILED:', error.message);
}

// Test 2: Parse complex manifest
console.log('\n📋 Test 2: Parse complex.onboard.yaml');
console.log('-'.repeat(60));
try {
  const complexPath = path.join(__dirname, '../templates/complex.onboard.yaml');
  const complexManifest = manifestParser.parseManifest(complexPath);
  
  console.log('✅ PASSED - Complex manifest parsed successfully');
  console.log('\nParsed Data:');
  console.log(`  Name: ${complexManifest.name}`);
  console.log(`  Description: ${complexManifest.description}`);
  console.log(`  System Dependencies: ${complexManifest.dependencies.system.length} items`);
  console.log(`  NPM Packages: ${complexManifest.dependencies.npm.length} items`);
  console.log(`  Python Packages: ${complexManifest.dependencies.python.length} items`);
  console.log(`  Required Env Vars: ${complexManifest.environment.required.length} items`);
  console.log(`  Optional Env Vars: ${complexManifest.environment.optional.length} items`);
  console.log(`  Setup Steps: ${complexManifest.setupSteps.length} steps`);
} catch (error) {
  console.log('❌ FAILED:', error.message);
}

// Test 3: File not found error
console.log('\n📋 Test 3: Handle file not found');
console.log('-'.repeat(60));
try {
  manifestParser.parseManifest('/nonexistent/file.yaml');
  console.log('❌ FAILED - Should have thrown error');
} catch (error) {
  console.log('✅ PASSED - Correctly threw error');
  console.log(`  Error: ${error.message}`);
}

// Test 4: Invalid YAML syntax
console.log('\n📋 Test 4: Handle invalid YAML syntax');
console.log('-'.repeat(60));
try {
  const invalidYaml = `
name: test
dependencies: [invalid yaml syntax
  `;
  manifestParser.parseManifestFromString(invalidYaml);
  console.log('❌ FAILED - Should have thrown error');
} catch (error) {
  console.log('✅ PASSED - Correctly threw error');
  console.log(`  Error: ${error.message.split('\n')[0]}`);
}

// Test 5: Missing required fields
console.log('\n📋 Test 5: Handle missing required fields');
console.log('-'.repeat(60));
try {
  const missingFields = `
description: Missing name field
dependencies:
  system:
    - docker
  `;
  manifestParser.parseManifestFromString(missingFields);
  console.log('❌ FAILED - Should have thrown error');
} catch (error) {
  console.log('✅ PASSED - Correctly threw error');
  console.log(`  Error: ${error.message.split('\n')[0]}`);
}

// Test 6: Empty manifest
console.log('\n📋 Test 6: Handle empty manifest');
console.log('-'.repeat(60));
try {
  manifestParser.parseManifestFromString('');
  console.log('❌ FAILED - Should have thrown error');
} catch (error) {
  console.log('✅ PASSED - Correctly threw error');
  console.log(`  Error: ${error.message}`);
}

// Test 7: Valid minimal manifest
console.log('\n📋 Test 7: Parse minimal valid manifest');
console.log('-'.repeat(60));
try {
  const minimalManifest = `
name: minimal-project
dependencies:
  system:
    - nodejs
setup_steps:
  - name: Install
    command: npm install
  `;
  const parsed = manifestParser.parseManifestFromString(minimalManifest);
  console.log('✅ PASSED - Minimal manifest parsed successfully');
  console.log(`  Name: ${parsed.name}`);
  console.log(`  System Deps: ${parsed.dependencies.system.join(', ')}`);
  console.log(`  Setup Steps: ${parsed.setupSteps.length}`);
} catch (error) {
  console.log('❌ FAILED:', error.message);
}

// Test 8: Validate array environment format
console.log('\n📋 Test 8: Parse manifest with array environment format');
console.log('-'.repeat(60));
try {
  const arrayEnv = `
name: array-env-test
dependencies:
  system:
    - docker
  environment:
    - DATABASE_URL
    - API_KEY
setup_steps:
  - name: Install
    command: npm install
  `;
  const parsed = manifestParser.parseManifestFromString(arrayEnv);
  console.log('✅ PASSED - Array environment format parsed');
  console.log(`  Required Env Vars: ${parsed.environment.required.join(', ')}`);
  console.log(`  Optional Env Vars: ${parsed.environment.optional.length} (none)`);
} catch (error) {
  console.log('❌ FAILED:', error.message);
}

console.log('\n' + '='.repeat(60));
console.log('🎉 Test suite completed!\n');
