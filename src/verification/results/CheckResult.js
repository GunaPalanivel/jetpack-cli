/**
 * CheckResult - Represents the result of an individual verification check
 */
class CheckResult {
  /**
   * Create a new check result
   * @param {object} check - The check instance that produced this result
   */
  constructor(check) {
    this.name = check.getName();
    this.type = check.getType();
    this.priority = check.getPriority();
    this.tags = check.getTags();
    
    this.success = false;
    this.status = 'pending';  // pending|running|passed|failed|skipped
    this.message = '';
    this.error = null;
    
    this.startTime = null;
    this.endTime = null;
    this.duration = 0;
    
    this.output = null;       // Check-specific output
    this.metadata = {};       // Additional data
    
    this.retries = 0;
    this.expectedValue = null;
    this.actualValue = null;
  }

  /**
   * Mark check as running
   */
  markRunning() {
    this.status = 'running';
    this.startTime = new Date();
  }

  /**
   * Mark check as passed
   * @param {string} message - Success message
   * @param {*} output - Optional output data
   */
  markPassed(message, output = null) {
    this.status = 'passed';
    this.success = true;
    this.message = message;
    this.output = output;
    this.endTime = new Date();
    this.duration = this.endTime - this.startTime;
  }

  /**
   * Mark check as failed
   * @param {string} message - Failure message
   * @param {Error} error - Optional error object
   */
  markFailed(message, error = null) {
    this.status = 'failed';
    this.success = false;
    this.message = message;
    this.error = error ? {
      message: error.message,
      stack: error.stack,
      code: error.code
    } : null;
    this.endTime = new Date();
    this.duration = this.endTime - this.startTime;
  }

  /**
   * Mark check as skipped
   * @param {string} reason - Reason for skipping
   */
  markSkipped(reason) {
    this.status = 'skipped';
    this.message = reason;
    this.endTime = new Date();
    this.duration = 0;
  }

  /**
   * Get duration in milliseconds
   * @returns {number}
   */
  getDuration() {
    return this.duration;
  }

  /**
   * Convert to plain JSON object
   * @returns {object}
   */
  toJSON() {
    return {
      name: this.name,
      type: this.type,
      priority: this.priority,
      tags: this.tags,
      success: this.success,
      status: this.status,
      message: this.message,
      error: this.error,
      duration: this.duration,
      output: this.output,
      metadata: this.metadata,
      retries: this.retries,
      expectedValue: this.expectedValue,
      actualValue: this.actualValue
    };
  }

  /**
   * Convert to string representation
   * @returns {string}
   */
  toString() {
    const statusIcon = this.success ? '✓' : '✗';
    return `[${this.priority}] ${statusIcon} ${this.name} - ${this.message}`;
  }
}

module.exports = CheckResult;
