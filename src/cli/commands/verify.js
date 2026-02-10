const logger = require('../../ui/logger');
const envAnalyzer = require('../../detectors/env-analyzer');
const stateManager = require('../../core/state-manager');

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

    // Verify environment
    logger.step(1, 'Checking system environment');
    const environment = await envAnalyzer.detect();
    logger.success(`✓ Node.js: ${environment.nodeVersion}`);
    logger.success(`✓ npm: ${environment.npmVersion}`);
    logger.success(`✓ Git: ${environment.gitVersion}`);

    // Verify installed dependencies
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
    
    if (allValid) {
      logger.success('✅ All verifications passed!');
      logger.info('Your development environment is ready to use.');
    } else {
      logger.error('❌ Some dependencies are missing');
      logger.info('Consider running: jetpack rollback && jetpack init <repo-url>');
    }

  } catch (error) {
    logger.error('❌ Verification failed:', error.message);
    throw error;
  }
}

module.exports = verify;
