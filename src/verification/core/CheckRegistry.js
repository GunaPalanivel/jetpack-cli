/**
 * CheckRegistry - Registry for check type strategies (Factory Pattern)
 */
class CheckRegistry {
  constructor() {
    this.checkTypes = new Map();
    this.registerBuiltInTypes();
  }

  /**
   * Register built-in check types
   * @private
   */
  registerBuiltInTypes() {
    const CommandCheck = require('../checks/CommandCheck');
    const HttpCheck = require('../checks/HttpCheck');
    const PortCheck = require('../checks/PortCheck');
    const FileCheck = require('../checks/FileCheck');

    this.register('command', CommandCheck);
    this.register('http', HttpCheck);
    this.register('port', PortCheck);
    this.register('file', FileCheck);
  }

  /**
   * Register a check type
   * @param {string} type - Check type identifier
   * @param {class} checkClass - Check class constructor
   */
  register(type, checkClass) {
    if (!type || typeof type !== 'string') {
      throw new Error('Check type must be a non-empty string');
    }

    if (typeof checkClass !== 'function') {
      throw new Error('Check class must be a constructor function');
    }

    this.checkTypes.set(type.toLowerCase(), checkClass);
  }

  /**
   * Register multiple check types at once
   * @param {object} checkMap - Map of type -> checkClass
   */
  registerBulk(checkMap) {
    for (const [type, checkClass] of Object.entries(checkMap)) {
      this.register(type, checkClass);
    }
  }

  /**
   * Create a check instance from configuration
   * @param {string} type - Check type
   * @param {object} config - Check configuration
   * @returns {BaseCheck} Check instance
   */
  createCheck(type, config) {
    if (!this.hasCheckType(type)) {
      throw new Error(`Unknown check type: ${type}. Available types: ${this.listAvailableTypes().join(', ')}`);
    }

    const CheckClass = this.checkTypes.get(type.toLowerCase());
    const check = new CheckClass(config);

    // Validate the check configuration
    check.validate();

    return check;
  }

  /**
   * Check if a type is registered
   * @param {string} type - Check type
   * @returns {boolean}
   */
  hasCheckType(type) {
    return this.checkTypes.has(type.toLowerCase());
  }

  /**
   * List all available check types
   * @returns {Array<string>}
   */
  listAvailableTypes() {
    return Array.from(this.checkTypes.keys());
  }

  /**
   * Get metadata about a check type
   * @param {string} type - Check type
   * @returns {object|null}
   */
  getCheckMetadata(type) {
    if (!this.hasCheckType(type)) {
      return null;
    }

    const CheckClass = this.checkTypes.get(type.toLowerCase());
    
    return {
      type,
      name: CheckClass.name,
      description: CheckClass.description || 'No description available'
    };
  }

  /**
   * Unregister a check type (useful for testing)
   * @param {string} type - Check type
   */
  unregister(type) {
    this.checkTypes.delete(type.toLowerCase());
  }

  /**
   * Clear all registered types (useful for testing)
   */
  clear() {
    this.checkTypes.clear();
  }
}

module.exports = CheckRegistry;
