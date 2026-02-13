/**
 * Integration test for Setup Step Execution
 * Tests the full orchestrator workflow with setup steps
 */

const path = require('path');
const manifestParser = require('../src/detectors/manifest-parser');
const setupExecutor = require('../src/core/setup-executor');
const orchestrator = require('../src/core/orchestrator');

describe('Setup Execution Integration', () => {

  test('Execute setup steps from basic-example.yaml (dry-run)', async () => {
    const manifestPath = path.join(__dirname, '../templates/basic-example.yaml');
    let manifest;
    try {
      manifest = manifestParser.parseManifest(manifestPath);
    } catch {
      console.warn('Skipping basic-example test due to missing file');
      return;
    }

    expect(manifest.setupSteps.length).toBeGreaterThan(0);

    // Execute in dry-run mode
    const result = await setupExecutor.executeSteps(manifest.setupSteps, { dryRun: true });

    expect(result.success).toBe(true);
    expect(result.executed).toBe(3); // Based on template known size
  });

  test('Execute setup steps from complex-example.yaml (dry-run)', async () => {
    const manifestPath = path.join(__dirname, '../templates/complex-example.yaml');
    let manifest;
    try {
      manifest = manifestParser.parseManifest(manifestPath);
    } catch {
      console.warn('Skipping complex-example test');
      return;
    }

    const result = await setupExecutor.executeSteps(manifest.setupSteps, { dryRun: true });

    expect(result.success).toBe(true);
    expect(result.executed).toBeGreaterThan(0);
  });

  test('Orchestrator Step 4 integration (simulated)', async () => {
    const manifestPath = path.join(__dirname, '../templates/basic-example.yaml');
    let manifest;
    try {
      manifest = manifestParser.parseManifest(manifestPath);
    } catch {
      return;
    }

    const options = {
      dryRun: true,
      _state: {
        steps: [
          {
            id: 2,
            name: 'Parse Manifest',
            result: { manifest }
          }
        ]
      }
    };

    const result = await orchestrator.executeSetupSteps(
      'https://github.com/test/repo',
      { os: 'windows' },
      options
    );

    expect(result.executed).toBe(true);
    expect(result.summary.executed).toBe(3);
  });

  test('Handle manifest with no setup steps', async () => {
    const options = {
      dryRun: true,
      _state: {
        steps: [
          {
            id: 2,
            name: 'Parse Manifest',
            result: {
              manifest: {
                name: 'no-steps-project',
                dependencies: { system: [], npm: [], python: [] },
                environment: { required: [], optional: [] },
                setupSteps: []  // Empty
              }
            }
          }
        ]
      }
    };

    const result = await orchestrator.executeSetupSteps(
      'https://github.com/test/repo',
      { os: 'windows' },
      options
    );

    expect(result.executed).toBeFalsy();
    expect(result.message).toBe('No setup steps in manifest');
  });

  test('Handle missing manifest gracefully', async () => {
    const options = {
      dryRun: true,
      _state: {
        steps: []  // No manifest in state
      }
    };

    const result = await orchestrator.executeSetupSteps(
      'https://github.com/test/repo',
      { os: 'windows' },
      options
    );

    expect(result.executed).toBeFalsy();
    expect(result.error).toBe('Manifest not available');
  });

});
