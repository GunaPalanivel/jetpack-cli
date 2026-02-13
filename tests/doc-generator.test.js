/**
 * Test suite for Phase 7 - Documentation Generator
 * Tests template engine, content builder, and document generator
 */

const path = require('path');
const fs = require('fs').promises;
const templateEngine = require('../src/docs/core/TemplateEngine');
const contentBuilder = require('../src/docs/core/ContentBuilder');
const documentGenerator = require('../src/docs/core/DocumentGenerator');

describe('Phase 7: Documentation Generator Tests', () => {

  // ============================================================================
  // Template Engine Tests
  // ============================================================================

  test('TemplateEngine: Simple variable replacement', () => {
    const template = 'Hello {{name}}!';
    const context = { name: 'World' };
    const result = templateEngine.render(template, context);
    expect(result).toBe('Hello World!');
  });

  test('TemplateEngine: Nested variable replacement', () => {
    const template = 'Project: {{project.name}} v{{project.version}}';
    const context = { project: { name: 'Test', version: '1.0' } };
    const result = templateEngine.render(template, context);
    expect(result).toBe('Project: Test v1.0');
  });

  test('TemplateEngine: Array variable (joins with comma)', () => {
    const template = 'Dependencies: {{dependencies}}';
    const context = { dependencies: ['docker', 'nodejs', 'git'] };
    const result = templateEngine.render(template, context);
    expect(result).toBe('Dependencies: docker, nodejs, git');
  });

  test('TemplateEngine: Conditional block (truthy)', () => {
    const template = '{{#if hasFeature}}Feature enabled{{/if}}';
    const context = { hasFeature: true };
    const result = templateEngine.render(template, context);
    expect(result).toBe('Feature enabled');
  });

  test('TemplateEngine: Conditional block (falsy)', () => {
    const template = '{{#if hasFeature}}Feature enabled{{/if}}';
    const context = { hasFeature: false };
    const result = templateEngine.render(template, context);
    expect(result).toBe('');
  });

  test('TemplateEngine: Loop with primitives', () => {
    const template = '{{#each items}}- {{this}}\n{{/each}}';
    const context = { items: ['apple', 'banana', 'cherry'] };
    const result = templateEngine.render(template, context);
    expect(result).toBe('- apple\n- banana\n- cherry\n');
  });

  test('TemplateEngine: Loop with objects', () => {
    const template = '{{#each users}}{{name}}: {{email}}\n{{/each}}';
    const context = {
      users: [
        { name: 'Alice', email: 'alice@example.com' },
        { name: 'Bob', email: 'bob@example.com' }
      ]
    };
    const result = templateEngine.render(template, context);
    expect(result).toContain('Alice: alice@example.com');
    expect(result).toContain('Bob: bob@example.com');
  });

  test('TemplateEngine: Empty array renders nothing', () => {
    const template = '{{#each items}}{{this}}{{/each}}';
    const context = { items: [] };
    const result = templateEngine.render(template, context);
    expect(result).toBe('');
  });

  // ============================================================================
  // Content Builder Tests
  // ============================================================================

  test('ContentBuilder: Build dependency table', () => {
    const dependencies = {
      system: ['docker', 'nodejs'],
      npm: ['eslint', 'prettier'],
      python: ['pytest']
    };
    const result = contentBuilder.buildDependencyTable(dependencies);
    expect(result).toContain('| System | docker, nodejs |');
    expect(result).toContain('| npm | eslint, prettier |');
    expect(result).toContain('| Python | pytest |');
  });

  test('ContentBuilder: Build empty dependency table', () => {
    const dependencies = {};
    const result = contentBuilder.buildDependencyTable(dependencies);
    expect(result).toBe('_No dependencies specified_');
  });

  test('ContentBuilder: Build command snippet (bash)', () => {
    const command = 'npm install';
    const result = contentBuilder.buildCommandSnippet(command, 'linux');
    expect(result).toContain('```bash');
    expect(result).toContain('npm install');
  });

  test('ContentBuilder: Build command snippet (powershell)', () => {
    const command = 'npm install';
    const result = contentBuilder.buildCommandSnippet(command, 'Windows_NT');
    expect(result).toContain('```powershell');
    expect(result).toContain('npm install');
  });

  test('ContentBuilder: Build environment list', () => {
    const environment = {
      required: ['DATABASE_URL', 'API_KEY'],
      optional: ['DEBUG_MODE']
    };
    const result = contentBuilder.buildEnvironmentList(environment);
    expect(result).toContain('**Required:**');
    expect(result).toContain('DATABASE_URL');
    expect(result).toContain('**Optional:**');
    expect(result).toContain('DEBUG_MODE');
  });

  test('ContentBuilder: Build verification summary (success)', () => {
    const verification = { checks: 10, passed: 10, failed: 0 };
    const result = contentBuilder.buildVerificationSummary(verification);
    expect(result).toContain('✅ All checks passed');
    expect(result).toContain('(10/10 successful)');
  });

  test('ContentBuilder: Build verification summary (failures)', () => {
    const verification = { checks: 10, passed: 8, failed: 2 };
    const result = contentBuilder.buildVerificationSummary(verification);
    expect(result).toContain('⚠️ 2 check(s) failed');
    expect(result).toContain('(8/10 successful)');
  });

  test('ContentBuilder: Build setup steps list', () => {
    const setupSteps = [
      { name: 'Install deps', command: 'npm install', description: 'Install packages' },
      { name: 'Run tests', command: 'npm test' }
    ];
    const result = contentBuilder.buildSetupStepsList(setupSteps);
    expect(result).toContain('1. **Install deps**');
    expect(result).toContain('npm install');
    expect(result).toContain('2. **Run tests**');
  });

  test('ContentBuilder: Build config summary', () => {
    const config = {
      envFile: '.env (3 variables)',
      sshKey: '~/.ssh/id_ed25519',
      gitUser: 'John Doe <john@example.com>'
    };
    const result = contentBuilder.buildConfigSummary(config);
    expect(result).toContain('.env (3 variables)');
    expect(result).toContain('~/.ssh/id_ed25519');
    expect(result).toContain('John Doe');
  });

  test('ContentBuilder: Build platform note (Windows)', () => {
    const result = contentBuilder.buildPlatformNote('Windows_NT');
    expect(result).toContain('Windows users');
    expect(result).toContain('powershell');
  });

  test('ContentBuilder: Build platform note (macOS)', () => {
    const result = contentBuilder.buildPlatformNote('Darwin');
    expect(result).toContain('macOS users');
    expect(result).toContain('sudo');
  });

  // ============================================================================
  // Document Generator Tests
  // ============================================================================

  test('DocumentGenerator: Parse default config', async () => {
    const manifest = { name: 'test-project' };
    const state = { steps: [] };
    const result = await documentGenerator.generate(manifest, state, { dryRun: true });
    expect(result.dryRun).toBe(true);
    expect(result.files.length).toBeGreaterThan(0);
  });

  test('DocumentGenerator: Respect disabled documentation', async () => {
    const manifest = {
      name: 'test-project',
      documentation: { enabled: false }
    };
    const state = { steps: [] };
    const result = await documentGenerator.generate(manifest, state, {});
    expect(result.generated).toBe(false);
    expect(result.reason).toBe('Disabled in manifest');
  });

  test('DocumentGenerator: Custom sections', async () => {
    const manifest = {
      name: 'test-project',
      documentation: {
        enabled: true,
        sections: ['getting-started', 'setup']
      }
    };
    const state = { steps: [] };
    const result = await documentGenerator.generate(manifest, state, { dryRun: true });
    expect(result.files.some(f => f.includes('getting-started'))).toBe(true);
    expect(result.files.some(f => f.includes('setup'))).toBe(true);
    expect(result.files.some(f => f.includes('troubleshooting'))).toBe(false);
  });

  test('DocumentGenerator: Extract config from state', async () => {
    const manifest = { name: 'test-project' };
    const state = {
      steps: [
        {
          name: 'Generate Configurations',
          result: {
            env: { generated: true, variables: ['API_KEY', 'DB_URL'] },
            ssh: { generated: true, keyPath: '~/.ssh/id_ed25519' },
            git: { configured: true, name: 'Test User', email: 'test@example.com' }
          }
        }
      ]
    };

    const result = await documentGenerator.generate(manifest, state, { dryRun: true });
    expect(result.dryRun).toBe(true);
  });

  test('DocumentGenerator: Extract verification from state', async () => {
    const manifest = { name: 'test-project' };
    const state = {
      steps: [
        {
          name: 'Verify Setup',
          result: {
            totalChecks: 10,
            passedChecks: 8,
            failedChecks: 2
          }
        }
      ]
    };

    const result = await documentGenerator.generate(manifest, state, { dryRun: true });
    expect(result.dryRun).toBe(true);
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  // Note: Technically this belongs in integration tests, but sticking to existing file structure
  test('Integration: Generate complete documentation (dry-run)', async () => {
    const manifest = {
      name: 'integration-test-project',
      description: 'Full integration test',
      dependencies: {
        system: ['docker', 'nodejs'],
        npm: ['eslint'],
        python: [],
        environment: {
          required: ['API_KEY'],
          optional: ['DEBUG']
        }
      },
      setup_steps: [
        { name: 'Install', command: 'npm install' }
      ],
      documentation: {
        enabled: true,
        output_dir: './test-docs',
        sections: ['getting-started', 'setup', 'troubleshooting', 'verification']
      }
    };

    const state = {
      repoUrl: 'https://github.com/test/test',
      steps: [
        {
          name: 'Generate Configurations',
          result: {
            env: { generated: true, variables: ['API_KEY'] }
          }
        }
      ]
    };

    const result = await documentGenerator.generate(manifest, state, {
      dryRun: true,
      environment: { os: 'Linux' }
    });

    expect(result.dryRun).toBe(true);
    expect(result.files.length).toBe(9);
    expect(result.files.some(f => f.includes('quickstart.md'))).toBe(true);
    expect(result.files.some(f => f.includes('prerequisites.md'))).toBe(true);
    expect(result.files.some(f => f.includes('dependencies.md'))).toBe(true);
    expect(result.files.some(f => f.includes('configuration.md'))).toBe(true);
  });

});
