/**
 * Test script for Phase 5 - Complete (P0 + P1 + P2)
 * Tests config-generator.js with all features
 */

const configGenerator = require('../src/core/config-generator');
const manifestParser = require('../src/detectors/manifest-parser');
const path = require('path');
const fs = require('fs');

// Mock config-utils to control environment and git checks
jest.mock('../src/core/config-utils', () => {
  const originalModule = jest.requireActual('../src/core/config-utils');
  return {
    ...originalModule,
    getGitConfig: jest.fn(),
    setGitConfig: jest.fn(),
    generateSshKey: jest.fn(),
    addSshKeyToAgent: jest.fn(),
    generateCopilotValue: jest.fn(),
    getCopilotExplanation: jest.fn()
  };
});

const configUtils = require('../src/core/config-utils');

describe('Config Generator Tests', () => {

  const projectRoot = process.cwd();
  const envFiles = ['.env.template', '.env.example', '.env'];

  beforeEach(() => {
    // Default mocks
    configUtils.getGitConfig.mockReturnValue(null);
    configUtils.setGitConfig.mockReturnValue({ success: true });
    configUtils.generateSshKey.mockReturnValue({ success: true, publicKey: 'ssh-ed25519 AAAA...' });
    configUtils.addSshKeyToAgent.mockReturnValue({ success: true });
    configUtils.generateCopilotValue.mockResolvedValue('mock-value');
    configUtils.getCopilotExplanation.mockResolvedValue('mock-explanation');
  });

  afterEach(() => {
    // Cleanup test files
    envFiles.forEach(file => {
      try {
        if (fs.existsSync(path.join(projectRoot, file))) {
          fs.unlinkSync(path.join(projectRoot, file));
        }
      } catch (err) {
        // Ignore
      }
    });
  });

  test('Dry-run mode (All features)', async () => {
    const manifestPath = path.join(__dirname, '..', 'templates', 'complete-config.yaml');
    const manifest = manifestParser.parseManifest(manifestPath);

    const dryRunResult = await configGenerator.generateConfigs(
      manifest,
      { os: 'Windows', platform: 'win32' },
      { dryRun: true }
    );

    expect(dryRunResult.generated).toBe(true);
    expect(dryRunResult.files.env.created.length).toBeGreaterThan(0);
    expect(dryRunResult.files.ssh.created.length).toBeGreaterThan(0);
    expect(dryRunResult.files.git.created.length).toBeGreaterThan(0);
  });

  test('Actual generation (P0 ENV only)', async () => {
    const manifestPath = path.join(__dirname, '..', 'templates', 'complete-config.yaml');
    const manifest = manifestParser.parseManifest(manifestPath);
    const envOnlyManifest = { ...manifest, ssh: undefined, git: undefined };

    const actualResult = await configGenerator.generateConfigs(
      envOnlyManifest,
      { os: 'Windows', platform: 'win32' },
      { dryRun: false }
    );

    expect(actualResult.generated).toBe(true);
    expect(actualResult.files.env.created.length).toBeGreaterThan(0);

    // Verify files exist
    envFiles.forEach(file => {
      const exists = fs.existsSync(path.join(projectRoot, file));
      expect(exists).toBe(true);
    });
  });

});
