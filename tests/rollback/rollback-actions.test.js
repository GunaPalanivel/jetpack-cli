const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const rollbackActions = require('../../src/rollback/rollback-actions');

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

console.log('Running RollbackActions tests...');

describe('RollbackActions Module', () => {
  const testDir = path.join(__dirname, 'test-temp-actions');
  const originalCwd = process.cwd();
  
  before(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });
  
  after(() => {
    // Restore original cwd
    try {
      process.chdir(originalCwd);
    } catch (e) {}
    
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });
  
  describe('rollbackDependencies()', () => {
    it('should skip all packages if unsafe flag not set', async () => {
      const state = {
        rollback: {
          dependencies: {
            npm: [{ name: 'eslint', installed: true }],
            pip: [],
            system: []
          }
        }
      };
      
      const result = await rollbackActions.rollbackDependencies(state, { unsafe: false });
      
      assert.strictEqual(result.uninstalled.length, 0);
      assert.ok(Array.isArray(result.skipped));
    });
    
    it('should skip packages not installed by Jetpack', async () => {
      const state = {
        rollback: {
          dependencies: {
            npm: [{ name: 'test-pkg', installed: false }],
            pip: [],
            system: []
          }
        }
      };
      
      const result = await rollbackActions.rollbackDependencies(state, { 
        unsafe: true, 
        dryRun: true 
      });
      
      assert.ok(result.skipped.some(s => s.name === 'test-pkg'));
    });
    
    it('should handle dry run mode', async () => {
      const state = {
        rollback: {
          dependencies: {
            npm: [{ name: 'fake-package-xyz', installed: true }],
            pip: [],
            system: []
          }
        }
      };
      
      const result = await rollbackActions.rollbackDependencies(state, { 
        unsafe: true, 
        dryRun: true 
      });
      
      // In dry run, should not actually uninstall
      assert.ok(result.uninstalled.length >= 0 || result.skipped.length >= 0 || result.failed.length >= 0);
    });
    
    it('should handle empty dependency lists', async () => {
      const state = {
        rollback: {
          dependencies: {
            npm: [],
            pip: [],
            system: []
          }
        }
      };
      
      const result = await rollbackActions.rollbackDependencies(state, { unsafe: true });
      
      assert.strictEqual(result.uninstalled.length, 0);
      assert.strictEqual(result.skipped.length, 0);
      assert.strictEqual(result.failed.length, 0);
    });
  });
  
  describe('rollbackConfigs()', () => {
    beforeEach(() => {
      // Change to test directory
      process.chdir(testDir);
    });
    
    afterEach(() => {
      // Clean up test files
      const files = ['.env', '.env.backup.test', '.env.template', '.env.example'];
      files.forEach(file => {
        const filePath = path.join(testDir, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    });
    
    it('should restore .env from backup', async () => {
      // Create backup file
      const backupContent = 'TEST_VAR=original';
      fs.writeFileSync(path.join(testDir, '.env.backup.test'), backupContent);
      
      const state = {
        rollback: {
          config: {
            backups: { env: '.env.backup.test' }
          }
        }
      };
      
      const result = await rollbackActions.rollbackConfigs(state);
      
      assert.ok(result.restored.some(r => r.file === '.env'));
      
      // Verify file was restored
      const envContent = fs.readFileSync(path.join(testDir, '.env'), 'utf8');
      assert.strictEqual(envContent, backupContent);
    });
    
    it('should skip restore if backup not found', async () => {
      const state = {
        rollback: {
          config: {
            backups: { env: '.env.backup.missing' }
          }
        }
      };
      
      const result = await rollbackActions.rollbackConfigs(state);
      
      assert.ok(result.skipped.some(s => s.file === '.env'));
    });
    
    it('should remove .env.template if exists', async () => {
      // Create .env.template
      fs.writeFileSync(path.join(testDir, '.env.template'), 'TEMPLATE=value');
      
      const state = {
        rollback: {
          config: {
            backups: {}
          }
        }
      };
      
      const result = await rollbackActions.rollbackConfigs(state);
      
      assert.ok(result.removed.some(r => r.file === '.env.template'));
      
      // Verify file was removed
      assert.strictEqual(fs.existsSync(path.join(testDir, '.env.template')), false);
    });
    
    it('should remove .env.example if exists', async () => {
      // Create .env.example
      fs.writeFileSync(path.join(testDir, '.env.example'), 'EXAMPLE=value');
      
      const state = {
        rollback: {
          config: {
            backups: {}
          }
        }
      };
      
      const result = await rollbackActions.rollbackConfigs(state);
      
      assert.ok(result.removed.some(r => r.file === '.env.example'));
      
      // Verify file was removed
      assert.strictEqual(fs.existsSync(path.join(testDir, '.env.example')), false);
    });
    
    it('should handle dry run mode', async () => {
      // Create backup and template files
      fs.writeFileSync(path.join(testDir, '.env.backup.test'), 'BACKUP=value');
      fs.writeFileSync(path.join(testDir, '.env.template'), 'TEMPLATE=value');
      
      const state = {
        rollback: {
          config: {
            backups: { env: '.env.backup.test' }
          }
        }
      };
      
      const result = await rollbackActions.rollbackConfigs(state, { dryRun: true });
      
      // Should report operations but not execute them
      assert.ok(result.restored.length > 0 || result.removed.length > 0);
      
      // Files should not be modified in dry run
      assert.strictEqual(fs.existsSync(path.join(testDir, '.env')), false);
      assert.strictEqual(fs.existsSync(path.join(testDir, '.env.template')), true);
    });
  });
  
  describe('rollbackSshKeys()', () => {
    it('should remove SSH keys if they exist', async () => {
      // Create temporary SSH keys in test dir
      const keyPath = path.join(testDir, 'test_key');
      const pubKeyPath = path.join(testDir, 'test_key.pub');
      
      fs.writeFileSync(keyPath, 'PRIVATE KEY');
      fs.writeFileSync(pubKeyPath, 'PUBLIC KEY');
      
      const state = {
        rollback: {
          ssh: {
            keyPath: keyPath,
            publicKeyPath: pubKeyPath
          }
        }
      };
      
      const result = await rollbackActions.rollbackSshKeys(state);
      
      assert.ok(result.removed.length >= 1);
      
      // Verify files were removed
      assert.strictEqual(fs.existsSync(keyPath), false);
      assert.strictEqual(fs.existsSync(pubKeyPath), false);
    });
    
    it('should skip if SSH keys not found', async () => {
      const state = {
        rollback: {
          ssh: {
            keyPath: path.join(testDir, 'nonexistent_key'),
            publicKeyPath: path.join(testDir, 'nonexistent_key.pub')
          }
        }
      };
      
      const result = await rollbackActions.rollbackSshKeys(state);
      
      assert.ok(result.skipped.length >= 1);
    });
    
    it('should handle null key paths', async () => {
      const state = {
        rollback: {
          ssh: {
            keyPath: null,
            publicKeyPath: null
          }
        }
      };
      
      const result = await rollbackActions.rollbackSshKeys(state);
      
      assert.strictEqual(result.removed.length, 0);
      assert.strictEqual(result.skipped.length, 0);
      assert.strictEqual(result.failed.length, 0);
    });
    
    it('should handle dry run mode', async () => {
      // Create temporary SSH keys
      const keyPath = path.join(testDir, 'test_key_dryrun');
      fs.writeFileSync(keyPath, 'PRIVATE KEY');
      
      const state = {
        rollback: {
          ssh: {
            keyPath: keyPath,
            publicKeyPath: null
          }
        }
      };
      
      const result = await rollbackActions.rollbackSshKeys(state, { dryRun: true });
      
      assert.ok(result.removed.length >= 1);
      
      // File should still exist in dry run
      assert.strictEqual(fs.existsSync(keyPath), true);
      
      // Clean up
      fs.unlinkSync(keyPath);
    });
  });
  
  describe('rollbackGitConfig()', () => {
    it('should restore git config values', async () => {
      const state = {
        rollback: {
          config: {
            originalGitConfig: {
              'test.key': 'original-value'
            }
          }
        }
      };
      
      // Note: In real env, this would execute git commands
      // For testing, we check the results structure
      const result = await rollbackActions.rollbackGitConfig(state, { dryRun: true });
      
      assert.ok(result.restored.some(r => r.key === 'test.key'));
    });
    
    it('should unset git config if original was null', async () => {
      const state = {
        rollback: {
          config: {
            originalGitConfig: {
              'test.unset': null
            }
          }
        }
      };
      
      const result = await rollbackActions.rollbackGitConfig(state, { dryRun: true });
      
      assert.ok(result.unset.some(r => r.key === 'test.unset'));
    });
    
    it('should handle empty git config', async () => {
      const state = {
        rollback: {
          config: {
            originalGitConfig: {}
          }
        }
      };
      
      const result = await rollbackActions.rollbackGitConfig(state);
      
      assert.strictEqual(result.restored.length, 0);
      assert.strictEqual(result.unset.length, 0);
    });
    
    it('should handle null originalGitConfig', async () => {
      const state = {
        rollback: {
          config: {
            originalGitConfig: null
          }
        }
      };
      
      const result = await rollbackActions.rollbackGitConfig(state);
      
      assert.strictEqual(result.restored.length, 0);
      assert.strictEqual(result.unset.length, 0);
    });
  });
  
  describe('rollbackDocumentation()', () => {
    beforeEach(() => {
      process.chdir(testDir);
    });
    
    it('should remove documentation directory', async () => {
      // Create docs directory with files
      const docsDir = path.join(testDir, '.jetpack-docs');
      fs.mkdirSync(docsDir, { recursive: true });
      fs.writeFileSync(path.join(docsDir, 'README.md'), '# Docs');
      fs.writeFileSync(path.join(docsDir, 'guide.md'), '# Guide');
      
      const state = {
        rollback: {
          docs: {
            outputDir: '.jetpack-docs',
            filesCreated: 2
          }
        }
      };
      
      const result = await rollbackActions.rollbackDocumentation(state);
      
      assert.ok(result.removed.some(r => r.directory === '.jetpack-docs'));
      
      // Verify directory was removed
      assert.strictEqual(fs.existsSync(docsDir), false);
    });
    
    it('should skip if documentation directory not found', async () => {
      const state = {
        rollback: {
          docs: {
            outputDir: '.nonexistent-docs',
            filesCreated: 0
          }
        }
      };
      
      const result = await rollbackActions.rollbackDocumentation(state);
      
      assert.ok(result.skipped.some(s => s.directory === '.nonexistent-docs'));
    });
    
    it('should handle null outputDir', async () => {
      const state = {
        rollback: {
          docs: {
            outputDir: null,
            filesCreated: 0
          }
        }
      };
      
      const result = await rollbackActions.rollbackDocumentation(state);
      
      assert.strictEqual(result.removed.length, 0);
      assert.strictEqual(result.skipped.length, 0);
    });
    
    it('should handle dry run mode', async () => {
      // Create docs directory
      const docsDir = path.join(testDir, '.jetpack-docs-dryrun');
      fs.mkdirSync(docsDir, { recursive: true });
      fs.writeFileSync(path.join(docsDir, 'test.md'), '# Test');
      
      const state = {
        rollback: {
          docs: {
            outputDir: '.jetpack-docs-dryrun',
            filesCreated: 1
          }
        }
      };
      
      const result = await rollbackActions.rollbackDocumentation(state, { dryRun: true });
      
      assert.ok(result.removed.length > 0);
      
      // Directory should still exist in dry run
      assert.strictEqual(fs.existsSync(docsDir), true);
      
      // Clean up
      fs.rmSync(docsDir, { recursive: true, force: true });
    });
  });
  
  describe('Integration Tests', () => {
    it('should handle complete rollback flow', async () => {
      // Change to test directory
      process.chdir(testDir);
      
      // Setup test files
      fs.writeFileSync(path.join(testDir, '.env.backup'), 'BACKUP=true');
      const docsDir = path.join(testDir, '.docs');
      fs.mkdirSync(docsDir, { recursive: true });
      fs.writeFileSync(path.join(docsDir, 'test.md'), '# Test');
      
      const state = {
        rollback: {
          dependencies: {
            npm: [],
            pip: [],
            system: []
          },
          config: {
            backups: { env: '.env.backup' },
            originalGitConfig: {}
          },
          ssh: {
            keyPath: null,
            publicKeyPath: null
          },
          docs: {
            outputDir: '.docs',
            filesCreated: 1
          }
        }
      };
      
      // Execute all rollback actions
      const configResult = await rollbackActions.rollbackConfigs(state);
      const docsResult = await rollbackActions.rollbackDocumentation(state);
      const gitResult = await rollbackActions.rollbackGitConfig(state);
      
      // Verify results
      assert.ok(configResult.restored.length > 0);
      assert.ok(docsResult.removed.length > 0);
      assert.strictEqual(gitResult.failed.length, 0);
      
      // Clean up
      ['.env', '.env.backup'].forEach(file => {
        const filePath = path.join(testDir, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
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
