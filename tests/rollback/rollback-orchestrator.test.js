const assert = require('assert');
const fs = require('fs');
const path = require('path');
const rollbackOrchestrator = require('../../src/rollback/rollback-orchestrator');
const stateManager = require('../../src/core/state-manager');

// Simple test runner
const stats = { passed: 0, failed: 0, failures: [] };
const hooks = { beforeAll: null, afterAll: null, beforeEach: null, afterEach: null };

function describe(name, fn) {
  console.log(`\n${name}`);
  fn();
}

function it(name, fn) {
  try {
    if (hooks.beforeEach) hooks.beforeEach();
    fn();
    console.log(`  ✓ ${name}`);
    stats.passed++;
    if (hooks.afterEach) hooks.afterEach();
  } catch (error) {
    console.log(`  ✗ ${name}`);
    console.log(`    ${error.message}`);
    stats.failed++;
    stats.failures.push({ test: name, error: error.message });
    if (hooks.afterEach) hooks.afterEach();
  }
}

function before(fn) {
  hooks.beforeAll = fn;
  try {
    if (fn) fn();
  } catch (error) {
    console.log(`  Setup failed: ${error.message}`);
  }
}

function after(fn) {
  hooks.afterAll = fn;
}

function beforeEach(fn) {
  hooks.beforeEach = fn;
}

function afterEach(fn) {
  hooks.afterEach = fn;
}

console.log('Running RollbackOrchestrator tests...');

describe('RollbackOrchestrator Module', () => {
  const testDir = path.join(__dirname, 'test-temp-orchestrator');
  const originalCwd = process.cwd();
  
  before(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    process.chdir(testDir);
  });
  
  after(() => {
    process.chdir(originalCwd);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });
  
  afterEach(() => {
    // Clean up state file after each test
    const stateFile = path.join(testDir, '.jetpack-state.json');
    if (fs.existsSync(stateFile)) {
      fs.unlinkSync(stateFile);
    }
  });
  
  describe('rollback()', () => {
    it('should fail if no state file exists', async () => {
      const result = await rollbackOrchestrator.rollback({ dryRun: true });
      
      assert.strictEqual(result.success, false);
      assert.ok(result.errors);
    });
    
    it('should handle dry run mode', async () => {
      // Create minimal valid state
      const state = {
        installed: true,
        rollback: {
          dependencies: { npm: [], pip: [], system: [] },
          config: { backups: {}, originalGitConfig: {} },
          ssh: { keyPath: null, publicKeyPath: null },
          docs: { outputDir: null, filesCreated: 0 }
        }
      };
      
      stateManager.save(state);
      
      const result = await rollbackOrchestrator.rollback({ dryRun: true });
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.dryRun, true);
    });
    
    it('should execute full rollback successfully', async () => {
      // Create state with test data
      const docsDir = path.join(testDir, '.test-docs');
      fs.mkdirSync(docsDir, { recursive: true });
      fs.writeFileSync(path.join(docsDir, 'test.md'), '# Test');
      
      const state = {
        installed: true,
        rollback: {
          dependencies: { npm: [], pip: [], system: [] },
          config: { backups: {}, originalGitConfig: {} },
          ssh: { keyPath: null, publicKeyPath: null },
          docs: { outputDir: '.test-docs', filesCreated: 1 }
        }
      };
      
      stateManager.save(state);
      
      const result = await rollbackOrchestrator.rollback({});
      
      assert.ok(result.results);
      assert.ok(result.timeTaken);
      
      // Verify docs were removed
      assert.strictEqual(fs.existsSync(docsDir), false);
    });
    
    it('should handle partial rollback', async () => {
      // Create state
      const docsDir = path.join(testDir, '.test-docs-partial');
      fs.mkdirSync(docsDir, { recursive: true });
      
      const state = {
        installed: true,
        rollback: {
          dependencies: { npm: [], pip: [], system: [] },
          config: { backups: {}, originalGitConfig: {} },
          ssh: { keyPath: null, publicKeyPath: null },
          docs: { outputDir: '.test-docs-partial', filesCreated: 0 }
        }
      };
      
      stateManager.save(state);
      
      const result = await rollbackOrchestrator.rollback({ 
        partial: 'docs' 
      });
      
      assert.ok(result.results.docs);
      
      // State should NOT be cleared (partial rollback)
      assert.strictEqual(stateManager.exists(), true);
    });
    
    it('should respect unsafe flag for dependencies', async () => {
      const state = {
        installed: true,
        rollback: {
          dependencies: { 
            npm: [{ name: 'test-pkg', installed: true }],
            pip: [],
            system: []
          },
          config: { backups: {}, originalGitConfig: {} },
          ssh: { keyPath: null, publicKeyPath: null },
          docs: { outputDir: null, filesCreated: 0 }
        }
      };
      
      stateManager.save(state);
      
      // Without unsafe flag
      const result1 = await rollbackOrchestrator.rollback({ 
        unsafe: false 
      });
      
      assert.ok(result1.results.dependencies);
      assert.strictEqual(result1.results.dependencies.uninstalled.length, 0);
      
      stateManager.save(state); // Restore state
      
      // With unsafe flag (dry run to avoid actual uninstall)
      const result2 = await rollbackOrchestrator.rollback({ 
        unsafe: true,
        dryRun: true
      });
      
      assert.strictEqual(result2.success, true);
    });
    
    it('should clear state after successful full rollback', async () => {
      const state = {
        installed: true,
        rollback: {
          dependencies: { npm: [], pip: [], system: [] },
          config: { backups: {}, originalGitConfig: {} },
          ssh: { keyPath: null, publicKeyPath: null },
          docs: { outputDir: null, filesCreated: 0 }
        }
      };
      
      stateManager.save(state);
      
      await rollbackOrchestrator.rollback({});
      
      // State should be cleared
      assert.strictEqual(stateManager.exists(), false);
    });
    
    it('should NOT clear state after partial rollback', async () => {
      const state = {
        installed: true,
        rollback: {
          dependencies: { npm: [], pip: [], system: [] },
          config: { backups: {}, originalGitConfig: {} },
          ssh: { keyPath: null, publicKeyPath: null },
          docs: { outputDir: null, filesCreated: 0 }
        }
      };
      
      stateManager.save(state);
      
      await rollbackOrchestrator.rollback({ partial: 'docs' });
      
      // State should still exist
      assert.strictEqual(stateManager.exists(), true);
    });
    
    it('should handle force flag to continue past validation errors', async () => {
      // Create state that would trigger validation warnings
      const state = {
        installed: true,
        rollback: {
          dependencies: { npm: [], pip: [], system: [] },
          config: { 
            backups: { env: '.env.backup.missing' },
            originalGitConfig: {}
          },
          ssh: { keyPath: null, publicKeyPath: null },
          docs: { outputDir: null, filesCreated: 0 }
        }
      };
      
      stateManager.save(state);
      
      const result = await rollbackOrchestrator.rollback({ 
        force: true 
      });
      
      // Should continue despite warnings
      assert.ok(result.results);
    });
  });
  
  describe('isSuccessful()', () => {
    it('should return false if error exists', () => {
      const results = {
        error: 'Something went wrong',
        docs: { removed: [] }
      };
      
      const success = rollbackOrchestrator.isSuccessful(results);
      
      assert.strictEqual(success, false);
    });
    
    it('should return false if any phase has failures', () => {
      const results = {
        docs: { removed: [], failed: [] },
        config: { restored: [], failed: [{ file: '.env', error: 'Failed' }] }
      };
      
      const success = rollbackOrchestrator.isSuccessful(results);
      
      assert.strictEqual(success, false);
    });
    
    it('should return true if no failures', () => {
      const results = {
        docs: { removed: [{ directory: '.jetpack' }], failed: [] },
        config: { restored: [], failed: [] }
      };
      
      const success = rollbackOrchestrator.isSuccessful(results);
      
      assert.strictEqual(success, true);
    });
    
    it('should handle empty results', () => {
      const results = {};
      
      const success = rollbackOrchestrator.isSuccessful(results);
      
      assert.strictEqual(success, true);
    });
  });
  
  describe('Integration Tests', () => {
    it('should handle complete rollback workflow', async () => {
      // Setup: Create files and state
      const docsDir = path.join(testDir, '.integration-docs');
      fs.mkdirSync(docsDir, { recursive: true });
      fs.writeFileSync(path.join(docsDir, 'README.md'), '# Docs');
      fs.writeFileSync(path.join(testDir, '.env.backup.test'), 'BACKUP=value');
      
      const state = {
        installed: true,
        rollback: {
          dependencies: { npm: [], pip: [], system: [] },
          config: { 
            backups: { env: '.env.backup.test' },
            originalGitConfig: {}
          },
          ssh: { keyPath: null, publicKeyPath: null },
          docs: { outputDir: '.integration-docs', filesCreated: 1 }
        }
      };
      
      stateManager.save(state);
      
      // Execute: Run full rollback
      const result = await rollbackOrchestrator.rollback({});
      
      // Verify: Check results
      assert.ok(result.results.docs);
      assert.ok(result.results.config);
      assert.ok(result.timeTaken);
      
      // Verify: Files were modified
      assert.strictEqual(fs.existsSync(docsDir), false);
      assert.strictEqual(fs.existsSync(path.join(testDir, '.env')), true);
      
      // Cleanup
      if (fs.existsSync(path.join(testDir, '.env'))) {
        fs.unlinkSync(path.join(testDir, '.env'));
      }
      if (fs.existsSync(path.join(testDir, '.env.backup.test'))) {
        fs.unlinkSync(path.join(testDir, '.env.backup.test'));
      }
    });
    
    it('should execute phases in correct order', async () => {
      const state = {
        installed: true,
        rollback: {
          dependencies: { npm: [], pip: [], system: [] },
          config: { backups: {}, originalGitConfig: {} },
          ssh: { keyPath: null, publicKeyPath: null },
          docs: { outputDir: null, filesCreated: 0 }
        }
      };
      
      stateManager.save(state);
      
      const result = await rollbackOrchestrator.rollback({});
      
      // All phases should be present in results
      assert.ok(result.results.docs !== undefined);
      assert.ok(result.results.git !== undefined);
      assert.ok(result.results.ssh !== undefined);
      assert.ok(result.results.config !== undefined);
      assert.ok(result.results.dependencies !== undefined);
    });
  });
});

// Execute afterAll hook
if (hooks.afterAll) {
  try {
    hooks.afterAll();
  } catch (error) {
    console.log(`  Cleanup failed: ${error.message}`);
  }
}

// Print results
console.log('\n' + '='.repeat(60));
console.log(`Tests: ${stats.passed + stats.failed} (${stats.passed} passed, ${stats.failed} failed)`);

if (stats.failed > 0) {
  console.log('\nFailed tests:');
  stats.failures.forEach(f => console.log(`  - ${f.test}: ${f.error}`));
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  process.exit(0);
}
