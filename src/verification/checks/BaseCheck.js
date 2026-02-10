const CheckResult = require('../results/CheckResult');

/**
 * BaseCheck - Abstract base class for all verification checks
 * Provides common interface and shared functionality
 */
class BaseCheck {
  /**
   * Create a new check
   * @param {object} config - Check configuration
   */
  constructor(config) {
    if (new.target === BaseCheck) {
      throw new Error('BaseCheck is abstract and cannot be instantiated directly');
    }

    this.config = config || {};
    this.name = config.name || 'Unnamed Check';
    this.type = config.type || 'unknown';
    this.priority = config.priority || 'P2';
    this.tags = config.tags || [];
    this.timeout = config.timeout || 30000;
    this.retry = config.retry || { attempts: 0, delay: 1000, backoff: 'linear' };
  }

  /**
   * Execute the check (must be implemented by subclasses)
   * @param {object} context - Execution context
   * @returns {Promise<CheckResult>}
   * @abstract
   */
  async execute(context) {
    throw new Error('execute() must be implemented by subclass');
  }

  /**
   * Validate check configuration (should be implemented by subclasses)
   * @throws {Error} If configuration is invalid
   */
  validate() {
    if (!this.name || this.name === 'Unnamed Check') {
      throw new Error('Check name is required');
    }

    if (!['P0', 'P1', 'P2'].includes(this.priority)) {
      throw new Error(`Invalid priority: ${this.priority}. Must be P0, P1, or P2`);
    }

    if (this.timeout < 0) {
      throw new Error('Timeout must be positive');
    }
  }

  /**
   * Get check name
   * @returns {string}
   */
  getName() {
    return this.name;
  }

  /**
   * Get check type
   * @returns {string}
   */
  getType() {
    return this.type;
  }

  /**
   * Get check priority
   * @returns {string}
   */
  getPriority() {
    return this.priority;
  }

  /**
   * Get check tags
   * @returns {Array<string>}
   */
  getTags() {
    return this.tags;
  }

  /**
   * Get timeout in milliseconds
   * @returns {number}
   */
  getTimeout() {
    return this.timeout;
  }

  /**
   * Get retry configuration
   * @returns {object}
   */
  getRetry() {
    return this.retry;
  }

  /**
   * Determine if check should retry after error
   * @param {Error} error - The error that occurred
   * @returns {boolean}
   */
  shouldRetry(error) {
    // Don't retry on validation errors
    if (error.message && error.message.includes('validation')) {
      return false;
    }

    // Don't retry on timeout errors (they already took too long)
    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      return false;
    }

    // Retry on network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return true;
    }

    // Default: retry if attempts configured
    return this.retry.attempts > 0;
  }

  /**
   * Get retry delay for given attempt number
   * @param {number} attempt - Current attempt number (0-based)
   * @returns {number} Delay in milliseconds
   */
  getRetryDelay(attempt) {
    const baseDelay = this.retry.delay || 1000;

    switch (this.retry.backoff) {
      case 'exponential':
        return baseDelay * Math.pow(2, attempt);
      case 'linear':
        return baseDelay * (attempt + 1);
      case 'fixed':
      default:
        return baseDelay;
    }
  }

  /**
   * Helper to validate required config fields
   * @param {Array<string>} fields - Required field names
   * @throws {Error} If any required field is missing
   */
  validateConfig(fields) {
    for (const field of fields) {
      if (!this.config[field]) {
        throw new Error(`${this.type} check requires '${field}' in configuration`);
      }
    }
  }

  /**
   * Create a CheckResult for this check
   * @returns {CheckResult}
   */
  createResult() {
    return new CheckResult(this);
  }
}

module.exports = BaseCheck;
