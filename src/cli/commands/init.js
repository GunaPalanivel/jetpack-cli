const logger = require('../../ui/logger');
const orchestrator = require('../../core/orchestrator');
const envAnalyzer = require('../../detectors/env-analyzer');
const manifestFetcher = require('../../core/manifest-fetcher');
const { parseManifestFromString } = require('../../detectors/manifest-parser');

/**
 * Initialize developer onboarding from repository
 * @param {string} repoUrl - GitHub repository URL
 * @param {object} options - Command options
 */
async function init(repoUrl, options) {
  logger.header('🚀 Jetpack CLI - Developer Onboarding');
  logger.info(`Repository: ${repoUrl}`);
  
  if (options.dryRun) {
    logger.warning('⚠️  DRY RUN MODE - No changes will be made');
  }
  
  if (options.cache === false) {
    logger.info('Cache: Disabled (--no-cache)');
  }
  
  logger.newLine();

  try {
    // Step 1: Validate repository URL
    logger.step(1, 'Validating repository URL');
    if (!isValidRepoUrl(repoUrl)) {
      throw new Error('Invalid repository URL format. Expected: https://github.com/owner/repo');
    }
    logger.success('✓ Repository URL is valid');

    // Step 2: Fetch manifest from GitHub
    logger.step(2, 'Fetching manifest from GitHub');
    const manifestData = await manifestFetcher.fetchFromGitHub(repoUrl, {
      noCache: options.cache === false
    });
    
    // Parse manifest content
    const manifest = parseManifestFromString(manifestData.content);
    logger.success(`✓ Manifest parsed: ${manifest.name}`);
    logger.info(`  Source: ${manifestData.source}`);
    logger.info(`  File: ${manifestData.filename}`);

    // Step 3: Detect environment
    logger.step(3, 'Detecting system environment');
    const environment = await envAnalyzer.detect();
    logger.success(`✓ Detected: ${environment.os} | Node ${environment.nodeVersion} | ${environment.shell}`);
    
    if (options.dryRun) {
      logger.newLine();
      logger.info('📋 DRY RUN - Manifest Summary:');
      logger.info(`  Project: ${manifest.name}`);
      if (manifest.description) {
        logger.info(`  Description: ${manifest.description}`);
      }
      logger.info(`  System Dependencies: ${manifest.dependencies.system.length}`);
      logger.info(`  NPM Packages: ${manifest.dependencies.npm.length}`);
      logger.info(`  Python Packages: ${manifest.dependencies.python.length}`);
      logger.info(`  Required Env Vars: ${manifest.environment.required.length}`);
      logger.info(`  Setup Steps: ${manifest.setupSteps.length}`);
      logger.newLine();
      logger.info('📋 DRY RUN COMPLETE - No actual installation performed');
      return;
    }

    // Step 4: Run orchestrator with parsed manifest
    logger.step(4, 'Starting onboarding workflow');
    await orchestrator.run(repoUrl, environment, { ...options, manifest });
    
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
