const fs = require('fs');
const path = require('path');
const rollbackState = require('../../src/rollback/rollback-state');

describe('RollbackState Module', () => {
  const testDir = path.join(__dirname, 'test-temp');
  const testStateFile = path.join(testDir, '.jetpack-state.json');

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

  afterEach(() => {
    if (fs.existsSync(testStateFile)) {
      fs.unlinkSync(testStateFile);
    }
  });

  describe('validateStateForRollback()', () => {
    test('should reject null state', () => {
      const result = rollbackState.validateStateForRollback(null);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('No state found');
    });

    test('should reject state without installed flag', () => {
      const state = { rollback: {} };
      const result = rollbackState.validateStateForRollback(state);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Installation not completed'))).toBe(true);
    });

    test('should reject state without rollback section', () => {
      const state = { installed: true };
      const result = rollbackState.validateStateForRollback(state);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('missing rollback tracking data'))).toBe(true);
    });

    test('should accept valid state', () => {
      const state = {
        installed: true,
        rollback: {
          dependencies: {},
          config: {}
        }
      };
      const result = rollbackState.validateStateForRollback(state);

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('enhanceStateWithRollbackData()', () => {
    test('should return null for null state', () => {
      const result = rollbackState.enhanceStateWithRollbackData(null);
      expect(result).toBeNull();
    });

    test('should return state unchanged if rollback section exists', () => {
      const state = {
        installed: true,
        rollback: {
          dependencies: { npm: ['test-pkg'] }
        }
      };

      const result = rollbackState.enhanceStateWithRollbackData(state);
      expect(result).toEqual(state);
    });

    test('should add rollback section to legacy state', () => {
      const state = {
        installed: true,
        steps: []
      };

      const result = rollbackState.enhanceStateWithRollbackData(state);

      expect(result.rollback).toBeDefined();
      expect(result.rollback.dependencies).toBeDefined();
      expect(result.rollback.config).toBeDefined();
      expect(result.rollback.ssh).toBeDefined();
      expect(result.rollback.docs).toBeDefined();
    });

    test('should extract npm packages from steps', () => {
      const state = {
        installed: true,
        steps: [{
          id: 'dependencies',
          result: {
            npm: {
              installed: ['eslint', 'prettier']
            }
          }
        }]
      };

      const result = rollbackState.enhanceStateWithRollbackData(state);

      expect(result.rollback.dependencies.npm.length).toBe(2);
      expect(result.rollback.dependencies.npm[0].name).toBe('eslint');
      expect(result.rollback.dependencies.npm[1].name).toBe('prettier');
    });

    test('should extract system packages from steps', () => {
      const state = {
        installed: true,
        environment: { platform: 'win32' },
        steps: [{
          id: 'dependencies',
          result: {
            system: {
              installed: ['git', 'nodejs']
            }
          }
        }]
      };

      const result = rollbackState.enhanceStateWithRollbackData(state);

      expect(result.rollback.dependencies.system.length).toBe(2);
      expect(result.rollback.dependencies.system[0].name).toBe('git');
      expect(result.rollback.dependencies.system[0].platform).toBe('win32');
    });

    test('should extract python packages from steps', () => {
      const state = {
        installed: true,
        steps: [{
          id: 'dependencies',
          result: {
            python: {
              installed: ['requests', 'pytest']
            }
          }
        }]
      };

      const result = rollbackState.enhanceStateWithRollbackData(state);

      expect(result.rollback.dependencies.pip.length).toBe(2);
      expect(result.rollback.dependencies.pip[0].name).toBe('requests');
    });
  });

  describe('getPhaseComponents()', () => {
    test('should return all components when no phases specified', () => {
      const components = rollbackState.getPhaseComponents(null);

      expect(components).toContain('documentation');
      expect(components).toContain('gitConfig');
      expect(components).toContain('envFiles');
      expect(components).toContain('npmPackages');
    });

    test('should return only docs components for docs phase', () => {
      const components = rollbackState.getPhaseComponents(['docs']);

      expect(components).toContain('documentation');
      expect(components.length).toBe(1);
    });

    test('should return multiple phase components', () => {
      const components = rollbackState.getPhaseComponents(['docs', 'config']);

      expect(components).toContain('documentation');
      expect(components).toContain('envFiles');
      expect(components).toContain('gitignore');
      expect(components.length).toBe(3);
    });

    test('should handle case-insensitive phase names', () => {
      const components = rollbackState.getPhaseComponents(['DOCS', 'Config']);

      expect(components).toContain('documentation');
      expect(components).toContain('envFiles');
    });

    test('should ignore invalid phase names', () => {
      const components = rollbackState.getPhaseComponents(['docs', 'invalid', 'config']);

      expect(components).toContain('documentation');
      expect(components).toContain('envFiles');
      expect(components.length).toBe(3);
    });
  });

  describe('parsePartialPhases()', () => {
    test('should parse comma-separated phases', () => {
      const phases = rollbackState.parsePartialPhases('docs,config,ssh');
      expect(phases).toEqual(['docs', 'config', 'ssh']);
    });

    test('should trim whitespace', () => {
      const phases = rollbackState.parsePartialPhases('docs , config , ssh');
      expect(phases).toEqual(['docs', 'config', 'ssh']);
    });

    test('should normalize to lowercase', () => {
      const phases = rollbackState.parsePartialPhases('DOCS,Config,SSH');
      expect(phases).toEqual(['docs', 'config', 'ssh']);
    });

    test('should filter out invalid phases', () => {
      const phases = rollbackState.parsePartialPhases('docs,invalid,config');
      expect(phases).toEqual(['docs', 'config']);
    });

    test('should handle empty string', () => {
      const phases = rollbackState.parsePartialPhases('');
      expect(phases).toEqual([]);
    });

    test('should handle null input', () => {
      const phases = rollbackState.parsePartialPhases(null);
      expect(phases).toEqual([]);
    });

    test('should accept all valid phase names', () => {
      const phases = rollbackState.parsePartialPhases('docs,git,ssh,config,dependencies');
      expect(phases).toEqual(['docs', 'git', 'ssh', 'config', 'dependencies']);
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete state lifecycle', () => {
      const originalState = {
        installed: true,
        rollback: {
          dependencies: {
            npm: [{ name: 'eslint', installed: true }]
          },
          config: {
            backups: { env: '.env.backup' }
          }
        }
      };

      // Validate
      const validation = rollbackState.validateStateForRollback(originalState);
      expect(validation.valid).toBe(true);

      // Parse phases
      const phases = rollbackState.parsePartialPhases('config,docs');
      expect(phases.length).toBe(2);

      // Get components
      const components = rollbackState.getPhaseComponents(phases);
      expect(components).toContain('envFiles');
      expect(components).toContain('documentation');
    });
  });
});
