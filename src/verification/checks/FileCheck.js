const BaseCheck = require('./BaseCheck');
const fs = require('fs').promises;
const path = require('path');

/**
 * FileCheck - Validates file existence and content
 */
class FileCheck extends BaseCheck {
  constructor(config) {
    super({ ...config, type: 'file' });
    this.path = config.path;
    this.exists = config.exists !== undefined ? config.exists : true;
    this.contains = config.contains || [];
    this.notContains = config.notContains || [];
    this.permissions = config.permissions || null;
    this.size = config.size || null; // { min, max } in bytes
  }

  /**
   * Validate configuration
   */
  validate() {
    super.validate();
    this.validateConfig(['path']);

    if (typeof this.path !== 'string' || !this.path.trim()) {
      throw new Error('path must be a non-empty string');
    }

    if (!Array.isArray(this.contains)) {
      throw new Error('contains must be an array');
    }

    if (!Array.isArray(this.notContains)) {
      throw new Error('notContains must be an array');
    }
  }

  /**
   * Execute the file check
   * @param {object} context - Execution context
   * @returns {Promise<CheckResult>}
   */
  async execute(context = {}) {
    const result = this.createResult();
    result.markRunning();

    try {
      const resolvedPath = path.isAbsolute(this.path) 
        ? this.path 
        : path.join(context.cwd || process.cwd(), this.path);

      // Check file existence
      let fileExists = false;
      let stats = null;

      try {
        stats = await fs.stat(resolvedPath);
        fileExists = true;
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error; // Re-throw if it's not a "file not found" error
        }
      }

      // If we expect file to not exist
      if (!this.exists) {
        if (!fileExists) {
          result.markPassed(
            `File ${this.path} does not exist as expected`,
            { exists: false, path: resolvedPath }
          );
        } else {
          result.markFailed(
            `File ${this.path} exists but was expected not to`,
            new Error('File should not exist')
          );
        }
        return result;
      }

      // If we expect file to exist but it doesn't
      if (!fileExists) {
        result.markFailed(
          `File ${this.path} does not exist`,
          new Error('File not found')
        );
        result.actualValue = { exists: false };
        return result;
      }

      // File exists, perform additional checks
      const checks = [];
      const fileInfo = {
        exists: true,
        path: resolvedPath,
        size: stats.size
      };

      // Check file size if specified
      if (this.size) {
        if (this.size.min !== undefined && stats.size < this.size.min) {
          result.markFailed(
            `File size ${stats.size} bytes is less than minimum ${this.size.min} bytes`,
            new Error('File too small')
          );
          result.output = fileInfo;
          return result;
        }

        if (this.size.max !== undefined && stats.size > this.size.max) {
          result.markFailed(
            `File size ${stats.size} bytes exceeds maximum ${this.size.max} bytes`,
            new Error('File too large')
          );
          result.output = fileInfo;
          return result;
        }

        checks.push(`size: ${stats.size} bytes`);
      }

      // Check permissions (Unix-like systems only)
      if (this.permissions && process.platform !== 'win32') {
        const mode = (stats.mode & parseInt('777', 8)).toString(8);
        if (mode !== this.permissions) {
          result.markFailed(
            `File permissions ${mode} do not match expected ${this.permissions}`,
            new Error('Permission mismatch')
          );
          result.expectedValue = { permissions: this.permissions };
          result.actualValue = { permissions: mode };
          result.output = fileInfo;
          return result;
        }
        checks.push(`permissions: ${mode}`);
      }

      // Check content if contains/notContains specified
      if (this.contains.length > 0 || this.notContains.length > 0) {
        const content = await fs.readFile(resolvedPath, 'utf8');
        fileInfo.contentLength = content.length;

        // Check required content
        for (const searchStr of this.contains) {
          if (!content.includes(searchStr)) {
            result.markFailed(
              `File does not contain required text: "${searchStr}"`,
              new Error('Required content missing')
            );
            result.expectedValue = { contains: this.contains };
            result.output = fileInfo;
            return result;
          }
        }

        // Check prohibited content
        for (const searchStr of this.notContains) {
          if (content.includes(searchStr)) {
            result.markFailed(
              `File contains prohibited text: "${searchStr}"`,
              new Error('Prohibited content found')
            );
            result.expectedValue = { notContains: this.notContains };
            result.output = fileInfo;
            return result;
          }
        }

        if (this.contains.length > 0) {
          checks.push(`contains: ${this.contains.length} pattern(s)`);
        }
        if (this.notContains.length > 0) {
          checks.push(`excludes: ${this.notContains.length} pattern(s)`);
        }
      }

      // All checks passed
      const checksStr = checks.length > 0 ? ` (${checks.join(', ')})` : '';
      result.markPassed(
        `File ${this.path} validated successfully${checksStr}`,
        fileInfo
      );

    } catch (error) {
      result.markFailed(
        `File check failed: ${error.message}`,
        error
      );
    }

    return result;
  }
}

module.exports = FileCheck;
