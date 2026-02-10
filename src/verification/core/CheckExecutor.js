/**
 * CheckExecutor - Executes individual checks with error handling and retry logic
 */
class CheckExecutor {
  constructor(options = {}) {
    this.defaultTimeout = options.defaultTimeout || 30000;
  }

  /**
   * Execute a single check
   * @param {BaseCheck} check - Check to execute
   * @param {object} context - Execution context
   * @returns {Promise<CheckResult>}
   */
  async execute(check, context = {}) {
    try {
      await this._beforeCheck(check);
      const result = await check.execute(context);
      await this._afterCheck(check, result);
      return result;
    } catch (error) {
      return this._handleError(check, error);
    }
  }

  /**
   * Execute check with timeout
   * @param {BaseCheck} check - Check to execute
   * @param {number} timeout - Timeout in milliseconds
   * @param {object} context - Execution context
   * @returns {Promise<CheckResult>}
   */
  async executeWithTimeout(check, timeout, context = {}) {
    return Promise.race([
      this.execute(check, context),
      this._createTimeoutPromise(timeout, check)
    ]);
  }

  /**
   * Execute check with retry logic
   * @param {BaseCheck} check - Check to execute
   * @param {object} context - Execution context
   * @returns {Promise<CheckResult>}
   */
  async executeWithRetry(check, context = {}) {
    const retryConfig = check.getRetry();
    const maxAttempts = (retryConfig.attempts || 0) + 1; // attempts + initial try
    
    let lastResult = null;
    let lastError = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const result = await this.execute(check, context);
        
        // If successful, return immediately
        if (result.success) {
          result.retries = attempt;
          return result;
        }

        // If failed, check if we should retry
        lastResult = result;
        lastError = result.error;

        if (attempt < maxAttempts - 1 && check.shouldRetry(lastError || new Error(result.message))) {
          const delay = check.getRetryDelay(attempt);
          await this._delay(delay);
          continue;
        }

        // No more retries or shouldn't retry
        result.retries = attempt;
        return result;

      } catch (error) {
        lastError = error;

        if (attempt < maxAttempts - 1 && check.shouldRetry(error)) {
          const delay = check.getRetryDelay(attempt);
          await this._delay(delay);
          continue;
        }

        // No more retries, return failed result
        return this._handleError(check, error, attempt);
      }
    }

    // Shouldn't reach here, but just in case
    return lastResult || this._handleError(check, lastError || new Error('Unknown error'));
  }

  /**
   * Pre-execution hook
   * @private
   */
  async _beforeCheck(check) {
    // Could add logging, metrics, etc. here
  }

  /**
   * Post-execution hook
   * @private
   */
  async _afterCheck(check, result) {
    // Could add logging, metrics, etc. here
  }

  /**
   * Handle execution error
   * @private
   */
  _handleError(check, error, retries = 0) {
    const result = check.createResult();
    result.retries = retries;
    result.markFailed(
      `Check execution failed: ${error.message}`,
      error
    );
    return result;
  }

  /**
   * Create a timeout promise
   * @private
   */
  _createTimeoutPromise(timeout, check) {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Check timed out after ${timeout}ms: ${check.getName()}`));
      }, timeout);
    });
  }

  /**
   * Delay for specified milliseconds
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get execution metrics (placeholder for future implementation)
   * @returns {object}
   */
  getMetrics() {
    return {
      executedChecks: 0,
      failedChecks: 0,
      averageDuration: 0
    };
  }
}

module.exports = CheckExecutor;
