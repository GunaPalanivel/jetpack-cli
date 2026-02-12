const logger = require('../../ui/logger');
const stateManager = require('../../core/state-manager');
const rollbackOrchestrator = require('../../rollback/rollback-orchestrator');

/**
 * Rollback Command
 * 
 * Undoes all changes made by Jetpack installation:
 * - Uninstalls packages (with --unsafe)
 * - Restores config files from backups
 * - Removes SSH keys
 * - Restores git configuration
 * - Removes generated documentation
 * 
 * Supports:
 * - --dry-run: Preview changes without executing
 * - --partial: Rollback specific phases only
 * - --unsafe: Allow package uninstallation
 * - --force: Skip safety checks (dangerous)
 */
async function rollback(options = {}) {
  try {
    // Check if state exists
    if (!stateManager.exists()) {
      logger.error('No Jetpack installation found to rollback');
      logger.info('Run "jetpack install" first');
      return;
    }

    // Parse options
    const rollbackOptions = {
      dryRun: options.dryRun || false,
      partial: options.partial || null,
      unsafe: options.unsafe || false,
      force: options.force || false
    };

    // Confirm if not dry-run and not forced
    if (!rollbackOptions.dryRun && !rollbackOptions.force) {
      if (options.checkRisks) {
        logger.newLine();
        logger.info('🤖 Analyzing rollback risks with Copilot...');
        const riskAnalyzer = require('../../rollback/copilot-risk-analyzer');
        // Need to load state to analyze it
        const currentState = stateManager.load();
        if (currentState) {
          const risks = await riskAnalyzer.assessRisks(currentState, rollbackOptions);

          if (risks.highRisk && risks.highRisk.length > 0) {
            logger.newLine();
            logger.error('⚠️  HIGH RISK ACTIONS DETECTED:');
            risks.highRisk.forEach(risk => logger.warning(`   - ${risk}`));
          }

          if (risks.warnings && risks.warnings.length > 0) {
            logger.newLine();
            logger.warning('⚠️  WARNINGS:');
            risks.warnings.forEach(warn => logger.info(`   - ${warn}`));
          }

          if (risks.precautions && risks.precautions.length > 0) {
            logger.newLine();
            logger.info('💡 PRECAUTIONS:');
            risks.precautions.forEach(prec => logger.info(`   - ${prec}`));
          }
          logger.newLine();
        }
      }

      logger.warning('This will undo all Jetpack changes');

      if (!rollbackOptions.unsafe) {
        logger.info('Packages will NOT be uninstalled (add --unsafe to uninstall)');
      } else {
        logger.warning('Packages will be uninstalled (--unsafe enabled)');
      }

      logger.newLine();
      logger.info('Run with --dry-run to preview changes');
      logger.info('Press Ctrl+C to cancel, or Enter to continue...');

      // Wait for user confirmation
      await new Promise(resolve => {
        process.stdin.once('data', () => resolve());
      });
    }

    // Execute rollback
    const result = await rollbackOrchestrator.rollback(rollbackOptions);

    if (result.success) {
      logger.newLine();
      logger.success('✓ Rollback completed successfully');

      if (result.dryRun) {
        logger.info('This was a dry-run. No changes were made.');
      }
    } else {
      logger.newLine();
      logger.error('✗ Rollback completed with errors');
      process.exit(1);
    }

  } catch (error) {
    logger.error('Rollback failed:', error.message);
    process.exit(1);
  }
}

module.exports = rollback;
