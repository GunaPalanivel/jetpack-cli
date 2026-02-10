/**
 * ParallelExecutor - Manages concurrent check execution with concurrency control
 */
class ParallelExecutor {
  constructor(executor, options = {}) {
    this.executor = executor;
    this.defaultConcurrency = {
      P0: options.p0Concurrency || 1,  // Serial for critical checks
      P1: options.p1Concurrency || 3,  // Moderate parallelism
      P2: options.p2Concurrency || 5   // Higher parallelism
    };
    this.progress = {
      total: 0,
      completed: 0,
      running: 0,
      failed: 0
    };
  }

  /**
   * Execute checks serially (one after another)
   * Note: In lenient mode, P0 failures don't stop execution
   * @param {Array<BaseCheck>} checks - Checks to execute
   * @param {object} context - Execution context
   * @returns {Promise<Array<CheckResult>>}
   */
  async executeSerial(checks, context = {}) {
    const results = [];
    this.progress.total = checks.length;

    for (const check of checks) {
      this.progress.running = 1;
      
      const result = await this.executor.executeWithRetry(check, context);
      results.push(result);
      
      this.progress.completed++;
      this.progress.running = 0;
      
      if (!result.success) {
        this.progress.failed++;
        // In lenient mode, we log but continue
      }
    }

    return results;
  }

  /**
   * Execute checks in parallel with concurrency limit
   * @param {Array<BaseCheck>} checks - Checks to execute
   * @param {number} concurrency - Max concurrent checks
   * @param {object} context - Execution context
   * @returns {Promise<Array<CheckResult>>}
   */
  async executeParallel(checks, concurrency = 3, context = {}) {
    const queue = [...checks];
    const results = [];
    const running = new Set();

    this.progress.total = checks.length;
    this.progress.completed = 0;
    this.progress.running = 0;
    this.progress.failed = 0;

    while (queue.length > 0 || running.size > 0) {
      // Start new checks up to concurrency limit
      while (queue.length > 0 && running.size < concurrency) {
        const check = queue.shift();
        
        const promise = this.executor.executeWithRetry(check, context)
          .then(result => {
            results.push(result);
            running.delete(promise);
            this.progress.completed++;
            this.progress.running = running.size;
            
            if (!result.success) {
              this.progress.failed++;
            }
            
            return result;
          })
          .catch(error => {
            running.delete(promise);
            this.progress.completed++;
            this.progress.running = running.size;
            this.progress.failed++;
            
            // Create failed result
            const result = check.createResult();
            result.markFailed(`Unexpected error: ${error.message}`, error);
            results.push(result);
            return result;
          });

        running.add(promise);
        this.progress.running = running.size;
      }

      // Wait for at least one to complete
      if (running.size > 0) {
        await Promise.race(running);
      }
    }

    return results;
  }

  /**
   * Execute checks in batches based on priority
   * @param {Array<BaseCheck>} checks - All checks to execute
   * @param {object} context - Execution context
   * @returns {Promise<Array<CheckResult>>}
   */
  async executeBatch(checks, context = {}) {
    // Group checks by priority
    const groups = this._groupByPriority(checks);
    const allResults = [];

    // Execute P0 checks serially
    if (groups.P0.length > 0) {
      const p0Results = await this.executeSerial(groups.P0, context);
      allResults.push(...p0Results);
    }

    // Execute P1 checks in parallel
    if (groups.P1.length > 0) {
      const p1Results = await this.executeParallel(
        groups.P1,
        this.defaultConcurrency.P1,
        context
      );
      allResults.push(...p1Results);
    }

    // Execute P2 checks in parallel
    if (groups.P2.length > 0) {
      const p2Results = await this.executeParallel(
        groups.P2,
        this.defaultConcurrency.P2,
        context
      );
      allResults.push(...p2Results);
    }

    return allResults;
  }

  /**
   * Group checks by priority
   * @private
   */
  _groupByPriority(checks) {
    const groups = { P0: [], P1: [], P2: [] };

    for (const check of checks) {
      const priority = check.getPriority();
      if (groups[priority]) {
        groups[priority].push(check);
      } else {
        groups.P2.push(check); // Default to P2 if unknown
      }
    }

    return groups;
  }

  /**
   * Set concurrency limit for a priority level
   * @param {string} priority - P0, P1, or P2
   * @param {number} limit - Concurrency limit
   */
  setConcurrency(priority, limit) {
    if (this.defaultConcurrency[priority] !== undefined) {
      this.defaultConcurrency[priority] = limit;
    }
  }

  /**
   * Get current progress
   * @returns {object}
   */
  getProgress() {
    return { ...this.progress };
  }

  /**
   * Get performance metrics
   * @returns {object}
   */
  getMetrics() {
    return {
      total: this.progress.total,
      completed: this.progress.completed,
      running: this.progress.running,
      failed: this.progress.failed,
      successRate: this.progress.total > 0
        ? ((this.progress.completed - this.progress.failed) / this.progress.total) * 100
        : 0
    };
  }

  /**
   * Reset progress counters
   */
  resetProgress() {
    this.progress = {
      total: 0,
      completed: 0,
      running: 0,
      failed: 0
    };
  }
}

module.exports = ParallelExecutor;
