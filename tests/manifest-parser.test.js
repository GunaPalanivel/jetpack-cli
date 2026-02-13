/**
 * Test script for manifest parser
 * Run: npm test -- --selectProjects unit
 */

const path = require('path');
const manifestParser = require('../src/detectors/manifest-parser');

describe('Manifest Parser Tests', () => {

  test('Parse simple basic-example.yaml', () => {
    const simplePath = path.join(__dirname, '../templates/basic-example.yaml');
    const simpleManifest = manifestParser.parseManifest(simplePath);

    expect(simpleManifest).toBeDefined();
    expect(simpleManifest.name).toBeDefined();
    expect(simpleManifest.description).toBeDefined();
    expect(simpleManifest.dependencies.system).toBeDefined();
    expect(simpleManifest.dependencies.npm).toBeDefined();
    expect(simpleManifest.environment.required).toBeDefined();
    expect(simpleManifest.setupSteps.length).toBeGreaterThan(0);
  });

  test('Parse complex-example.yaml', () => {
    const complexPath = path.join(__dirname, '../templates/complex-example.yaml');
    const complexManifest = manifestParser.parseManifest(complexPath);

    expect(complexManifest).toBeDefined();
    expect(complexManifest.dependencies.system.length).toBeGreaterThan(0);
    expect(complexManifest.dependencies.npm.length).toBeGreaterThan(0);
    expect(complexManifest.dependencies.python.length).toBeGreaterThan(0);
    expect(complexManifest.environment.required.length).toBeGreaterThan(0);
    expect(complexManifest.environment.optional.length).toBeGreaterThan(0);
    expect(complexManifest.setupSteps.length).toBeGreaterThan(0);
  });

  test('Handle file not found', () => {
    expect(() => {
      manifestParser.parseManifest('/nonexistent/file.yaml');
    }).toThrow();
  });

  test('Handle invalid YAML syntax', () => {
    const invalidYaml = `
name: test
dependencies: [invalid yaml syntax
    `;
    expect(() => {
      manifestParser.parseManifestFromString(invalidYaml);
    }).toThrow();
  });

  test('Handle missing required fields', () => {
    const missingFields = `
description: Missing name field
dependencies:
  system:
    - docker
    `;
    expect(() => {
      manifestParser.parseManifestFromString(missingFields);
    }).toThrow();
  });

  test('Handle empty manifest', () => {
    expect(() => {
      manifestParser.parseManifestFromString('');
    }).toThrow();
  });

  test('Parse minimal valid manifest', () => {
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
    expect(parsed.name).toBe('minimal-project');
    expect(parsed.dependencies.system).toContain('nodejs');
    expect(parsed.setupSteps).toHaveLength(1);
  });

  test('Parse manifest with array environment format', () => {
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
    expect(parsed.environment.required).toContain('DATABASE_URL');
    expect(parsed.environment.required).toContain('API_KEY');
    expect(parsed.environment.optional).toHaveLength(0);
  });

});
