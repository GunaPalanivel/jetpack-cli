/**
 * Test suite for dependency-installer
 * Tests installation logic with dry-run mode
 */

const installer = require('../src/core/dependency-installer');

describe('Dependency Installer Tests', () => {

  const mockEnvironment = {
    os: 'Windows',
    platform: 'win32',
    packageManagers: {
      npm: true,
      chocolatey: true,
      scoop: false,
      winget: false
    }
  };

  test('Handle empty dependencies', async () => {
    const result = await installer.installDependencies(
      { system: [], npm: [], python: [] },
      mockEnvironment,
      { dryRun: true }
    );
    expect(result.summary.installed).toBe(0);
  });

  test('Dry-run does not execute commands', async () => {
    const result = await installer.installDependencies(
      {
        system: ['git'],
        npm: ['eslint'],
        python: ['requests']
      },
      mockEnvironment,
      { dryRun: true }
    );

    // In dry-run, packages are "installed" (simulated)
    expect(result.summary.installed).toBeGreaterThan(0);
    // Real installation would happen if not dry-run
  });

  test('Calculate summary correctly', () => {
    const testResults = {
      system: { installed: ['git'], skipped: ['nodejs'], failed: [] },
      npm: { installed: ['eslint'], skipped: [], failed: [] },
      python: { installed: [], skipped: [], failed: [{ package: 'requests', reason: 'pip not found' }] }
    };

    const summary = installer.calculateSummary(testResults);

    expect(summary.installed).toBe(2);
    expect(summary.skipped).toBe(1);
    expect(summary.failed).toBe(1);
  });

  test('Handle missing package manager gracefully', async () => {
    const noManagerEnv = {
      os: 'Linux',
      platform: 'linux',
      packageManagers: {
        npm: false,
        apt: false,
        yum: false
      }
    };

    const result = await installer.installDependencies(
      { system: ['git'], npm: [], python: [] },
      noManagerEnv,
      { dryRun: true }
    );

    // Should fail gracefully
    expect(result.system.failed.length).toBeGreaterThan(0);
  });

  test('Handle mixed success/failure scenarios', async () => {
    const result = await installer.installDependencies(
      {
        system: ['git', 'nodejs'],
        npm: ['eslint', 'prettier'],
        python: []
      },
      mockEnvironment,
      { dryRun: true }
    );

    expect(result.system).toBeDefined();
    expect(result.npm).toBeDefined();
    expect(result.python).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(typeof result.summary.installed).toBe('number');
  });

});
