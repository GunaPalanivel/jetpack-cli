/**
 * VerificationResult - Aggregate result of all verification checks
 */
class VerificationResult {
  constructor() {
    this.success = false;
    this.timestamp = new Date();
    this.duration = 0;
    this.checks = [];
    this.summary = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      byPriority: {
        P0: { passed: 0, failed: 0, skipped: 0 },
        P1: { passed: 0, failed: 0, skipped: 0 },
        P2: { passed: 0, failed: 0, skipped: 0 }
      }
    };
    this.errors = [];
    this.warnings = [];
    this.metadata = {};
  }

  /**
   * Calculate pass rate percentage
   * @returns {number}
   */
  get passRate() {
    return this.summary.total > 0 
      ? (this.summary.passed / this.summary.total) * 100 
      : 0;
  }

  /**
   * Check if there are any P0 failures
   * @returns {boolean}
   */
  get hasCriticalFailures() {
    return this.summary.byPriority.P0.failed > 0;
  }

  /**
   * Add a check result
   * @param {CheckResult} checkResult 
   */
  addCheck(checkResult) {
    this.checks.push(checkResult);
    this.calculateSummary();
  }

  /**
   * Calculate summary statistics
   */
  calculateSummary() {
    this.summary.total = this.checks.length;
    this.summary.passed = 0;
    this.summary.failed = 0;
    this.summary.skipped = 0;

    // Reset priority counters
    ['P0', 'P1', 'P2'].forEach(priority => {
      this.summary.byPriority[priority] = { passed: 0, failed: 0, skipped: 0 };
    });

    // Count by status and priority
    this.checks.forEach(check => {
      const priority = check.priority || 'P2';
      
      if (check.status === 'passed') {
        this.summary.passed++;
        this.summary.byPriority[priority].passed++;
      } else if (check.status === 'failed') {
        this.summary.failed++;
        this.summary.byPriority[priority].failed++;
      } else if (check.status === 'skipped') {
        this.summary.skipped++;
        this.summary.byPriority[priority].skipped++;
      }
    });

    // Overall success if no failures (skipped checks don't count as failures)
    this.success = this.summary.failed === 0 && this.summary.total > 0;
  }

  /**
   * Add an error
   * @param {string|Error} error 
   */
  addError(error) {
    this.errors.push(typeof error === 'string' ? error : error.message);
  }

  /**
   * Add a warning
   * @param {string} warning 
   */
  addWarning(warning) {
    this.warnings.push(warning);
  }

  /**
   * Set metadata value
   * @param {string} key 
   * @param {*} value 
   */
  setMetadata(key, value) {
    this.metadata[key] = value;
  }

  /**
   * Convert to plain JSON object
   * @returns {object}
   */
  toJSON() {
    return {
      success: this.success,
      timestamp: this.timestamp,
      duration: this.duration,
      summary: this.summary,
      passRate: this.passRate,
      hasCriticalFailures: this.hasCriticalFailures,
      checks: this.checks.map(c => c.toJSON()),
      errors: this.errors,
      warnings: this.warnings,
      metadata: this.metadata
    };
  }

  /**
   * Convert to string representation
   * @returns {string}
   */
  toString() {
    return `Verification ${this.success ? 'PASSED' : 'FAILED'}: ${this.summary.passed}/${this.summary.total} checks passed (${this.passRate.toFixed(1)}%)`;
  }
}

module.exports = VerificationResult;
