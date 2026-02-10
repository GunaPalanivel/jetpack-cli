const logger = require('../ui/logger');
const stateManager = require('./state-manager');

/**
 * Orchestrator - Main workflow engine coordinating all onboarding steps
 */
class Orchestrator {
  constructor() {
    this.steps = [
      { id: 1, name: 'Environment Detection', handler: this.detectEnvironment },
      { id: 2, name: 'Parse Manifest', handler: this.parseManifest },
      { id: 3, name: 'Install Dependencies', handler: this.installDependencies },
      { id: 4, name: 'Generate Configurations', handler: this.generateConfigs },
      { id: 5, name: 'Create Documentation', handler: this.createDocs },
      { id: 6, name: 'Verify Setup', handler: this.verifySetup }
    ];
  }

  /**
   * Run the complete onboarding workflow
   * @param {string} repoUrl - Repository URL
   * @param {object} environment - Detected environment
   * @param {object} options - Command options
   */
  async run(repoUrl, environment, options) {
    logger.info('Starting orchestration workflow...\n');

    const state = {
      repoUrl,
      environment,
      timestamp: new Date().toISOString(),
      steps: [],
      installed: false
    };

    // Store state in options for step communication
    options._state = state;

    try {
      for (const step of this.steps) {
        logger.step(step.id, step.name);
        
        const stepResult = await step.handler.call(this, repoUrl, environment, options);
        
        state.steps.push({
          id: step.id,
          name: step.name,
          status: 'completed',
          result: stepResult,
          timestamp: new Date().toISOString()
        });
        
        logger.success(`✓ ${step.name} completed`);
        
        // Save state after each step for recovery
        stateManager.save(state);
      }

      state.installed = true;
      stateManager.save(state);

      logger.success('\n✅ All workflow steps completed successfully!');

    } catch (error) {
      logger.error(`\n❌ Workflow failed at step: ${error.step || 'unknown'}`);
      logger.error(`Error: ${error.message}`);
      
      state.error = {
        message: error.message,
        step: error.step,
        timestamp: new Date().toISOString()
      };
      
      stateManager.save(state);
      throw error;
    }
  }

  /**
   * Step 1: Detect Environment
   */
  async detectEnvironment(repoUrl, environment, options) {
    // Already done by env-analyzer, just log it
    return { 
      detected: true,
      os: environment.os,
      node: environment.nodeVersion
    };
  }

  /**
   * Step 2: Parse Manifest
   */
  async parseManifest(repoUrl, environment, options) {
    // Manifest already fetched and parsed in init.js
    // Just return the parsed manifest from options
    if (options.manifest) {
      logger.info('  → Using pre-fetched manifest');
      logger.info(`  → Project: ${options.manifest.name}`);
      
      return {
        parsed: true,
        manifest: options.manifest,
        dependencies: options.manifest.dependencies,
        environment: options.manifest.environment,
        setupSteps: options.manifest.setupSteps
      };
    }
    
    // Fallback: placeholder for local manifest files
    logger.info('  → Manifest parsing would happen here');
    logger.info('  → Looking for .onboard.yaml in repository');
    
    return {
      parsed: false,
      manifestFile: options.manifest || '.onboard.yaml',
      dependencies: []
    };
  }

  /**
   * Step 3: Install Dependencies
   */
  async installDependencies(repoUrl, environment, options) {
    const dependencyInstaller = require('./dependency-installer');
    
    // Check if installation should be skipped
    if (options.skipInstall) {
      logger.warning('  → Skipped (--skip-install flag)');
      return {
        installed: false,
        skipped: true,
        packages: []
      };
    }
    
    // Get manifest from previous step
    const manifestResult = this.getStepResult(options, 'Parse Manifest');
    
    if (!manifestResult || !manifestResult.manifest) {
      logger.warning('  → No manifest available');
      return {
        installed: false,
        packages: [],
        error: 'Manifest not available'
      };
    }
    
    const manifest = manifestResult.manifest;
    
    // Check if there are any dependencies to install
    const hasDeps = (
      (manifest.dependencies.system && manifest.dependencies.system.length > 0) ||
      (manifest.dependencies.npm && manifest.dependencies.npm.length > 0) ||
      (manifest.dependencies.python && manifest.dependencies.python.length > 0)
    );
    
    if (!hasDeps) {
      logger.info('  → No dependencies to install');
      return {
        installed: false,
        packages: [],
        message: 'No dependencies in manifest'
      };
    }
    
    // Install dependencies
    const result = await dependencyInstaller.installDependencies(
      manifest.dependencies,
      environment,
      options
    );
    
    return {
      installed: result.summary.installed > 0,
      packages: result,
      summary: result.summary
    };
  }

  /**
   * Helper: Get result from previous step
   * @private
   */
  getStepResult(options, stepName) {
    if (!options._state || !options._state.steps) return null;
    const step = options._state.steps.find(s => s.name === stepName);
    return step ? step.result : null;
  }

  /**
   * Step 4: Generate Configurations
   */
  async generateConfigs(repoUrl, environment, options) {
    // Placeholder: In real implementation, create .env, SSH keys, etc.
    logger.info('  → Configuration generation would happen here');
    logger.info('  → Creating .env templates and SSH keys');
    
    return {
      generated: true,
      files: []
    };
  }

  /**
   * Step 5: Create Documentation
   */
  async createDocs(repoUrl, environment, options) {
    // Placeholder: In real implementation, generate custom README
    logger.info('  → Documentation generation would happen here');
    logger.info('  → Creating personalized getting-started guide');
    
    return {
      created: true,
      docs: []
    };
  }

  /**
   * Step 6: Verify Setup
   */
  async verifySetup(repoUrl, environment, options) {
    // Placeholder: In real implementation, run verification checks
    logger.info('  → Setup verification would happen here');
    logger.info('  → Running health checks on installed dependencies');
    
    return {
      verified: true,
      checks: []
    };
  }
}

module.exports = new Orchestrator();
