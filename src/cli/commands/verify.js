const logger = require('../../ui/logger');
const envAnalyzer = require('../../detectors/env-analyzer');
const stateManager = require('../../core/state-manager');
const VerificationOrchestrator = require('../../verification/core/VerificationOrchestrator');
const VerificationReporter = require('../../verification/utils/VerificationReporter');

/**
 * Verify all dependencies and configurations are correctly installed
 * @param {object} options - Command options
 */
async function verify(options) {
  logger.header('🔍 Jetpack CLI - Verification');
  logger.newLine();

  try {
    // Load state from last installation
    const state = stateManager.load();

    if (!state || !state.installed) {
      logger.warning('⚠️  No installation state found');
      logger.info('Run: jetpack init <repo-url> first');
      return;
    }

    logger.info(`Verifying installation from: ${new Date(state.timestamp).toLocaleString()}`);
    logger.newLine();

    // Step 1: Basic environment checks (legacy)
    logger.step(1, 'Checking system environment');
    const environment = await envAnalyzer.detect();
    logger.success(`✓ Node.js: ${environment.nodeVersion}`);
    logger.success(`✓ npm: ${environment.npmVersion}`);
    logger.success(`✓ Git: ${environment.gitVersion}`);
    logger.newLine();

    // Step 2: Legacy dependency checks
    if (state.dependencies && state.dependencies.length > 0) {
      logger.step(2, 'Checking installed dependencies');
      const checks = state.dependencies || [];
      let allValid = true;

      for (const dep of checks) {
        const isInstalled = await envAnalyzer.checkDependency(dep);
        if (isInstalled) {
          logger.success(`✓ ${dep}`);
        } else {
          logger.error(`✗ ${dep} - NOT FOUND`);
          allValid = false;
        }
      }

      logger.newLine();
    }

    // Step 3: New verification checks (if configured in manifest)
    if (state.manifest && state.manifest.verification && state.manifest.verification.checks) {
      logger.step(3, 'Running verification checks');

      const orchestrator = new VerificationOrchestrator();
      const reporter = new VerificationReporter();

      const verificationResult = await orchestrator.verifySetup(state.manifest.verification, {
        environment: environment,
        priority: options.priority,
        tags: options.tags,
        verbose: options.verbose,
        cwd: process.cwd()
      });

      // Display results
      if (options.verbose) {
        reporter.printResults(verificationResult, {
          showDetails: true,
          groupBy: 'priority',
          colorize: true
        });
      } else {
        reporter.printCompact(verificationResult, true);
      }

      // Save verification result to state
      if (!state.verificationHistory) {
        state.verificationHistory = [];
      }
      state.verificationHistory.push({
        timestamp: verificationResult.timestamp,
        success: verificationResult.success,
        summary: verificationResult.summary
      });
      // Keep only last 10 verification runs
      if (state.verificationHistory.length > 10) {
        state.verificationHistory = state.verificationHistory.slice(-10);
      }
      stateManager.save(state);

      logger.newLine();

      // Overall result
      if (verificationResult.success) {
        logger.success('✅ All verifications passed!');
        logger.info('Your development environment is ready to use.');
        process.exit(0);
      } else {
        if (verificationResult.hasCriticalFailures) {
          logger.error('❌ Critical verification checks failed');
        } else {
          logger.warning('⚠️  Some verification checks failed');
        }

        // Copilot Troubleshooting Integration
        if (options.copilotTroubleshoot) {
          logger.newLine();
          logger.header('🤖 Copilot Failure Analysis');

          const troubleshooter = require('../../core/copilot-troubleshooter');
          // Filter for failed checks
          const failures = verificationResult.checks.filter(r => !r.success);

          for (const fail of failures) {
            logger.info(`Analyzing failure: ${fail.name}...`);

            const suggestion = await troubleshooter.analyzeFailed(
              { type: fail.type, message: fail.error ? fail.error.message : 'Check failed' },
              {
                os: environment.os,
                nodeVersion: environment.nodeVersion,
                failedStep: fail.name
              }
            );

            logger.newLine();
            logger.info(`💡 ${fail.name}:`);
            logger.info(`   Cause: ${suggestion.cause}`);
            logger.info(`   Fix: ${suggestion.fix}`);
            if (suggestion.command) {
              logger.info(`   Command: ${suggestion.command}`);
            }
            logger.newLine();
          }
        }

        logger.info('Review the failures above and fix them before proceeding.');
        process.exit(1);
      }
    } else {
      // No verification checks configured
      logger.info('ℹ️  No verification checks configured in manifest');
      logger.success('✅ Basic environment checks passed!');
    }

  } catch (error) {
    logger.error('❌ Verification failed:', error.message);
    if (options.verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

module.exports = verify;
