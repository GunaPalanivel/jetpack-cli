const logger = require('../ui/logger');
const stateManager = require('../core/state-manager');

/**
 * Rollback State Module
 * 
 * Handles rollback-specific state operations:
 * - Validate state completeness for rollback
 * - Enhance state with rollback metadata
 * - Map phases to system components
 */
class RollbackState {
  /**
   * Validate that state contains necessary data for rollback
   * @param {object} state - State object from .jetpack-state.json
   * @returns {object} Validation result { valid: boolean, errors: string[] }
   */
  validateStateForRollback(state) {
    const errors = [];
    
    if (!state) {
      errors.push('No state found - nothing to rollback');
      return { valid: false, errors };
    }
    
    if (!state.installed) {
      errors.push('Installation not completed - nothing to rollback');
      return { valid: false, errors };
    }
    
    if (!state.rollback) {
      errors.push('State missing rollback tracking data (legacy installation)');
      return { valid: false, errors };
    }
    
    return { valid: true, errors: [] };
  }
  
  /**
   * Enhance state with rollback metadata (for backward compatibility)
   * @param {object} state - State object
   * @returns {object} Enhanced state with rollback section
   */
  enhanceStateWithRollbackData(state) {
    if (!state) {
      return null;
    }
    
    // If rollback section already exists, return as-is
    if (state.rollback) {
      return state;
    }
    
    // Build rollback section from existing data (backward compatibility)
    const rollback = {
      dependencies: {
        npm: [],
        pip: [],
        system: []
      },
      config: {
        backups: {},
        originalGitConfig: {}
      },
      ssh: {
        keyPath: null,
        publicKeyPath: null,
        addedToAgent: false
      },
      docs: {
        outputDir: null,
        filesCreated: 0
      }
    };
    
    // Try to extract dependency info from steps
    const steps = state.steps || [];
    const installStep = steps.find(s => s.id === 'dependencies');
    
    if (installStep && installStep.result) {
      const { system, npm, python } = installStep.result;
      
      if (system && system.installed) {
        rollback.dependencies.system = system.installed.map(pkg => ({
          name: pkg,
          installed: true,
          platform: state.environment?.platform || process.platform
        }));
      }
      
      if (npm && npm.installed) {
        rollback.dependencies.npm = npm.installed.map(pkg => ({
          name: pkg,
          installed: true,
          version: null
        }));
      }
      
      if (python && python.installed) {
        rollback.dependencies.pip = python.installed.map(pkg => ({
          name: pkg,
          installed: true,
          version: null
        }));
      }
    }
    
    // Try to extract config info
    const configStep = steps.find(s => s.id === 'config');
    if (configStep && configStep.result) {
      const { env, ssh, git } = configStep.result.files || {};
      
      if (env && env.created) {
        rollback.config.backups.env = env.created.find(f => f.includes('.env'));
      }
      
      if (ssh && ssh.created && ssh.created.length > 0) {
        rollback.ssh.keyPath = '~/.ssh/id_ed25519';
        rollback.ssh.publicKeyPath = '~/.ssh/id_ed25519.pub';
        rollback.ssh.addedToAgent = true;
      }
    }
    
    // Try to extract docs info
    const docsStep = steps.find(s => s.id === 'docs');
    if (docsStep && docsStep.result) {
      rollback.docs.outputDir = docsStep.result.outputDir || './docs';
      rollback.docs.filesCreated = docsStep.result.files?.length || 0;
    }
    
    return {
      ...state,
      rollback
    };
  }
  
  /**
   * Get components to rollback based on phase selection
   * @param {string[]} phases - Array of phase names (e.g., ['docs', 'config'])
   * @returns {object} Map of components to rollback
   */
  getPhaseComponents(phases = null) {
    const allPhases = {
      docs: ['documentation'],
      git: ['gitConfig'],
      ssh: ['sshKeys'],
      config: ['envFiles', 'gitignore'],
      dependencies: ['systemPackages', 'npmPackages', 'pythonPackages']
    };
    
    // If no specific phases, return all
    if (!phases || phases.length === 0) {
      return Object.values(allPhases).flat();
    }
    
    // Return only requested phases
    const components = [];
    phases.forEach(phase => {
      const phaseKey = phase.toLowerCase();
      if (allPhases[phaseKey]) {
        components.push(...allPhases[phaseKey]);
      }
    });
    
    return components;
  }
  
  /**
   * Load and validate state for rollback
   * @returns {object} { state, validation }
   */
  loadAndValidate() {
    const state = stateManager.load();
    const enhanced = this.enhanceStateWithRollbackData(state);
    const validation = this.validateStateForRollback(enhanced);
    
    return {
      state: enhanced,
      validation
    };
  }
  
  /**
   * Parse partial phases from command option
   * @param {string} partialOption - Comma-separated phase names
   * @returns {string[]} Array of phase names
   */
  parsePartialPhases(partialOption) {
    if (!partialOption || typeof partialOption !== 'string') {
      return [];
    }
    
    return partialOption
      .split(',')
      .map(p => p.trim().toLowerCase())
      .filter(p => ['docs', 'git', 'ssh', 'config', 'dependencies'].includes(p));
  }
}

module.exports = new RollbackState();
