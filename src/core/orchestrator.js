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
      { id: 4, name: 'Execute Setup Steps', handler: this.executeSetupSteps },
      { id: 5, name: 'Generate Configurations', handler: this.generateConfigs },
      { id: 6, name: 'Create Documentation', handler: this.createDocs },
      { id: 7, name: 'Verify Setup', handler: this.verifySetup }
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
      installed: false,
      rollback: {
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
      }
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

        // Enhance rollback tracking after specific steps
        this.enhanceRollbackTracking(state, step.id, stepResult);

        // Persist manifest to state root after parsing
        if (step.id === 2 && stepResult.manifest) {
          state.manifest = stepResult.manifest;
          state.dependencies = [
            ...(stepResult.manifest.dependencies.system || []),
            ...(stepResult.manifest.dependencies.npm || []),
            ...(stepResult.manifest.dependencies.python || [])
          ];
        }

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
   * Enhance rollback tracking data after each step
   * @param {object} state - Current state object
   * @param {number} stepId - Step ID
   * @param {object} stepResult - Result from the step
   */
  enhanceRollbackTracking(state, stepId, stepResult) {
    switch (stepId) {
      case 3: // Install Dependencies
        if (stepResult.packages) {
          const { system, npm, python } = stepResult.packages;

          // Track npm packages
          if (npm && npm.installed) {
            state.rollback.dependencies.npm = npm.installed.map(pkg => ({
              name: pkg,
              installed: true,
              version: null
            }));
          }
          if (npm && npm.skipped) {
            state.rollback.dependencies.npm.push(...npm.skipped.map(pkg => ({
              name: pkg,
              installed: false,
              version: null
            })));
          }

          // Track pip packages
          if (python && python.installed) {
            state.rollback.dependencies.pip = python.installed.map(pkg => ({
              name: pkg,
              installed: true,
              version: null
            }));
          }
          if (python && python.skipped) {
            state.rollback.dependencies.pip.push(...python.skipped.map(pkg => ({
              name: pkg,
              installed: false,
              version: null
            })));
          }

          // Track system packages
          if (system && system.installed) {
            state.rollback.dependencies.system = system.installed.map(pkg => ({
              name: pkg,
              installed: true,
              platform: state.environment.platform
            }));
          }
          if (system && system.skipped) {
            state.rollback.dependencies.system.push(...system.skipped.map(pkg => ({
              name: pkg,
              installed: false,
              platform: state.environment.platform
            })));
          }
        }
        break;

      case 5: // Generate Configurations
        if (stepResult.files) {
          const { env, ssh, git } = stepResult.files;

          // Track env backups
          if (env && env.created) {
            const envFile = env.created.find(f => f.includes('.env.backup'));
            if (envFile) {
              state.rollback.config.backups.env = envFile;
            }
          }

          // Track SSH keys
          if (ssh && ssh.created && ssh.created.length > 0) {
            state.rollback.ssh.keyPath = '~/.ssh/id_ed25519';
            state.rollback.ssh.publicKeyPath = '~/.ssh/id_ed25519.pub';
            state.rollback.ssh.addedToAgent = true;
          }

          // Track original git config (will be enhanced in config-generator)
          if (git && git.original) {
            state.rollback.config.originalGitConfig = git.original;
          }
        }
        break;

      case 6: // Create Documentation
        if (stepResult.generated && stepResult.files) {
          state.rollback.docs.outputDir = stepResult.outputDir || './docs';
          state.rollback.docs.filesCreated = stepResult.files.length || 0;
        }
        break;
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
   * Step 4: Execute Setup Steps
   */
  async executeSetupSteps(repoUrl, environment, options) {
    const setupExecutor = require('./setup-executor');

    // Get manifest from previous step
    const manifestResult = this.getStepResult(options, 'Parse Manifest');

    if (!manifestResult || !manifestResult.manifest) {
      logger.warning('  → No manifest available');
      return {
        executed: false,
        steps: [],
        error: 'Manifest not available'
      };
    }

    const manifest = manifestResult.manifest;

    // Check if there are setup steps to execute
    if (!manifest.setupSteps || manifest.setupSteps.length === 0) {
      logger.info('  → No setup steps to execute');
      return {
        executed: false,
        steps: [],
        message: 'No setup steps in manifest'
      };
    }

    // Execute setup steps
    const result = await setupExecutor.executeSteps(
      manifest.setupSteps,
      options
    );

    // Stop workflow if setup steps failed
    if (!result.success) {
      throw new Error(`Setup failed: ${result.error}`);
    }

    return {
      executed: result.executed > 0,
      steps: result,
      summary: {
        executed: result.executed,
        skipped: result.skipped,
        failed: result.failed
      }
    };
  }

  /**
   * Step 5: Generate Configurations
   */
  async generateConfigs(repoUrl, environment, options) {
    const configGenerator = require('./config-generator');

    // Get manifest from previous step
    const manifestResult = this.getStepResult(options, 'Parse Manifest');

    if (!manifestResult || !manifestResult.manifest) {
      logger.warning('  → No manifest available');
      return {
        generated: false,
        files: {},
        error: 'Manifest not available'
      };
    }

    const manifest = manifestResult.manifest;

    // Generate configurations
    const result = await configGenerator.generateConfigs(
      manifest,
      environment,
      options
    );

    return {
      generated: result.generated,
      files: result.files,
      summary: result.summary
    };
  }

  /**
   * Step 6: Create Documentation
   */
  async createDocs(repoUrl, environment, options) {
    const documentGenerator = require('../docs/core/DocumentGenerator');

    // Get manifest from previous step
    const manifestResult = this.getStepResult(options, 'Parse Manifest');

    if (!manifestResult || !manifestResult.manifest) {
      logger.warning('  → No manifest available for documentation generation');
      return {
        created: false,
        skipped: true,
        reason: 'Manifest not available'
      };
    }

    const manifest = manifestResult.manifest;

    // Check if documentation is disabled
    if (manifest.documentation && manifest.documentation.enabled === false) {
      logger.info('  → Documentation generation disabled in manifest');
      return {
        created: false,
        skipped: true,
        reason: 'Disabled in manifest'
      };
    }

    // Generate documentation
    logger.info('  → Generating project documentation...');

    try {
      const result = await documentGenerator.generate(
        manifest,
        options._state,
        { ...options, environment }
      );

      if (result.generated) {
        logger.success(`  → Generated ${result.files.length} documentation file(s)`);
        logger.info(`  → Documentation saved to: ${result.outputDir}`);
      }

      return result;

    } catch (error) {
      logger.warning(`  → Documentation generation failed: ${error.message}`);
      // Don't fail the entire workflow for documentation errors
      return {
        created: false,
        error: error.message,
        files: []
      };
    }
  }

  /**
   * Step 7: Verify Setup
   */
  async verifySetup(repoUrl, environment, options) {
    const VerificationOrchestrator = require('../verification/core/VerificationOrchestrator');

    // Get manifest from previous step
    const manifestResult = this.getStepResult(options, 'Parse Manifest');

    if (!manifestResult || !manifestResult.manifest) {
      logger.warning('  → No manifest available for verification');
      return {
        verified: false,
        skipped: true,
        reason: 'Manifest not available'
      };
    }

    const manifest = manifestResult.manifest;

    // Check if verification is enabled in manifest
    if (!manifest.verification || !manifest.verification.checks || manifest.verification.checks.length === 0) {
      logger.info('  → No verification checks configured in manifest');
      return {
        verified: true,
        skipped: true,
        reason: 'No checks configured'
      };
    }

    logger.info('  → Running verification checks...');

    try {
      const verifier = new VerificationOrchestrator();
      const result = await verifier.verifySetup(manifest.verification, {
        environment,
        cwd: process.cwd(),
        verbose: options.verbose || false
      });

      // Log results
      const summary = result.summary;
      logger.info(`  → Completed: ${summary.passed}/${summary.total} checks passed`);

      if (result.hasCriticalFailures) {
        const p0Failed = summary.byPriority.P0.failed;
        logger.warning(`  → ⚠️  ${p0Failed} critical (P0) check(s) failed`);
        logger.info('  → Continuing despite failures (lenient mode)');
      }

      if (summary.failed > 0) {
        logger.info(`  → ${summary.failed} check(s) failed (non-critical)`);
      }

      return {
        verified: result.success,
        hasCriticalFailures: result.hasCriticalFailures,
        summary: summary,
        details: result
      };

    } catch (error) {
      logger.error(`  → Verification error: ${error.message}`);
      return {
        verified: false,
        error: error.message,
        hasCriticalFailures: true
      };
    }
  }
}

module.exports = new Orchestrator();
