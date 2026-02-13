const rollbackDiffGenerator = require('../../src/rollback/rollback-diff-generator');

describe('RollbackDiffGenerator tests', () => {

  test('should generate diff with all sections', () => {
    const state = {
      rollback: {
        dependencies: {
          npm: [{ name: 'eslint', installed: true, version: '8.0.0' }],
          pip: [],
          system: []
        },
        config: {
          backups: { env: '.env.backup' },
          originalGitConfig: { 'user.name': 'Test' }
        },
        ssh: {
          keyPath: '~/.ssh/id_ed25519',
          publicKeyPath: '~/.ssh/id_ed25519.pub'
        },
        docs: {
          outputDir: '.jetpack',
          filesCreated: 5
        }
      }
    };

    const diff = rollbackDiffGenerator.generateDiff(state, { unsafe: true });

    expect(typeof diff).toBe('string');
    expect(diff.length).toBeGreaterThan(0);
    expect(diff).toContain('Rollback Preview');
  });

  test('should show warning when unsafe flag not set', () => {
    const state = {
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

    const diff = rollbackDiffGenerator.generateDiff(state, { unsafe: false });

    expect(diff).toContain('--unsafe');
  });

  test('should format package changes correctly', () => {
    const state = {
      rollback: {
        dependencies: {
          npm: [
            { name: 'eslint', installed: true, version: '8.0.0' },
            { name: 'prettier', installed: false }
          ],
          pip: [{ name: 'requests', installed: true }],
          system: []
        }
      }
    };

    const lines = rollbackDiffGenerator.formatPackageChanges(state, { unsafe: true });

    expect(Array.isArray(lines)).toBe(true);
    expect(lines.length).toBeGreaterThan(0);
  });

  test('should format config changes correctly', () => {
    const state = {
      rollback: {
        config: {
          backups: {
            env: '.env.backup.2024',
            gitignore: '.gitignore.backup'
          },
          originalGitConfig: {}
        }
      }
    };

    const lines = rollbackDiffGenerator.formatConfigChanges(state);

    expect(Array.isArray(lines)).toBe(true);
    expect(lines.length).toBeGreaterThan(0);
  });

  test('should format SSH key changes correctly', () => {
    const state = {
      rollback: {
        ssh: {
          keyPath: '~/.ssh/id_ed25519',
          publicKeyPath: '~/.ssh/id_ed25519.pub',
          addedToAgent: true
        }
      }
    };

    const lines = rollbackDiffGenerator.formatSshKeyChanges(state);

    expect(Array.isArray(lines)).toBe(true);
    expect(lines.length).toBeGreaterThan(0);
  });

  test('should format git config changes correctly', () => {
    const state = {
      rollback: {
        config: {
          originalGitConfig: {
            'user.name': 'John Doe',
            'user.email': 'john@example.com'
          }
        }
      }
    };

    const lines = rollbackDiffGenerator.formatGitConfigChanges(state);

    expect(Array.isArray(lines)).toBe(true);
    expect(lines.length).toBeGreaterThan(0);
  });

  test('should format docs changes correctly', () => {
    const state = {
      rollback: {
        docs: {
          outputDir: '.jetpack-docs',
          filesCreated: 10
        }
      }
    };

    const lines = rollbackDiffGenerator.formatDocsChanges(state);

    expect(Array.isArray(lines)).toBe(true);
    expect(lines.length).toBeGreaterThan(0);
  });

  test('should handle empty state gracefully', () => {
    const state = {
      rollback: {
        dependencies: { npm: [], pip: [], system: [] },
        config: { backups: {}, originalGitConfig: {} },
        ssh: { keyPath: null, publicKeyPath: null },
        docs: { outputDir: null, filesCreated: 0 }
      }
    };

    const diff = rollbackDiffGenerator.generateDiff(state);

    expect(typeof diff).toBe('string');
    expect(diff).toContain('Rollback Preview');
  });

  test('should handle null components', () => {
    const state = {
      rollback: {
        dependencies: { npm: [], pip: [], system: [] },
        config: { backups: {}, originalGitConfig: null },
        ssh: {},
        docs: {}
      }
    };

    const lines = rollbackDiffGenerator.formatGitConfigChanges(state);

    expect(Array.isArray(lines)).toBe(true);
  });

});
