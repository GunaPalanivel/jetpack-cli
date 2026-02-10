const logger = require('../../ui/logger');
const orchestrator = require('../../core/orchestrator');
const envAnalyzer = require('../../detectors/env-analyzer');

/**
 * Initialize developer onboarding from repository
 * @param {string} repoUrl - GitHub repository URL
 * @param {object} options - Command options
 */
async function init(repoUrl, options) {
  logger.header('🚀 Jetpack CLI - Developer Onboarding');
  logger.info(`Repository: ${repoUrl}`);
  logger.info(`Manifest: ${options.manifest}`);
  
  if (options.dryRun) {
    logger.warning('⚠️  DRY RUN MODE - No changes will be made');
  }
  
  logger.newLine();

  try {
    // Step 1: Validate repository URL
    logger.step(1, 'Validating repository URL');
    if (!isValidRepoUrl(repoUrl)) {
      throw new Error('Invalid repository URL format. Expected: https://github.com/owner/repo');
    }
    logger.success('✓ Repository URL is valid');

    // Step 2: Detect environment
    logger.step(2, 'Detecting system environment');
    const environment = await envAnalyzer.detect();
    logger.success(`✓ Detected: ${environment.os} | Node ${environment.nodeVersion} | ${environment.shell}`);
    
    if (options.dryRun) {
      logger.info('\n📋 DRY RUN COMPLETE - No actual installation performed');
      return;
    }

    // Step 3: Run orchestrator
    logger.step(3, 'Starting onboarding workflow');
    await orchestrator.run(repoUrl, environment, options);
    
    logger.newLine();
    logger.success('🎉 Onboarding complete! Your development environment is ready.');
    logger.info('\nNext steps:');
    logger.info('  • Run: jetpack verify');
    logger.info('  • Check: .env file for required API keys');
    logger.info('  • Review: Generated README-QUICKSTART.md');
    
  } catch (error) {
    logger.error('❌ Onboarding failed:', error.message);
    logger.info('\nRollback available: jetpack rollback');
    throw error;
  }
}

/**
 * Validate GitHub repository URL format
 * @param {string} url - Repository URL to validate
 * @returns {boolean}
 */
function isValidRepoUrl(url) {
  const githubPattern = /^https:\/\/github\.com\/[\w-]+\/[\w.-]+$/;
  return githubPattern.test(url);
}

module.exports = init;
