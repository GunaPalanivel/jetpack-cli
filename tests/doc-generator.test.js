/**
 * Test suite for Phase 7 - Documentation Generator
 * Tests template engine, content builder, and document generator
 */

const path = require('path');
const fs = require('fs').promises;
const templateEngine = require('../src/docs/core/TemplateEngine');
const contentBuilder = require('../src/docs/core/ContentBuilder');
const documentGenerator = require('../src/docs/core/DocumentGenerator');

// Main test runner
(async function runTests() {

  console.log('🧪 Phase 7: Documentation Generator Tests\n');
  console.log('='.repeat(60));

  let testsPassed = 0;
  let testsFailed = 0;

  /**
   * Helper to run a test
   */
  async function runTest(name, testFn) {
    console.log(`\n📋 ${name}`);
    console.log('-'.repeat(60));
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
  // Template Engine Tests
  // ============================================================================

  await runTest('TemplateEngine: Simple variable replacement', async () => {
    const template = 'Hello {{name}}!';
    const context = { name: 'World' };
    const result = templateEngine.render(template, context);
    assert(result === 'Hello World!', `Expected "Hello World!", got "${result}"`);
  });

  await runTest('TemplateEngine: Nested variable replacement', async () => {
    const template = 'Project: {{project.name}} v{{project.version}}';
    const context = { project: { name: 'Test', version: '1.0' } };
    const result = templateEngine.render(template, context);
    assert(result === 'Project: Test v1.0', `Expected "Project: Test v1.0", got "${result}"`);
  });

  await runTest('TemplateEngine: Array variable (joins with comma)', async () => {
    const template = 'Dependencies: {{dependencies}}';
    const context = { dependencies: ['docker', 'nodejs', 'git'] };
    const result = templateEngine.render(template, context);
    assert(result === 'Dependencies: docker, nodejs, git', `Got "${result}"`);
  });

  await runTest('TemplateEngine: Conditional block (truthy)', async () => {
    const template = '{{#if hasFeature}}Feature enabled{{/if}}';
    const context = { hasFeature: true };
    const result = templateEngine.render(template, context);
    assert(result === 'Feature enabled', `Got "${result}"`);
  });

  await runTest('TemplateEngine: Conditional block (falsy)', async () => {
    const template = '{{#if hasFeature}}Feature enabled{{/if}}';
    const context = { hasFeature: false };
    const result = templateEngine.render(template, context);
    assert(result === '', `Expected empty string, got "${result}"`);
  });

  await runTest('TemplateEngine: Loop with primitives', async () => {
    const template = '{{#each items}}- {{this}}\n{{/each}}';
    const context = { items: ['apple', 'banana', 'cherry'] };
    const result = templateEngine.render(template, context);
    assert(result === '- apple\n- banana\n- cherry\n', `Got "${result}"`);
  });

  await runTest('TemplateEngine: Loop with objects', async () => {
    const template = '{{#each users}}{{name}}: {{email}}\n{{/each}}';
    const context = {
      users: [
        { name: 'Alice', email: 'alice@example.com' },
        { name: 'Bob', email: 'bob@example.com' }
      ]
    };
    const result = templateEngine.render(template, context);
    assert(result.includes('Alice: alice@example.com'), `Got "${result}"`);
    assert(result.includes('Bob: bob@example.com'), `Got "${result}"`);
  });

  await runTest('TemplateEngine: Empty array renders nothing', async () => {
    const template = '{{#each items}}{{this}}{{/each}}';
    const context = { items: [] };
    const result = templateEngine.render(template, context);
    assert(result === '', `Expected empty string, got "${result}"`);
  });

  // ============================================================================
  // Content Builder Tests
  // ============================================================================

  await runTest('ContentBuilder: Build dependency table', async () => {
    const dependencies = {
      system: ['docker', 'nodejs'],
      npm: ['eslint', 'prettier'],
      python: ['pytest']
    };
    const result = contentBuilder.buildDependencyTable(dependencies);
    assert(result.includes('| System | docker, nodejs |'), 'Missing system row');
    assert(result.includes('| npm | eslint, prettier |'), 'Missing npm row');
    assert(result.includes('| Python | pytest |'), 'Missing python row');
  });

  await runTest('ContentBuilder: Build empty dependency table', async () => {
    const dependencies = {};
    const result = contentBuilder.buildDependencyTable(dependencies);
    assert(result === '_No dependencies specified_', `Got "${result}"`);
  });

  await runTest('ContentBuilder: Build command snippet (bash)', async () => {
    const command = 'npm install';
    const result = contentBuilder.buildCommandSnippet(command, 'linux');
    assert(result.includes('```bash'), 'Missing bash language');
    assert(result.includes('npm install'), 'Missing command');
  });

  await runTest('ContentBuilder: Build command snippet (powershell)', async () => {
    const command = 'npm install';
    const result = contentBuilder.buildCommandSnippet(command, 'Windows_NT');
    assert(result.includes('```powershell'), 'Missing powershell language');
    assert(result.includes('npm install'), 'Missing command');
  });

  await runTest('ContentBuilder: Build environment list', async () => {
    const environment = {
      required: ['DATABASE_URL', 'API_KEY'],
      optional: ['DEBUG_MODE']
    };
    const result = contentBuilder.buildEnvironmentList(environment);
    assert(result.includes('**Required:**'), 'Missing required section');
    assert(result.includes('DATABASE_URL'), 'Missing DATABASE_URL');
    assert(result.includes('**Optional:**'), 'Missing optional section');
    assert(result.includes('DEBUG_MODE'), 'Missing DEBUG_MODE');
  });

  await runTest('ContentBuilder: Build verification summary (success)', async () => {
    const verification = { checks: 10, passed: 10, failed: 0 };
    const result = contentBuilder.buildVerificationSummary(verification);
    assert(result.includes('✅ All checks passed'), 'Missing success message');
    assert(result.includes('(10/10 successful)'), 'Missing count');
  });

  await runTest('ContentBuilder: Build verification summary (failures)', async () => {
    const verification = { checks: 10, passed: 8, failed: 2 };
    const result = contentBuilder.buildVerificationSummary(verification);
    assert(result.includes('⚠️ 2 check(s) failed'), 'Missing failure message');
    assert(result.includes('(8/10 successful)'), 'Missing count');
  });

  await runTest('ContentBuilder: Build setup steps list', async () => {
    const setupSteps = [
      { name: 'Install deps', command: 'npm install', description: 'Install packages' },
      { name: 'Run tests', command: 'npm test' }
    ];
    const result = contentBuilder.buildSetupStepsList(setupSteps);
    assert(result.includes('1. **Install deps**'), 'Missing first step');
    assert(result.includes('npm install'), 'Missing command');
    assert(result.includes('2. **Run tests**'), 'Missing second step');
  });

  await runTest('ContentBuilder: Build config summary', async () => {
    const config = {
      envFile: '.env (3 variables)',
      sshKey: '~/.ssh/id_ed25519',
      gitUser: 'John Doe <john@example.com>'
    };
    const result = contentBuilder.buildConfigSummary(config);
    assert(result.includes('.env (3 variables)'), 'Missing env file');
    assert(result.includes('~/.ssh/id_ed25519'), 'Missing SSH key');
    assert(result.includes('John Doe'), 'Missing git user');
  });

  await runTest('ContentBuilder: Build platform note (Windows)', async () => {
    const result = contentBuilder.buildPlatformNote('Windows_NT');
    assert(result.includes('Windows users'), 'Missing Windows note');
    assert(result.includes('powershell'), 'Missing PowerShell reference');
  });

  await runTest('ContentBuilder: Build platform note (macOS)', async () => {
    const result = contentBuilder.buildPlatformNote('Darwin');
    assert(result.includes('macOS users'), 'Missing macOS note');
    assert(result.includes('sudo'), 'Missing sudo reference');
  });

  // ============================================================================
  // Document Generator Tests
  // ============================================================================

  await runTest('DocumentGenerator: Parse default config', async () => {
    const manifest = { name: 'test-project' };
    const state = { steps: [] };
    const result = await documentGenerator.generate(manifest, state, { dryRun: true });
    assert(result.dryRun === true, 'Should be dry run');
    assert(result.files.length > 0, 'Should have estimated files');
  });

  await runTest('DocumentGenerator: Respect disabled documentation', async () => {
    const manifest = {
      name: 'test-project',
      documentation: { enabled: false }
    };
    const state = { steps: [] };
    const result = await documentGenerator.generate(manifest, state, {});
    assert(result.generated === false, 'Should not generate');
    assert(result.reason === 'Disabled in manifest', 'Wrong reason');
  });

  await runTest('DocumentGenerator: Custom sections', async () => {
    const manifest = {
      name: 'test-project',
      documentation: {
        enabled: true,
        sections: ['getting-started', 'setup']
      }
    };
    const state = { steps: [] };
    const result = await documentGenerator.generate(manifest, state, { dryRun: true });
    assert(result.files.some(f => f.includes('getting-started')), 'Missing getting-started');
    assert(result.files.some(f => f.includes('setup')), 'Missing setup');
    assert(!result.files.some(f => f.includes('troubleshooting')), 'Should not include troubleshooting');
  });

  await runTest('DocumentGenerator: Extract config from state', async () => {
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
    // Context building is internal, but we can verify it doesn't crash
    assert(result.dryRun === true, 'Should complete dry run');
  });

  await runTest('DocumentGenerator: Extract verification from state', async () => {
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
    assert(result.dryRun === true, 'Should complete dry run');
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  await runTest('Integration: Generate complete documentation (dry-run)', async () => {
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

    assert(result.dryRun === true, 'Should be dry run');
    assert(result.files.length === 9, `Expected 9 files, got ${result.files.length}`);
    assert(result.files.some(f => f.includes('quickstart.md')), 'Missing quickstart');
    assert(result.files.some(f => f.includes('prerequisites.md')), 'Missing prerequisites');
    assert(result.files.some(f => f.includes('dependencies.md')), 'Missing dependencies');
    assert(result.files.some(f => f.includes('configuration.md')), 'Missing configuration');
  });

  // ============================================================================
  // Summary
  // ============================================================================

  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📝 Total:  ${testsPassed + testsFailed}`);

  if (testsFailed === 0) {
    console.log('\n🎉 All Documentation Generator Tests Passed!\n');
    process.exit(0);
  } else {
    console.log(`\n⚠️  ${testsFailed} test(s) failed\n`);
    process.exit(1);
  }

})(); // End of main test runner
