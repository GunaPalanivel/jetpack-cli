const fs = require('fs');
const path = require('path');
const rollbackActions = require('../../src/rollback/rollback-actions');

describe('RollbackActions Module', () => {
  const testDir = path.join(__dirname, 'test-temp-actions');
  const originalCwd = process.cwd();

  beforeAll(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Restore original cwd
    try {
      process.chdir(originalCwd);
    } catch (e) { }

    // Clean up test directory
    if (fs.existsSync(testDir)) {
      try {
        fs.rmSync(testDir, { recursive: true, force: true });
      } catch (e) { }
    }
  });

  describe('rollbackDependencies()', () => {
    test('should skip all packages if unsafe flag not set', async () => {
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

      expect(result.uninstalled.length).toBe(0);
      expect(Array.isArray(result.skipped)).toBe(true);
    });

    test('should skip packages not installed by Jetpack', async () => {
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

      expect(result.skipped.some(s => s.name === 'test-pkg')).toBe(true);
    });

    test('should handle dry run mode', async () => {
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
      // Result structure check
      expect(result).toBeDefined();
    });

    test('should handle empty dependency lists', async () => {
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

      expect(result.uninstalled.length).toBe(0);
      expect(result.skipped.length).toBe(0);
      expect(result.failed.length).toBe(0);
    });
  });

  describe('rollbackConfigs()', () => {
    beforeEach(() => {
      process.chdir(testDir);
    });

    afterEach(() => {
      try {
        const files = ['.env', '.env.backup.test', '.env.template', '.env.example'];
        files.forEach(file => {
          const filePath = path.join(testDir, file);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      } catch (e) { }
    });

    test('should restore .env from backup', async () => {
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

      expect(result.restored.some(r => r.file === '.env')).toBe(true);

      // Verify file was restored
      const envContent = fs.readFileSync(path.join(testDir, '.env'), 'utf8');
      expect(envContent).toBe(backupContent);
    });

    test('should skip restore if backup not found', async () => {
      const state = {
        rollback: {
          config: {
            backups: { env: '.env.backup.missing' }
          }
        }
      };

      const result = await rollbackActions.rollbackConfigs(state);

      expect(result.skipped.some(s => s.file === '.env')).toBe(true);
    });

    test('should remove .env.template if exists', async () => {
      fs.writeFileSync(path.join(testDir, '.env.template'), 'TEMPLATE=value');

      const state = {
        rollback: {
          config: {
            backups: {}
          }
        }
      };

      const result = await rollbackActions.rollbackConfigs(state);

      expect(result.removed.some(r => r.file === '.env.template')).toBe(true);
      expect(fs.existsSync(path.join(testDir, '.env.template'))).toBe(false);
    });

    test('should remove .env.example if exists', async () => {
      fs.writeFileSync(path.join(testDir, '.env.example'), 'EXAMPLE=value');

      const state = {
        rollback: {
          config: {
            backups: {}
          }
        }
      };

      const result = await rollbackActions.rollbackConfigs(state);

      expect(result.removed.some(r => r.file === '.env.example')).toBe(true);
      expect(fs.existsSync(path.join(testDir, '.env.example'))).toBe(false);
    });

    test('should handle dry run mode', async () => {
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
      expect(result.restored.length > 0 || result.removed.length > 0).toBe(true);

      // Files should not be modified/created in dry run
      expect(fs.existsSync(path.join(testDir, '.env'))).toBe(false);
      expect(fs.existsSync(path.join(testDir, '.env.template'))).toBe(true);
    });
  });

  describe('rollbackSshKeys()', () => {
    test('should remove SSH keys if they exist', async () => {
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

      expect(result.removed.length).toBeGreaterThanOrEqual(1);

      expect(fs.existsSync(keyPath)).toBe(false);
      expect(fs.existsSync(pubKeyPath)).toBe(false);
    });

    test('should skip if SSH keys not found', async () => {
      const state = {
        rollback: {
          ssh: {
            keyPath: path.join(testDir, 'nonexistent_key'),
            publicKeyPath: path.join(testDir, 'nonexistent_key.pub')
          }
        }
      };

      const result = await rollbackActions.rollbackSshKeys(state);

      expect(result.skipped.length).toBeGreaterThanOrEqual(1);
    });

    test('should handle null key paths', async () => {
      const state = {
        rollback: {
          ssh: {
            keyPath: null,
            publicKeyPath: null
          }
        }
      };

      const result = await rollbackActions.rollbackSshKeys(state);

      expect(result.removed.length).toBe(0);
      expect(result.skipped.length).toBe(0);
      expect(result.failed.length).toBe(0);
    });

    test('should handle dry run mode', async () => {
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

      expect(result.removed.length).toBeGreaterThanOrEqual(1);

      // File should still exist in dry run
      expect(fs.existsSync(keyPath)).toBe(true);

      // Clean up
      fs.unlinkSync(keyPath);
    });
  });

  describe('rollbackGitConfig()', () => {
    test('should restore git config values', async () => {
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
      const result = await rollbackActions.rollbackGitConfig(state, { dryRun: true });

      expect(result.restored.some(r => r.key === 'test.key')).toBe(true);
    });

    test('should unset git config if original was null', async () => {
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

      expect(result.unset.some(r => r.key === 'test.unset')).toBe(true);
    });

    test('should handle empty git config', async () => {
      const state = {
        rollback: {
          config: {
            originalGitConfig: {}
          }
        }
      };

      const result = await rollbackActions.rollbackGitConfig(state);

      expect(result.restored.length).toBe(0);
      expect(result.unset.length).toBe(0);
    });

    test('should handle null originalGitConfig', async () => {
      const state = {
        rollback: {
          config: {
            originalGitConfig: null
          }
        }
      };

      const result = await rollbackActions.rollbackGitConfig(state);

      expect(result.restored.length).toBe(0);
      expect(result.unset.length).toBe(0);
    });
  });

  describe('rollbackDocumentation()', () => {
    beforeEach(() => {
      process.chdir(testDir);
    });

    test('should remove documentation directory', async () => {
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

      expect(result.removed.some(r => r.directory === '.jetpack-docs')).toBe(true);
      expect(fs.existsSync(docsDir)).toBe(false);
    });

    test('should skip if documentation directory not found', async () => {
      const state = {
        rollback: {
          docs: {
            outputDir: '.nonexistent-docs',
            filesCreated: 0
          }
        }
      };

      const result = await rollbackActions.rollbackDocumentation(state);

      expect(result.skipped.some(s => s.directory === '.nonexistent-docs')).toBe(true);
    });

    test('should handle null outputDir', async () => {
      const state = {
        rollback: {
          docs: {
            outputDir: null,
            filesCreated: 0
          }
        }
      };

      const result = await rollbackActions.rollbackDocumentation(state);

      expect(result.removed.length).toBe(0);
      expect(result.skipped.length).toBe(0);
    });

    test('should handle dry run mode', async () => {
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

      expect(result.removed.length > 0).toBe(true);
      expect(fs.existsSync(docsDir)).toBe(true);

      fs.rmSync(docsDir, { recursive: true, force: true });
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete rollback flow', async () => {
      process.chdir(testDir);

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

      const configResult = await rollbackActions.rollbackConfigs(state);
      const docsResult = await rollbackActions.rollbackDocumentation(state);
      const gitResult = await rollbackActions.rollbackGitConfig(state);

      expect(configResult.restored.length).toBeGreaterThan(0);
      expect(docsResult.removed.length).toBeGreaterThan(0);
      expect(gitResult.failed.length).toBe(0);

      ['.env', '.env.backup'].forEach(file => {
        const filePath = path.join(testDir, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    });
  });
});
