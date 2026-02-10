const BaseCheck = require('./BaseCheck');
const NetworkUtils = require('../utils/NetworkUtils');

/**
 * HttpCheck - Validates HTTP endpoint availability and responses
 */
class HttpCheck extends BaseCheck {
  constructor(config) {
    super({ ...config, type: 'http' });
    this.url = config.url;
    this.method = config.method || 'GET';
    this.expectedStatus = config.expectedStatus || 200;
    this.expectedBody = config.expectedBody || null;
    this.headers = config.headers || {};
    this.body = config.body || null;
  }

  /**
   * Validate configuration
   */
  validate() {
    super.validate();
    this.validateConfig(['url']);

    const parsedUrl = NetworkUtils.parseUrl(this.url);
    if (!parsedUrl) {
      throw new Error(`Invalid URL: ${this.url}`);
    }

    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
    if (!validMethods.includes(this.method.toUpperCase())) {
      throw new Error(`Invalid HTTP method: ${this.method}`);
    }
  }

  /**
   * Execute the HTTP check
   * @param {object} context - Execution context
   * @returns {Promise<CheckResult>}
   */
  async execute(context = {}) {
    const result = this.createResult();
    result.markRunning();

    try {
      // Make HTTP request
      const response = await NetworkUtils.httpRequest(this.url, {
        method: this.method,
        headers: this.headers,
        body: this.body,
        timeout: this.timeout
      });

      result.actualValue = {
        status: response.status,
        body: response.body
      };

      // Check status code
      if (response.status !== this.expectedStatus) {
        result.markFailed(
          `HTTP request returned status ${response.status}, expected ${this.expectedStatus}`,
          new Error('Status code mismatch')
        );
        result.expectedValue = { status: this.expectedStatus };
        result.output = {
          status: response.status,
          statusText: response.statusText,
          body: response.body
        };
        return result;
      }

      // Check response body if expected
      if (this.expectedBody !== null) {
        const bodyMatch = this.checkBodyMatch(response.body, this.expectedBody);
        
        if (!bodyMatch.matches) {
          result.markFailed(
            `Response body did not match expected: ${bodyMatch.reason}`,
            new Error('Body mismatch')
          );
          result.expectedValue = this.expectedBody;
          result.output = {
            status: response.status,
            body: response.body
          };
          return result;
        }
      }

      // Success!
      result.markPassed(
        `HTTP ${this.method} ${this.url} returned ${response.status} as expected`,
        {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          body: response.body
        }
      );

    } catch (error) {
      result.markFailed(
        `HTTP request failed: ${error.message}`,
        error
      );
    }

    return result;
  }

  /**
   * Check if response body matches expected body
   * @private
   */
  checkBodyMatch(actualBody, expectedBody) {
    // If expected is a string, do string comparison
    if (typeof expectedBody === 'string') {
      const matches = actualBody === expectedBody || 
                      (typeof actualBody === 'string' && actualBody.includes(expectedBody));
      return {
        matches,
        reason: matches ? null : 'String content mismatch'
      };
    }

    // If expected is an object, do deep comparison
    if (typeof expectedBody === 'object' && expectedBody !== null) {
      try {
        const actualObj = typeof actualBody === 'string' ? JSON.parse(actualBody) : actualBody;
        const matches = this.deepMatch(actualObj, expectedBody);
        return {
          matches,
          reason: matches ? null : 'Object structure mismatch'
        };
      } catch (error) {
        return {
          matches: false,
          reason: 'Failed to parse response as JSON'
        };
      }
    }

    return { matches: false, reason: 'Unsupported expected body type' };
  }

  /**
   * Deep match objects (checks if expected properties exist in actual)
   * @private
   */
  deepMatch(actual, expected) {
    if (typeof expected !== 'object' || expected === null) {
      return actual === expected;
    }

    for (const key in expected) {
      if (!(key in actual)) {
        return false;
      }
      if (!this.deepMatch(actual[key], expected[key])) {
        return false;
      }
    }

    return true;
  }
}

module.exports = HttpCheck;
