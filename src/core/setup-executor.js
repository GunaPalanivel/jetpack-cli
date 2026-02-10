const logger = require('../ui/logger');
const { execSync } = require('child_process');

/**
 * Setup Step Executor Module
 * 
 * Executes setup_steps from .onboard.yaml manifests sequentially.
 * Each step runs a shell command with live output display.
 * 
 * Features:
 * - Sequential execution (one step at a time)
 * - Stop-on-failure error handling
 * - Live output display (stdio: inherit)
 * - Dry-run support with command preview
 * - Detailed summary report
 * - Current directory execution
 * - Full environment variable inheritance
 */
class SetupStepExecutor {
  /**
   * Execute all setup steps from manifest
   * @param {Array} steps - Array of setup step objects from manifest
   * @param {object} options - Command options
   * @returns {Promise<object>} Execution results
   */
  async executeSteps(steps, options = {}) {
    logger.newLine();
    logger.info('⚙️  Executing Setup Steps...');
    logger.separator();
    
    // Validate input
    if (!steps || !Array.isArray(steps)) {
      logger.warning('No setup steps to execute');
      return { 
        success: true, 
        executed: 0, 
        skipped: 0,
        failed: 0 
      };
    }
    
    if (steps.length === 0) {
      logger.info('  → No setup steps defined');
      return { 
        success: true, 
        executed: 0, 
        skipped: 0,
        failed: 0 
      };
    }
    
    const results = {
      executed: [],
      failed: null,
      totalSteps: steps.length,
      startTime: Date.now()
    };
    
    try {
      // Execute each step sequentially
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const stepNumber = i + 1;
        
        // Validate step before execution
        const validationError = this.validateStep(step, stepNumber);
        if (validationError) {
          throw new Error(validationError);
        }
        
        logger.newLine();
        logger.step(stepNumber, step.name || `Step ${stepNumber}`);
        
        if (step.description) {
          logger.info(`  → ${step.description}`);
        }
        
        // Execute the step
        const result = this.runStep(step, stepNumber, options);
        results.executed.push(result);
        
        // Stop on failure
        if (!result.success) {
          results.failed = {
            step: stepNumber,
            name: step.name,
            command: step.command,
            error: result.error
          };
          throw new Error(`Setup step failed: ${step.name || `Step ${stepNumber}`}`);
        }
      }
      
      // All steps completed successfully
      results.endTime = Date.now();
      this.displaySummary(results, options);
      
      return {
        success: true,
        executed: results.executed.length,
        skipped: 0,
        failed: 0,
        duration: results.endTime - results.startTime
      };
      
    } catch (error) {
      results.endTime = Date.now();
      this.displaySummary(results, options);
      
      return {
        success: false,
        executed: results.executed.length,
        skipped: results.totalSteps - results.executed.length,
        failed: 1,
        duration: results.endTime - results.startTime,
        error: error.message,
        failedStep: results.failed
      };
    }
  }
  
  /**
   * Execute a single setup step
   * @private
   * @param {object} step - Step object with name, command, description
   * @param {number} stepNumber - Step number (1-indexed)
   * @param {object} options - Command options
   * @returns {object} Step execution result
   */
  runStep(step, stepNumber, options = {}) {
    const { dryRun } = options;
    
    // Dry-run mode: show command but don't execute
    if (dryRun) {
      logger.info(`  [DRY RUN] Would execute: ${step.command}`);
      if (step.description) {
        logger.info(`  Description: ${step.description}`);
      }
      logger.info('  Working directory: ' + process.cwd());
      logger.success('  ✓ Skipped (dry-run mode)');
      
      return {
        success: true,
        skipped: true,
        step: stepNumber,
        name: step.name,
        command: step.command
      };
    }
    
    // Execute the command with live output
    try {
      logger.info(`  Executing: ${step.command}`);
      logger.newLine();
      
      execSync(step.command, {
        stdio: 'inherit',  // Show live output
        cwd: process.cwd(),  // Current directory
        env: process.env,  // Inherit all environment variables
        encoding: 'utf-8'
      });
      
      logger.newLine();
      logger.success(`  ✓ Completed: ${step.name || `Step ${stepNumber}`}`);
      
      return {
        success: true,
        step: stepNumber,
        name: step.name,
        command: step.command
      };
      
    } catch (error) {
      logger.newLine();
      logger.error(`  ✗ Failed: ${step.name || `Step ${stepNumber}`}`);
      logger.error(`  Error: ${error.message}`);
      
      return {
        success: false,
        step: stepNumber,
        name: step.name,
        command: step.command,
        error: error.message,
        exitCode: error.status
      };
    }
  }
  
  /**
   * Validate a setup step before execution
   * @private
   * @param {object} step - Step object to validate
   * @param {number} stepNumber - Step number for error messages
   * @returns {string|null} Error message if invalid, null if valid
   */
  validateStep(step, stepNumber) {
    if (!step) {
      return `Step ${stepNumber} is undefined`;
    }
    
    if (typeof step !== 'object') {
      return `Step ${stepNumber} must be an object, got ${typeof step}`;
    }
    
    // Command is required
    if (!step.command) {
      return `Step ${stepNumber} missing required field: command`;
    }
    
    if (typeof step.command !== 'string') {
      return `Step ${stepNumber} command must be a string, got ${typeof step.command}`;
    }
    
    if (step.command.trim().length === 0) {
      return `Step ${stepNumber} command cannot be empty`;
    }
    
    // Name is optional but must be string if provided
    if (step.name && typeof step.name !== 'string') {
      return `Step ${stepNumber} name must be a string, got ${typeof step.name}`;
    }
    
    // Description is optional but must be string if provided
    if (step.description && typeof step.description !== 'string') {
      return `Step ${stepNumber} description must be a string, got ${typeof step.description}`;
    }
    
    return null;  // Valid
  }
  
  /**
   * @private
   * Display summary of setup step execution results
   * @param {object} results - Execution results object
   * @param {object} options - Command options
   */
  displaySummary(results, options = {}) {
    logger.newLine();
    logger.separator();
    
    const executedCount = results.executed.length;
    const totalCount = results.totalSteps;
    const duration = results.endTime - results.startTime;
    
    if (results.failed) {
      // Failure summary
      logger.error('❌ Setup Steps Failed');
      logger.newLine();
      logger.info(`Executed: ${executedCount}/${totalCount} steps`);
      logger.info(`Failed at: Step ${results.failed.step} (${results.failed.name})`);
      logger.info(`Command: ${results.failed.command}`);
      logger.info(`Error: ${results.failed.error}`);
      logger.info(`Duration: ${(duration / 1000).toFixed(2)}s`);
      
      const skippedCount = totalCount - executedCount;
      if (skippedCount > 0) {
        logger.warning(`Skipped: ${skippedCount} remaining steps`);
      }
      
    } else {
      // Success summary
      logger.success('✅ Setup Steps Complete');
      logger.newLine();
      
      if (options.dryRun) {
        logger.info(`Would execute: ${executedCount} steps`);
        logger.info('(dry-run mode - no commands executed)');
      } else {
        logger.info(`Executed: ${executedCount}/${totalCount} steps`);
        logger.info(`Duration: ${(duration / 1000).toFixed(2)}s`);
      }
    }
    
    logger.separator();
  }
}

module.exports = new SetupStepExecutor();
