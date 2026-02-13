const fs = require('fs');
const path = require('path');
const rollbackOrchestrator = require('../../src/rollback/rollback-orchestrator');
const stateManager = require('../../src/core/state-manager');

describe('RollbackOrchestrator Module', () => {
  const testDir = path.join(__dirname, 'test-temp-orchestrator');
  const originalCwd = process.cwd();

  beforeAll(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  beforeEach(() => {
    process.chdir(testDir);
  });

  afterAll(() => {
    process.chdir(originalCwd);
    if (fs.existsSync(testDir)) {
      try {
        fs.rmSync(testDir, { recursive: true, force: true });
      } catch (e) { }
    }
  });

  afterEach(() => {
    const stateFile = path.join(testDir, '.jetpack-state.json');
    if (fs.existsSync(stateFile)) {
      fs.unlinkSync(stateFile);
    }
    // Try to cleanup docs dirs created by tests
    ['.test-docs', '.test-docs-partial', '.integration-docs'].forEach(d => {
      if (fs.existsSync(d)) {
        try { fs.rmSync(d, { recursive: true, force: true }); } catch (e) { }
      }
    });

  });

  describe('rollback()', () => {
    test('should fail if no state file exists', async () => {
      // Ensure no state file
      try { fs.unlinkSync('.jetpack-state.json'); } catch (e) { }

      const result = await rollbackOrchestrator.rollback({ dryRun: true });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('should handle dry run mode', async () => {
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

      expect(result.success).toBe(true);
      expect(result.dryRun).toBe(true);
    });

    test('should execute full rollback successfully', async () => {
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

      expect(result.results).toBeDefined();
      expect(result.timeTaken).toBeDefined();
      expect(fs.existsSync(docsDir)).toBe(false);
    });

    test('should handle partial rollback', async () => {
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

      expect(result.results.docs).toBeDefined();

      // State should NOT be cleared (partial rollback)
      expect(stateManager.exists()).toBe(true);
    });

    test('should respect unsafe flag for dependencies', async () => {
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

      const result1 = await rollbackOrchestrator.rollback({
        unsafe: false
      });

      expect(result1.results.dependencies).toBeDefined();
      expect(result1.results.dependencies.uninstalled.length).toBe(0);

      stateManager.save(state);

      const result2 = await rollbackOrchestrator.rollback({
        unsafe: true,
        dryRun: true
      });

      expect(result2.success).toBe(true);
    });

    test('should clear state after successful full rollback', async () => {
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

      expect(stateManager.exists()).toBe(false);
    });

    test('should NOT clear state after partial rollback', async () => {
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

      expect(stateManager.exists()).toBe(true);
    });

    test('should handle force flag to continue past validation errors', async () => {
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

      expect(result.results).toBeDefined();
    });
  });

  describe('isSuccessful()', () => {
    test('should return false if error exists', () => {
      const results = {
        error: 'Something went wrong',
        docs: { removed: [] }
      };

      const success = rollbackOrchestrator.isSuccessful(results);

      expect(success).toBe(false);
    });

    test('should return false if any phase has failures', () => {
      const results = {
        docs: { removed: [], failed: [] },
        config: { restored: [], failed: [{ file: '.env', error: 'Failed' }] }
      };

      const success = rollbackOrchestrator.isSuccessful(results);

      expect(success).toBe(false);
    });

    test('should return true if no failures', () => {
      const results = {
        docs: { removed: [{ directory: '.jetpack' }], failed: [] },
        config: { restored: [], failed: [] }
      };

      const success = rollbackOrchestrator.isSuccessful(results);

      expect(success).toBe(true);
    });

    test('should handle empty results', () => {
      const results = {};
      const success = rollbackOrchestrator.isSuccessful(results);
      expect(success).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete rollback workflow', async () => {
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

      const result = await rollbackOrchestrator.rollback({});

      expect(result.results.docs).toBeDefined();
      expect(result.results.config).toBeDefined();
      expect(result.timeTaken).toBeDefined();

      expect(fs.existsSync(docsDir)).toBe(false);
      expect(fs.existsSync(path.join(testDir, '.env'))).toBe(true);

      if (fs.existsSync(path.join(testDir, '.env'))) {
        fs.unlinkSync(path.join(testDir, '.env'));
      }
      if (fs.existsSync(path.join(testDir, '.env.backup.test'))) {
        fs.unlinkSync(path.join(testDir, '.env.backup.test'));
      }
    });

    test('should execute phases in correct order', async () => {
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

      expect(result.results.docs).toBeDefined();
      expect(result.results.git).toBeDefined();
      expect(result.results.ssh).toBeDefined();
      expect(result.results.config).toBeDefined();
      expect(result.results.dependencies).toBeDefined();
    });
  });
});
