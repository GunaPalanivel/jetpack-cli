/**
 * Additional edge case tests for manifest parser
 */

const manifestParser = require('../src/detectors/manifest-parser');

describe('Manifest Parser Edge Cases', () => {

  test('Empty dependency arrays should be valid', () => {
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
    expect(parsed.name).toBe('docs-only-project');
    expect(parsed.dependencies.system.length).toBe(0);
    expect(parsed.dependencies.npm.length).toBe(0);
    expect(parsed.environment.required).toContain('API_KEY');
  });

  test('Manifest with only environment variables', () => {
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
    expect(parsed.environment.required.length).toBeGreaterThan(0);
    expect(parsed.environment.optional.length).toBeGreaterThan(0);
  });

  test('Empty environment array should be valid', () => {
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
    expect(parsed.dependencies.system).toContain('docker');
    expect(parsed.environment.required.length).toBe(0);
  });

  test('Multiple empty dependency arrays', () => {
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
    expect(parsed.dependencies.system.length).toBe(0);
    expect(parsed.dependencies.npm.length).toBe(0);
    expect(parsed.dependencies.python.length).toBe(0);
    expect(parsed.environment.required.length).toBe(0);
  });

  test('Mixed empty and populated arrays', () => {
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
    expect(parsed.dependencies.system.length).toBe(2);
    expect(parsed.dependencies.npm.length).toBe(0);
    expect(parsed.dependencies.python.length).toBe(1);
  });

});
