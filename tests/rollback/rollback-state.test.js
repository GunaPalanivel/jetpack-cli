const assert = require('assert');
const fs = require('fs');
const path = require('path');
const rollbackState = require('../../src/rollback/rollback-state');

// Simple test runner
const stats = { passed: 0, failed: 0, failures: [] };
const hooks = { beforeAll: null, afterAll: null, afterEach: null };

function describe(name, fn) {
  console.log(`\n${name}`);
  fn();
}

function it(name, fn) {
  try {
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

function afterEach(fn) {
  hooks.afterEach = fn;
}

console.log('Running RollbackState tests...');

describe('RollbackState Module', () => {
  const testDir = path.join(__dirname, 'test-temp');
  const testStateFile = path.join(testDir, '.jetpack-state.json');
  
  before(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });
  
  after(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });
  
  afterEach(() => {
    // Clean up test state file after each test
    if (fs.existsSync(testStateFile)) {
      fs.unlinkSync(testStateFile);
    }
  });
  
  describe('validateStateForRollback()', () => {
    it('should reject null state', () => {
      const result = rollbackState.validateStateForRollback(null);
      
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.errors.length, 1);
      assert.ok(result.errors[0].includes('No state found'));
    });
    
    it('should reject state without installed flag', () => {
      const state = { rollback: {} };
      const result = rollbackState.validateStateForRollback(state);
      
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('Installation not completed')));
    });
    
    it('should reject state without rollback section', () => {
      const state = { installed: true };
      const result = rollbackState.validateStateForRollback(state);
      
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('missing rollback tracking data')));
    });
    
    it('should accept valid state', () => {
      const state = {
        installed: true,
        rollback: {
          dependencies: {},
          config: {}
        }
      };
      const result = rollbackState.validateStateForRollback(state);
      
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });
  });
  
  describe('enhanceStateWithRollbackData()', () => {
    it('should return null for null state', () => {
      const result = rollbackState.enhanceStateWithRollbackData(null);
      assert.strictEqual(result, null);
    });
    
    it('should return state unchanged if rollback section exists', () => {
      const state = {
        installed: true,
        rollback: {
          dependencies: { npm: ['test-pkg'] }
        }
      };
      
      const result = rollbackState.enhanceStateWithRollbackData(state);
      assert.deepStrictEqual(result, state);
    });
    
    it('should add rollback section to legacy state', () => {
      const state = {
        installed: true,
        steps: []
      };
      
      const result = rollbackState.enhanceStateWithRollbackData(state);
      
      assert.ok(result.rollback);
      assert.ok(result.rollback.dependencies);
      assert.ok(result.rollback.config);
      assert.ok(result.rollback.ssh);
      assert.ok(result.rollback.docs);
    });
    
    it('should extract npm packages from steps', () => {
      const state = {
        installed: true,
        steps: [{
          id: 'dependencies',
          result: {
            npm: {
              installed: ['eslint', 'prettier']
            }
          }
        }]
      };
      
      const result = rollbackState.enhanceStateWithRollbackData(state);
      
      assert.strictEqual(result.rollback.dependencies.npm.length, 2);
      assert.strictEqual(result.rollback.dependencies.npm[0].name, 'eslint');
      assert.strictEqual(result.rollback.dependencies.npm[1].name, 'prettier');
    });
    
    it('should extract system packages from steps', () => {
      const state = {
        installed: true,
        environment: { platform: 'win32' },
        steps: [{
          id: 'dependencies',
          result: {
            system: {
              installed: ['git', 'nodejs']
            }
          }
        }]
      };
      
      const result = rollbackState.enhanceStateWithRollbackData(state);
      
      assert.strictEqual(result.rollback.dependencies.system.length, 2);
      assert.strictEqual(result.rollback.dependencies.system[0].name, 'git');
      assert.strictEqual(result.rollback.dependencies.system[0].platform, 'win32');
    });
    
    it('should extract python packages from steps', () => {
      const state = {
        installed: true,
        steps: [{
          id: 'dependencies',
          result: {
            python: {
              installed: ['requests', 'pytest']
            }
          }
        }]
      };
      
      const result = rollbackState.enhanceStateWithRollbackData(state);
      
      assert.strictEqual(result.rollback.dependencies.pip.length, 2);
      assert.strictEqual(result.rollback.dependencies.pip[0].name, 'requests');
    });
  });
  
  describe('getPhaseComponents()', () => {
    it('should return all components when no phases specified', () => {
      const components = rollbackState.getPhaseComponents(null);
      
      assert.ok(components.includes('documentation'));
      assert.ok(components.includes('gitConfig'));
      assert.ok(components.includes('envFiles'));
      assert.ok(components.includes('npmPackages'));
    });
    
    it('should return only docs components for docs phase', () => {
      const components = rollbackState.getPhaseComponents(['docs']);
      
      assert.ok(components.includes('documentation'));
      assert.strictEqual(components.length, 1);
    });
    
    it('should return multiple phase components', () => {
      const components = rollbackState.getPhaseComponents(['docs', 'config']);
      
      assert.ok(components.includes('documentation'));
      assert.ok(components.includes('envFiles'));
      assert.ok(components.includes('gitignore'));
      assert.strictEqual(components.length, 3);
    });
    
    it('should handle case-insensitive phase names', () => {
      const components = rollbackState.getPhaseComponents(['DOCS', 'Config']);
      
      assert.ok(components.includes('documentation'));
      assert.ok(components.includes('envFiles'));
    });
    
    it('should ignore invalid phase names', () => {
      const components = rollbackState.getPhaseComponents(['docs', 'invalid', 'config']);
      
      assert.ok(components.includes('documentation'));
      assert.ok(components.includes('envFiles'));
      assert.strictEqual(components.length, 3);
    });
  });
  
  describe('parsePartialPhases()', () => {
    it('should parse comma-separated phases', () => {
      const phases = rollbackState.parsePartialPhases('docs,config,ssh');
      
      assert.deepStrictEqual(phases, ['docs', 'config', 'ssh']);
    });
    
    it('should trim whitespace', () => {
      const phases = rollbackState.parsePartialPhases('docs , config , ssh');
      
      assert.deepStrictEqual(phases, ['docs', 'config', 'ssh']);
    });
    
    it('should normalize to lowercase', () => {
      const phases = rollbackState.parsePartialPhases('DOCS,Config,SSH');
      
      assert.deepStrictEqual(phases, ['docs', 'config', 'ssh']);
    });
    
    it('should filter out invalid phases', () => {
      const phases = rollbackState.parsePartialPhases('docs,invalid,config');
      
      assert.deepStrictEqual(phases, ['docs', 'config']);
    });
    
    it('should handle empty string', () => {
      const phases = rollbackState.parsePartialPhases('');
      
      assert.deepStrictEqual(phases, []);
    });
    
    it('should handle null input', () => {
      const phases = rollbackState.parsePartialPhases(null);
      
      assert.deepStrictEqual(phases, []);
    });
    
    it('should accept all valid phase names', () => {
      const phases = rollbackState.parsePartialPhases('docs,git,ssh,config,dependencies');
      
      assert.deepStrictEqual(phases, ['docs', 'git', 'ssh', 'config', 'dependencies']);
    });
  });
  
  describe('Integration Tests', () => {
    it('should handle complete state lifecycle', () => {
      const originalState = {
        installed: true,
        rollback: {
          dependencies: {
            npm: [{ name: 'eslint', installed: true }]
          },
          config: {
            backups: { env: '.env.backup' }
          }
        }
      };
      
      // Validate
      const validation = rollbackState.validateStateForRollback(originalState);
      assert.strictEqual(validation.valid, true);
      
      // Parse phases
      const phases = rollbackState.parsePartialPhases('config,docs');
      assert.strictEqual(phases.length, 2);
      
      // Get components
      const components = rollbackState.getPhaseComponents(phases);
      assert.ok(components.includes('envFiles'));
      assert.ok(components.includes('documentation'));
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

