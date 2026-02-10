const BaseCheck = require('./BaseCheck');
const NetworkUtils = require('../utils/NetworkUtils');

/**
 * PortCheck - Validates TCP port connectivity
 */
class PortCheck extends BaseCheck {
  constructor(config) {
    super({ ...config, type: 'port' });
    this.host = config.host || 'localhost';
    this.port = config.port;
    this.protocol = config.protocol || 'tcp';
  }

  /**
   * Validate configuration
   */
  validate() {
    super.validate();
    this.validateConfig(['port']);

    if (!NetworkUtils.isValidPort(this.port)) {
      throw new Error(`Invalid port number: ${this.port}. Must be between 1 and 65535`);
    }

    if (this.protocol !== 'tcp') {
      throw new Error(`Unsupported protocol: ${this.protocol}. Only 'tcp' is currently supported`);
    }

    if (!this.host || typeof this.host !== 'string') {
      throw new Error('host must be a non-empty string');
    }
  }

  /**
   * Execute the port check
   * @param {object} context - Execution context
   * @returns {Promise<CheckResult>}
   */
  async execute(context = {}) {
    const result = this.createResult();
    result.markRunning();

    try {
      // Test port connectivity
      const isOpen = await NetworkUtils.testPort(this.host, this.port, this.timeout);

      result.actualValue = {
        host: this.host,
        port: this.port,
        isOpen
      };

      if (isOpen) {
        result.markPassed(
          `Port ${this.port} on ${this.host} is accessible`,
          {
            host: this.host,
            port: this.port,
            protocol: this.protocol,
            status: 'open'
          }
        );
      } else {
        result.markFailed(
          `Port ${this.port} on ${this.host} is not accessible`,
          new Error('Port connection failed')
        );
        result.output = {
          host: this.host,
          port: this.port,
          status: 'closed'
        };
      }

    } catch (error) {
      result.markFailed(
        `Port check failed: ${error.message}`,
        error
      );
    }

    return result;
  }
}

module.exports = PortCheck;
