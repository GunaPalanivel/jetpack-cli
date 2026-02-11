const assert = require('assert');
const rollbackDiffGenerator = require('../../src/rollback/rollback-diff-generator');

// Simple test runner
const stats = { passed: 0, failed: 0, failures: [] };

function it(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    stats.passed++;
  } catch (error) {
    console.log(`  ✗ ${name}`);
    console.log(`    ${error.message}`);
    stats.failed++;
    stats.failures.push({ test: name, error: error.message });
  }
}

console.log('Running RollbackDiffGenerator tests...\n');

it('should generate diff with all sections', () => {
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
  
  assert.ok(typeof diff === 'string');
  assert.ok(diff.length > 0);
  assert.ok(diff.includes('Rollback Preview'));
});

it('should show warning when unsafe flag not set', () => {
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
  
  assert.ok(diff.includes('--unsafe'));
});

it('should format package changes correctly', () => {
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
  
  assert.ok(Array.isArray(lines));
  assert.ok(lines.length > 0);
});

it('should format config changes correctly', () => {
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
  
  assert.ok(Array.isArray(lines));
  assert.ok(lines.length > 0);
});

it('should format SSH key changes correctly', () => {
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
  
  assert.ok(Array.isArray(lines));
  assert.ok(lines.length > 0);
});

it('should format git config changes correctly', () => {
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
  
  assert.ok(Array.isArray(lines));
  assert.ok(lines.length > 0);
});

it('should format docs changes correctly', () => {
  const state = {
    rollback: {
      docs: {
        outputDir: '.jetpack-docs',
        filesCreated: 10
      }
    }
  };
  
  const lines = rollbackDiffGenerator.formatDocsChanges(state);
  
  assert.ok(Array.isArray(lines));
  assert.ok(lines.length > 0);
});

it('should handle empty state gracefully', () => {
  const state = {
    rollback: {
      dependencies: { npm: [], pip: [], system: [] },
      config: { backups: {}, originalGitConfig: {} },
      ssh: { keyPath: null, publicKeyPath: null },
      docs: { outputDir: null, filesCreated: 0 }
    }
  };
  
  const diff = rollbackDiffGenerator.generateDiff(state);
  
  assert.ok(typeof diff === 'string');
  assert.ok(diff.includes('Rollback Preview'));
});

it('should handle null components', () => {
  const state = {
    rollback: {
      dependencies: { npm: [], pip: [], system: [] },
      config: { backups: {}, originalGitConfig: null },
      ssh: {},
      docs: {}
    }
  };
  
  const lines = rollbackDiffGenerator.formatGitConfigChanges(state);
  
  assert.ok(Array.isArray(lines));
});

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
