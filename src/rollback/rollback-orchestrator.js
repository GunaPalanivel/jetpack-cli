const logger = require('../ui/logger');
const stateManager = require('../core/state-manager');
const rollbackState = require('./rollback-state');
const rollbackValidator = require('./rollback-validator');
const rollbackActions = require('./rollback-actions');
const rollbackDiffGenerator = require('./rollback-diff-generator');
const rollbackSummary = require('./rollback-summary');

/**
 * Rollback Orchestrator Module
 * 
 * Main controller for rollback operations.
 * Coordinates validation, execution, and reporting.
 */
class RollbackOrchestrator {
  /**
   * Execute rollback
   * @param {object} options - Rollback options
   * @returns {Promise<object>} Rollback results
   */
  async rollback(options = {}) {
    const startTime = Date.now();
    
    logger.newLine();
    logger.info('🔄 Jetpack Rollback');
    logger.separator();
    
    // Step 1: Load and validate state
    logger.step(1, 'Loading State');
    const { state, validation } = rollbackState.loadAndValidate();
    
    if (!validation.valid) {
      logger.error('State validation failed:');
      validation.errors.forEach(err => logger.error(`  • ${err}`));
      return { success: false, errors: validation.errors };
    }
    
    logger.success('  ✓ State loaded and validated');
    
    // Step 2: Parse options
    const phases = options.partial ? 
      rollbackState.parsePartialPhases(options.partial) : 
      null;
    
    const components = rollbackState.getPhaseComponents(phases);
    
    logger.info(`  → Rollback scope: ${phases ? phases.join(', ') : 'full'}`);
    logger.info(`  → Unsafe mode: ${options.unsafe ? 'enabled' : 'disabled'}`);
    
    // Step 3: Run safety validator
    logger.newLine();
    logger.step(2, 'Safety Validation');
    
    const validationResults = await rollbackValidator.validate(state, { 
      unsafe: options.unsafe,
      components 
    });
    
    if (validationResults.errors.length > 0) {
      logger.error('Safety validation failed:');
      validationResults.errors.forEach(err => logger.error(`  • ${err}`));
      
      if (!options.force) {
        return { success: false, errors: validationResults.errors };
      }
      
      logger.warning('  ⚠ Continuing due to --force flag');
    } else {
      logger.success('  ✓ Safety checks passed');
    }
    
    if (validationResults.warnings.length > 0) {
      logger.warning('  Warnings:');
      validationResults.warnings.forEach(warn => logger.warning(`  • ${warn}`));
    }
    
    // Step 4: Generate dry-run preview (if requested)
    if (options.dryRun) {
      logger.newLine();
      const diff = rollbackDiffGenerator.generateDiff(state, options);
      console.log(diff);
      return { success: true, dryRun: true };
    }
    
    // Step 5: Execute rollback phases
    logger.newLine();
    logger.step(3, 'Executing Rollback');
    
    const results = {};
    
    try {
      // Phase 1: Documentation (always safe)
      if (!phases || phases.includes('docs')) {
        logger.info('  Phase 1: Documentation');
        results.docs = await rollbackActions.rollbackDocumentation(state, options);
      }
      
      // Phase 2: Git config
      if (!phases || phases.includes('git')) {
        logger.info('  Phase 2: Git Configuration');
        results.git = await rollbackActions.rollbackGitConfig(state, options);
      }
      
      // Phase 3: SSH keys
      if (!phases || phases.includes('ssh')) {
        logger.info('  Phase 3: SSH Keys');
        results.ssh = await rollbackActions.rollbackSshKeys(state, options);
      }
      
      // Phase 4: Config files
      if (!phases || phases.includes('config')) {
        logger.info('  Phase 4: Configuration Files');
        results.config = await rollbackActions.rollbackConfigs(state, options);
      }
      
      // Phase 5: Dependencies (requires --unsafe)
      if (!phases || phases.includes('dependencies')) {
        logger.info('  Phase 5: Dependencies');
        results.dependencies = await rollbackActions.rollbackDependencies(state, options);
      }
      
    } catch (error) {
      logger.error(`Rollback error: ${error.message}`);
      results.error = error.message;
    }
    
    // Step 6: Clear state file (if full rollback successful)
    const shouldClearState = !phases && // Full rollback
                             !results.error && // No errors
                             this.isSuccessful(results); // All operations succeeded
    
    if (shouldClearState) {
      logger.newLine();
      logger.step(4, 'Clearing State');
      stateManager.clear();
      logger.success('  ✓ State file cleared');
    }
    
    // Step 7: Generate summary
    const endTime = Date.now();
    results.timeTaken = ((endTime - startTime) / 1000).toFixed(2);
    
    logger.newLine();
    const summary = rollbackSummary.generateSummary(results, options);
    console.log(summary);
    
    return {
      success: this.isSuccessful(results),
      results,
      timeTaken: results.timeTaken
    };
  }
  
  /**
   * Check if rollback was successful
   * @param {object} results - Rollback results
   * @returns {boolean}
   */
  isSuccessful(results) {
    if (results.error) {
      return false;
    }
    
    // Check for failures in any phase
    for (const phase of Object.values(results)) {
      if (phase && phase.failed && phase.failed.length > 0) {
        return false;
      }
    }
    
    return true;
  }
}

module.exports = new RollbackOrchestrator();
