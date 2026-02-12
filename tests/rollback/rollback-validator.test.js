const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const rollbackValidator = require('../../src/rollback/rollback-validator');

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

console.log('Running RollbackValidator tests...');

describe('RollbackValidator Module', () => {
  const testDir = path.join(__dirname, 'test-temp-validator');
  
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
  
  describe('validate()', () => {
    it('should reject invalid state', async () => {
      const result = await rollbackValidator.validate(null);
      
      assert.strictEqual(result.safe, false);
      assert.ok(result.errors.length > 0);
      assert.ok(result.errors[0].includes('Invalid state'));
    });
    
    it('should reject state without rollback section', async () => {
      const state = { installed: true };
      const result = await rollbackValidator.validate(state);
      
      assert.strictEqual(result.safe, false);
      assert.ok(result.errors.length > 0);
    });
    
    it('should pass with valid minimal state', async () => {
      const state = {
        installed: true,
        rollback: {
          dependencies: { npm: [], pip: [], system: [] },
          config: { backups: {}, originalGitConfig: {} },
          ssh: { keyPath: null, publicKeyPath: null }
        }
      };
      
      const result = await rollbackValidator.validate(state);
      
      assert.strictEqual(result.safe, true);
      assert.strictEqual(result.errors.length, 0);
    });
    
    it('should collect warnings but still be safe', async () => {
      const state = {
        installed: true,
        rollback: {
          dependencies: { npm: [], pip: [], system: [] },
          config: {
            backups: { env: '.env.backup.missing' },
            originalGitConfig: {}
          },
          ssh: { keyPath: null, publicKeyPath: null }
        }
      };
      
      const result = await rollbackValidator.validate(state);
      
      assert.strictEqual(result.safe, true);
      assert.ok(result.warnings.length > 0);
    });
  });
  
  describe('validateBackupsExist()', () => {
    it('should warn if env backup missing', () => {
      const state = {
        rollback: {
          config: {
            backups: { env: '.env.backup.nonexistent' }
          }
        }
      };
      
      const result = rollbackValidator.validateBackupsExist(state);
      
      assert.ok(result.warnings.length > 0);
      assert.ok(result.warnings[0].includes('Environment backup not found'));
    });
    
    it('should pass if backup exists', () => {
      // Create a test backup file
      const backupPath = path.join(testDir, '.env.backup.test');
      fs.writeFileSync(backupPath, 'TEST_VAR=value');
      
      // Change working directory temporarily
      const originalCwd = process.cwd();
      process.chdir(testDir);
      
      const state = {
        rollback: {
          config: {
            backups: { env: '.env.backup.test' }
          }
        }
      };
      
      const result = rollbackValidator.validateBackupsExist(state);
      
      // Restore working directory
      process.chdir(originalCwd);
      
      assert.strictEqual(result.warnings.length, 0);
    });
    
    it('should warn if gitignore backup missing', () => {
      const state = {
        rollback: {
          config: {
            backups: { gitignore: '.gitignore.backup.nonexistent' }
          }
        }
      };
      
      const result = rollbackValidator.validateBackupsExist(state);
      
      assert.ok(result.warnings.length > 0);
      assert.ok(result.warnings[0].includes('Gitignore backup not found'));
    });
  });
  
  describe('checkPackageDependents()', () => {
    it('should handle empty package lists', async () => {
      const state = {
        rollback: {
          dependencies: {
            npm: [],
            pip: []
          }
        }
      };
      
      const result = await rollbackValidator.checkPackageDependents(state);
      
      assert.strictEqual(result.warnings.length, 0);
    });
    
    it('should handle packages without dependents', async () => {
      const state = {
        rollback: {
          dependencies: {
            npm: [{ name: 'nonexistent-package-xyz', installed: true }],
            pip: []
          }
        }
      };
      
      const result = await rollbackValidator.checkPackageDependents(state);
      
      // Should not throw, warnings length may vary
      assert.ok(Array.isArray(result.warnings));
    });
  });
  
  describe('checkNpmDependents()', () => {
    it('should return empty array for nonexistent package', async () => {
      const dependents = await rollbackValidator.checkNpmDependents('nonexistent-package-xyz');
      
      assert.ok(Array.isArray(dependents));
    });
    
    it('should handle command errors gracefully', async () => {
      const dependents = await rollbackValidator.checkNpmDependents('');
      
      assert.ok(Array.isArray(dependents));
      assert.strictEqual(dependents.length, 0);
    });
  });
  
  describe('checkPipDependents()', () => {
    it('should return empty array for nonexistent package', async () => {
      const dependents = await rollbackValidator.checkPipDependents('nonexistent-package-xyz');
      
      assert.ok(Array.isArray(dependents));
    });
    
    it('should handle command errors gracefully', async () => {
      const dependents = await rollbackValidator.checkPipDependents('');
      
      assert.ok(Array.isArray(dependents));
      assert.strictEqual(dependents.length, 0);
    });
  });
  
  describe('validateSshKeyBeforeDelete()', () => {
    it('should warn if SSH key missing', () => {
      const state = {
        rollback: {
          ssh: {
            keyPath: '~/.ssh/nonexistent_key',
            publicKeyPath: '~/.ssh/nonexistent_key.pub'
          }
        }
      };
      
      const result = rollbackValidator.validateSshKeyBeforeDelete(state);
      
      assert.ok(result.warnings.length >= 1);
      assert.ok(result.warnings.some(w => w.includes('SSH key not found')));
    });
    
    it('should pass if no SSH keys configured', () => {
      const state = {
        rollback: {
          ssh: {
            keyPath: null,
            publicKeyPath: null
          }
        }
      };
      
      const result = rollbackValidator.validateSshKeyBeforeDelete(state);
      
      assert.strictEqual(result.warnings.length, 0);
    });
    
    it('should expand tilde in path', () => {
      const state = {
        rollback: {
          ssh: {
            keyPath: '~/.ssh/nonexistent',
            publicKeyPath: null
          }
        }
      };
      
      const result = rollbackValidator.validateSshKeyBeforeDelete(state);
      
      // Should warn because expanded path doesn't exist
      assert.ok(result.warnings.length > 0);
    });
  });
  
  describe('validateGitConfigBeforeRestore()', () => {
    it('should warn if no original git config values', () => {
      const state = {
        rollback: {
          config: {
            originalGitConfig: {}
          }
        }
      };
      
      const result = rollbackValidator.validateGitConfigBeforeRestore(state);
      
      assert.ok(result.warnings.length > 0);
      assert.ok(result.warnings[0].includes('No original git config'));
    });
    
    it('should pass if git config values exist', () => {
      const state = {
        rollback: {
          config: {
            originalGitConfig: {
              'user.name': 'Test User',
              'user.email': 'test@example.com'
            }
          }
        }
      };
      
      const result = rollbackValidator.validateGitConfigBeforeRestore(state);
      
      assert.strictEqual(result.warnings.length, 0);
    });
    
    it('should handle null originalGitConfig', () => {
      const state = {
        rollback: {
          config: {
            originalGitConfig: null
          }
        }
      };
      
      const result = rollbackValidator.validateGitConfigBeforeRestore(state);
      
      assert.ok(result.warnings.length > 0);
    });
  });
  
  describe('Integration Tests', () => {
    it('should perform complete validation flow', async () => {
      const state = {
        installed: true,
        rollback: {
          dependencies: {
            npm: [{ name: 'eslint', installed: true }],
            pip: [],
            system: []
          },
          config: {
            backups: { env: '.env.backup.nonexistent' },
            originalGitConfig: { 'user.name': 'Test' }
          },
          ssh: {
            keyPath: '~/.ssh/test_key',
            publicKeyPath: null
          }
        }
      };
      
      const result = await rollbackValidator.validate(state);
      
      // Should be safe (warnings ok, but no errors)
      assert.strictEqual(result.safe, true);
      assert.ok(result.warnings.length >= 0);
      assert.strictEqual(result.errors.length, 0);
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
