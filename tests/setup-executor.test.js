/**
 * Test script for setup step executor
 */

const setupExecutor = require('../src/core/setup-executor');

describe('Setup Executor Tests', () => {

  test('Validate valid step', () => {
    const validStep = {
      name: 'Install dependencies',
      command: 'npm install',
      description: 'Install all Node.js dependencies'
    };

    const error = setupExecutor.validateStep(validStep, 1);
    expect(error).toBeNull();
  });

  test('Reject step with missing command', () => {
    const invalidStep = {
      name: 'Install dependencies'
      // Missing command field
    };

    const error = setupExecutor.validateStep(invalidStep, 1);
    expect(error).toContain('command');
  });

  test('Reject step with empty command', () => {
    const invalidStep = {
      name: 'Install dependencies',
      command: '   '  // Empty/whitespace only
    };

    const error = setupExecutor.validateStep(invalidStep, 1);
    expect(error).toContain('empty');
  });

  test('Reject step with non-string command', () => {
    const invalidStep = {
      name: 'Install dependencies',
      command: 123  // Number instead of string
    };

    const error = setupExecutor.validateStep(invalidStep, 1);
    expect(error).toContain('string');
  });

  test('Reject step with non-string name', () => {
    const invalidStep = {
      name: 123,  // Number instead of string
      command: 'npm install'
    };

    const error = setupExecutor.validateStep(invalidStep, 1);
    expect(error).toContain('name');
  });

  test('Execute step in dry-run mode', () => {
    const step = {
      name: 'List files',
      command: 'echo "Hello from dry-run"',
      description: 'Test command'
    };

    const result = setupExecutor.runStep(step, 1, { dryRun: true });

    expect(result.success).toBe(true);
    expect(result.skipped).toBe(true);
  });

  test('Execute actual step (safe command)', () => {
    const step = {
      name: 'Echo test',
      command: 'echo "Setup step test successful"',
      description: 'Test actual execution'
    };

    const result = setupExecutor.runStep(step, 1, { dryRun: false });

    expect(result.success).toBe(true);
    expect(result.skipped).toBe(false);
  });

  test('Handle failing step correctly', () => {
    const step = {
      name: 'Failing command',
      command: 'exit 1',  // This will fail
      description: 'Test error handling'
    };

    const result = setupExecutor.runStep(step, 1, { dryRun: false });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('Execute multiple steps (dry-run)', async () => {
    const steps = [
      { name: 'Step 1', command: 'echo "First step"' },
      { name: 'Step 2', command: 'echo "Second step"' },
      { name: 'Step 3', command: 'echo "Third step"' }
    ];

    const result = await setupExecutor.executeSteps(steps, { dryRun: true });

    expect(result.success).toBe(true);
    expect(result.executed).toBe(3);
  });

  test('Handle empty steps array', async () => {
    const result = await setupExecutor.executeSteps([], { dryRun: false });

    expect(result.success).toBe(true);
    expect(result.executed).toBe(0);
  });

  test('Handle null/undefined steps', async () => {
    const result = await setupExecutor.executeSteps(null, { dryRun: false });

    expect(result.success).toBe(true);
    expect(result.executed).toBe(0);
  });

  test('Stop on failure behavior', async () => {
    const steps = [
      { name: 'Step 1', command: 'echo "First step succeeds"' },
      { name: 'Step 2', command: 'exit 1' },  // This will fail
      { name: 'Step 3', command: 'echo "Third step should be skipped"' }
    ];

    const result = await setupExecutor.executeSteps(steps, { dryRun: false });

    // Step 1 runs, Step 2 runs and fails. Step 3 skipped. 
    // Executed includes failed step? Implementation says yes usually.
    expect(result.success).toBe(false);
    expect(result.executed).toBe(2);
    expect(result.failed).toBe(1);
    expect(result.failedStep.name).toBe('Step 2');
  });

});
