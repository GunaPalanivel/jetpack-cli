const CheckRegistry = require('./CheckRegistry');
const CheckExecutor = require('./CheckExecutor');
const ParallelExecutor = require('./ParallelExecutor');
const ResultBuilder = require('../results/ResultBuilder');
const os = require('os');

/**
 * VerificationOrchestrator - Main coordinator for verification workflow
 */
class VerificationOrchestrator {
  constructor() {
    this.registry = new CheckRegistry();
    this.executor = new CheckExecutor();
    this.parallelExecutor = new ParallelExecutor(this.executor);
    this.resultBuilder = new ResultBuilder();
  }

  /**
   * Verify setup based on manifest configuration
   * @param {object} verificationConfig - Verification section from manifest
   * @param {object} options - Execution options
   * @returns {Promise<VerificationResult>}
   */
  async verifySetup(verificationConfig, options = {}) {
    const startTime = Date.now();
    const builder = new ResultBuilder();

    // Add metadata
    builder
      .withMetadata('environment', options.environment || 'unknown')
      .withMetadata('host', os.hostname())
      .withMetadata('platform', os.platform())
      .withMetadata('timestamp', new Date().toISOString());

    try {
      // Parse and create checks from configuration
      const checks = this._createChecksFromConfig(verificationConfig);

      if (checks.length === 0) {
        builder.withWarning('No verification checks defined');
        const result = builder.withDuration(Date.now() - startTime).build();
        return result;
      }

      // Apply filters (priority, tags)
      const filteredChecks = this._applyFilters(checks, options);

      if (filteredChecks.length === 0) {
        builder.withWarning('All checks filtered out');
        const result = builder.withDuration(Date.now() - startTime).build();
        return result;
      }

      // Determine execution strategy
      const executionStrategy = this._determineExecutionStrategy(verificationConfig);

      // Execute checks
      let checkResults;
      if (executionStrategy === 'serial') {
        checkResults = await this.parallelExecutor.executeSerial(filteredChecks, {
          cwd: options.cwd || process.cwd(),
          verbose: options.verbose || false
        });
      } else {
        checkResults = await this.parallelExecutor.executeBatch(filteredChecks, {
          cwd: options.cwd || process.cwd(),
          verbose: options.verbose || false
        });
      }

      // Build result
      checkResults.forEach(checkResult => builder.withCheck(checkResult));

      // Add warnings for failures
      const failedChecks = checkResults.filter(r => !r.success);
      if (failedChecks.length > 0) {
        const criticalFailed = failedChecks.filter(r => r.priority === 'P0');
        if (criticalFailed.length > 0) {
          builder.withWarning(`${criticalFailed.length} critical (P0) check(s) failed`);
        }
      }

    } catch (error) {
      builder.withError(error);
    }

    const result = builder.withDuration(Date.now() - startTime).build();
    return result;
  }

  /**
   * Verify only checks with specific priority
   * @param {object} verificationConfig - Verification configuration
   * @param {string} priority - P0, P1, or P2
   * @param {object} options - Execution options
   * @returns {Promise<VerificationResult>}
   */
  async verifyByPriority(verificationConfig, priority, options = {}) {
    return this.verifySetup(verificationConfig, {
      ...options,
      priority
    });
  }

  /**
   * Verify specific checks by name
   * @param {object} verificationConfig - Verification configuration
   * @param {Array<string>} checkNames - Check names to run
   * @param {object} options - Execution options
   * @returns {Promise<VerificationResult>}
   */
  async verifySpecificChecks(verificationConfig, checkNames, options = {}) {
    return this.verifySetup(verificationConfig, {
      ...options,
      checkNames
    });
  }

  /**
   * Create check instances from configuration
   * @private
   */
  _createChecksFromConfig(config) {
    const checks = [];

    if (!config || !config.checks || !Array.isArray(config.checks)) {
      return checks;
    }

    for (const checkConfig of config.checks) {
      try {
        const check = this.registry.createCheck(checkConfig.type, checkConfig);
        checks.push(check);
      } catch (error) {
        // Log error but continue with other checks
        console.error(`Failed to create check: ${error.message}`);
      }
    }

    return checks;
  }

  /**
   * Apply filters to checks
   * @private
   */
  _applyFilters(checks, options) {
    let filtered = [...checks];

    // Filter by priority
    if (options.priority) {
      filtered = filtered.filter(check => check.getPriority() === options.priority);
    }

    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      const tagsArray = Array.isArray(options.tags) ? options.tags : [options.tags];
      filtered = filtered.filter(check => {
        const checkTags = check.getTags();
        return tagsArray.some(tag => checkTags.includes(tag));
      });
    }

    // Filter by specific check names
    if (options.checkNames && options.checkNames.length > 0) {
      const namesArray = Array.isArray(options.checkNames) ? options.checkNames : [options.checkNames];
      filtered = filtered.filter(check => namesArray.includes(check.getName()));
    }

    return filtered;
  }

  /**
   * Determine execution strategy based on configuration
   * @private
   */
  _determineExecutionStrategy(config) {
    // Check if settings specify serial execution
    if (config.settings && config.settings.serial === true) {
      return 'serial';
    }

    // Default to batch execution (priority-based)
    return 'batch';
  }

  /**
   * Categorize checks by priority
   * @private
   */
  _categorizeChecks(checks) {
    return {
      P0: checks.filter(c => c.getPriority() === 'P0'),
      P1: checks.filter(c => c.getPriority() === 'P1'),
      P2: checks.filter(c => c.getPriority() === 'P2')
    };
  }
}

module.exports = VerificationOrchestrator;
