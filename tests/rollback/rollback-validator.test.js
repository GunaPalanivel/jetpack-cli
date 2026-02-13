const fs = require('fs');
const path = require('path');
const rollbackValidator = require('../../src/rollback/rollback-validator');

describe('RollbackValidator Module', () => {
  const testDir = path.join(__dirname, 'test-temp-validator');

  beforeAll(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      try {
        fs.rmSync(testDir, { recursive: true, force: true });
      } catch (e) { }
    }
  });

  describe('validate()', () => {
    test('should reject invalid state', async () => {
      const result = await rollbackValidator.validate(null);

      expect(result.safe).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Invalid state');
    });

    test('should reject state without rollback section', async () => {
      const state = { installed: true };
      const result = await rollbackValidator.validate(state);

      expect(result.safe).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should pass with valid minimal state', async () => {
      const state = {
        installed: true,
        rollback: {
          dependencies: { npm: [], pip: [], system: [] },
          config: { backups: {}, originalGitConfig: {} },
          ssh: { keyPath: null, publicKeyPath: null }
        }
      };

      const result = await rollbackValidator.validate(state);

      expect(result.safe).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    test('should collect warnings but still be safe', async () => {
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

      expect(result.safe).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('validateBackupsExist()', () => {
    test('should warn if env backup missing', () => {
      const state = {
        rollback: {
          config: {
            backups: { env: '.env.backup.nonexistent' }
          }
        }
      };

      const result = rollbackValidator.validateBackupsExist(state);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Environment backup not found');
    });

    test('should pass if backup exists', () => {
      const backupPath = path.join(testDir, '.env.backup.test');
      fs.writeFileSync(backupPath, 'TEST_VAR=value');

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

      process.chdir(originalCwd);

      expect(result.warnings.length).toBe(0);
    });

    test('should warn if gitignore backup missing', () => {
      const state = {
        rollback: {
          config: {
            backups: { gitignore: '.gitignore.backup.nonexistent' }
          }
        }
      };

      const result = rollbackValidator.validateBackupsExist(state);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Gitignore backup not found');
    });
  });

  describe('checkPackageDependents()', () => {
    test('should handle empty package lists', async () => {
      const state = {
        rollback: {
          dependencies: {
            npm: [],
            pip: []
          }
        }
      };

      const result = await rollbackValidator.checkPackageDependents(state);

      expect(result.warnings.length).toBe(0);
    });

    test('should handle packages without dependents', async () => {
      const state = {
        rollback: {
          dependencies: {
            npm: [{ name: 'nonexistent-package-xyz', installed: true }],
            pip: []
          }
        }
      };

      const result = await rollbackValidator.checkPackageDependents(state);

      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });

  describe('checkNpmDependents()', () => {
    test('should return empty array for nonexistent package', async () => {
      const dependents = await rollbackValidator.checkNpmDependents('nonexistent-package-xyz');

      expect(Array.isArray(dependents)).toBe(true);
    });

    test('should handle command errors gracefully', async () => {
      const dependents = await rollbackValidator.checkNpmDependents('');

      expect(Array.isArray(dependents)).toBe(true);
      expect(dependents.length).toBe(0);
    });
  });

  describe('checkPipDependents()', () => {
    test('should return empty array for nonexistent package', async () => {
      const dependents = await rollbackValidator.checkPipDependents('nonexistent-package-xyz');

      expect(Array.isArray(dependents)).toBe(true);
    });

    test('should handle command errors gracefully', async () => {
      const dependents = await rollbackValidator.checkPipDependents('');

      expect(Array.isArray(dependents)).toBe(true);
      expect(dependents.length).toBe(0);
    });
  });

  describe('validateSshKeyBeforeDelete()', () => {
    test('should warn if SSH key missing', () => {
      const state = {
        rollback: {
          ssh: {
            keyPath: '~/.ssh/nonexistent_key',
            publicKeyPath: '~/.ssh/nonexistent_key.pub'
          }
        }
      };

      const result = rollbackValidator.validateSshKeyBeforeDelete(state);

      expect(result.warnings.length).toBeGreaterThanOrEqual(1);
      expect(result.warnings.some(w => w.includes('SSH key not found'))).toBe(true);
    });

    test('should pass if no SSH keys configured', () => {
      const state = {
        rollback: {
          ssh: {
            keyPath: null,
            publicKeyPath: null
          }
        }
      };

      const result = rollbackValidator.validateSshKeyBeforeDelete(state);

      expect(result.warnings.length).toBe(0);
    });

    test('should expand tilde in path', () => {
      const state = {
        rollback: {
          ssh: {
            keyPath: '~/.ssh/nonexistent',
            publicKeyPath: null
          }
        }
      };

      const result = rollbackValidator.validateSshKeyBeforeDelete(state);

      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('validateGitConfigBeforeRestore()', () => {
    test('should warn if no original git config values', () => {
      const state = {
        rollback: {
          config: {
            originalGitConfig: {}
          }
        }
      };

      const result = rollbackValidator.validateGitConfigBeforeRestore(state);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('No original git config');
    });

    test('should pass if git config values exist', () => {
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

      expect(result.warnings.length).toBe(0);
    });

    test('should handle null originalGitConfig', () => {
      const state = {
        rollback: {
          config: {
            originalGitConfig: null
          }
        }
      };

      const result = rollbackValidator.validateGitConfigBeforeRestore(state);

      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Integration Tests', () => {
    test('should perform complete validation flow', async () => {
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

      expect(result.safe).toBe(true);
      expect(result.warnings.length).toBeGreaterThanOrEqual(0);
      expect(result.errors.length).toBe(0);
    });
  });
});
