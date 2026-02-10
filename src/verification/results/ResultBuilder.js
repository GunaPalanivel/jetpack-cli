const VerificationResult = require('./VerificationResult');

/**
 * ResultBuilder - Fluent API for constructing verification results
 */
class ResultBuilder {
  constructor() {
    this.result = new VerificationResult();
  }

  /**
   * Add a check result
   * @param {CheckResult} checkResult 
   * @returns {ResultBuilder}
   */
  withCheck(checkResult) {
    this.result.addCheck(checkResult);
    return this;
  }

  /**
   * Add an error
   * @param {string|Error} error 
   * @returns {ResultBuilder}
   */
  withError(error) {
    this.result.addError(error);
    return this;
  }

  /**
   * Add a warning
   * @param {string} warning 
   * @returns {ResultBuilder}
   */
  withWarning(warning) {
    this.result.addWarning(warning);
    return this;
  }

  /**
   * Set metadata
   * @param {string} key 
   * @param {*} value 
   * @returns {ResultBuilder}
   */
  withMetadata(key, value) {
    this.result.setMetadata(key, value);
    return this;
  }

  /**
   * Set duration
   * @param {number} duration - Duration in milliseconds
   * @returns {ResultBuilder}
   */
  withDuration(duration) {
    this.result.duration = duration;
    return this;
  }

  /**
   * Build and return the final result
   * @returns {VerificationResult}
   */
  build() {
    this.result.calculateSummary();
    return this.result;
  }

  /**
   * Static factory for successful verification
   * @param {Array<CheckResult>} checks 
   * @returns {VerificationResult}
   */
  static forSuccess(checks) {
    const builder = new ResultBuilder();
    checks.forEach(check => builder.withCheck(check));
    return builder.build();
  }

  /**
   * Static factory for failed verification
   * @param {Array<CheckResult>} checks 
   * @param {Array<string|Error>} errors 
   * @returns {VerificationResult}
   */
  static forFailure(checks, errors = []) {
    const builder = new ResultBuilder();
    checks.forEach(check => builder.withCheck(check));
    errors.forEach(error => builder.withError(error));
    return builder.build();
  }

  /**
   * Static factory for partial success (with warnings)
   * @param {Array<CheckResult>} checks 
   * @param {Array<string>} warnings 
   * @returns {VerificationResult}
   */
  static forPartial(checks, warnings = []) {
    const builder = new ResultBuilder();
    checks.forEach(check => builder.withCheck(check));
    warnings.forEach(warning => builder.withWarning(warning));
    return builder.build();
  }
}

module.exports = ResultBuilder;
