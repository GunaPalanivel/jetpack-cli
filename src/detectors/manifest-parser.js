const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

/**
 * Manifest Parser - Parses and validates .onboard.yaml manifests
 */

/**
 * Parse manifest file from given path
 * @param {string} filePath - Path to .onboard.yaml file
 * @returns {object} Parsed and validated manifest object
 * @throws {Error} If file not found, invalid YAML, or validation fails
 */
function parseManifest(filePath) {
  // Validate file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`Manifest file not found: ${filePath}`);
  }

  // Read file content
  let fileContent;
  try {
    fileContent = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to read manifest file: ${error.message}`);
  }

  // Check for empty file
  if (!fileContent || fileContent.trim().length === 0) {
    throw new Error('Manifest file is empty');
  }

  // Parse YAML
  let manifest;
  try {
    manifest = yaml.parse(fileContent);
  } catch (error) {
    throw new Error(`Invalid YAML syntax: ${error.message}`);
  }

  // Check if parsed content is empty
  if (!manifest || typeof manifest !== 'object') {
    throw new Error('Manifest file contains no valid data');
  }

  // Validate schema
  const validationErrors = validateManifestSchema(manifest);
  if (validationErrors.length > 0) {
    throw new Error(`Manifest validation failed:\n  - ${validationErrors.join('\n  - ')}`);
  }

  // Return structured manifest
  return {
    name: manifest.name,
    description: manifest.description || '',
    dependencies: extractDependencies(manifest),
    environment: extractEnvironment(manifest),
    setupSteps: extractSetupSteps(manifest),
    verification: manifest.verification || null,  // Phase 6: Verification checks
    ssh: manifest.ssh || null,
    git: manifest.git || null,
    documentation: manifest.documentation || null,  // Phase 7: Documentation config
    metadata: {
      parsedAt: new Date().toISOString(),
      filePath: filePath
    }
  };
}

/**
 * Validate manifest schema
 * @param {object} manifest - Parsed manifest object
 * @returns {Array<string>} Array of validation error messages (empty if valid)
 */
function validateManifestSchema(manifest) {
  const errors = [];

  // Check required fields
  if (!manifest.name || typeof manifest.name !== 'string' || manifest.name.trim().length === 0) {
    errors.push('Missing or invalid "name" field (must be non-empty string)');
  }

  // Validate dependencies structure
  if (!manifest.dependencies) {
    errors.push('Missing "dependencies" field');
  } else if (typeof manifest.dependencies !== 'object') {
    errors.push('"dependencies" must be an object');
  } else {
    // Validate dependency categories
    const validCategories = ['system', 'npm', 'python', 'environment'];
    const hasValidCategory = Object.keys(manifest.dependencies).some(key =>
      validCategories.includes(key)
    );

    if (!hasValidCategory) {
      errors.push(`"dependencies" must contain at least one of: ${validCategories.join(', ')}`);
    }

    // Validate system dependencies
    if (manifest.dependencies.system) {
      if (!Array.isArray(manifest.dependencies.system)) {
        errors.push('"dependencies.system" must be an array');
      }
    }

    // Validate npm dependencies
    if (manifest.dependencies.npm) {
      if (!Array.isArray(manifest.dependencies.npm)) {
        errors.push('"dependencies.npm" must be an array');
      }
    }

    // Validate python dependencies
    if (manifest.dependencies.python) {
      if (!Array.isArray(manifest.dependencies.python)) {
        errors.push('"dependencies.python" must be an array');
      }
    }

    // Validate environment variables structure
    if (manifest.dependencies.environment) {
      const env = manifest.dependencies.environment;

      // Allow both array format and object format
      if (Array.isArray(env)) {
        // Empty array is valid - means no environment variables needed
      } else if (typeof env === 'object') {
        // Validate required/optional structure
        if (env.required && !Array.isArray(env.required)) {
          errors.push('"dependencies.environment.required" must be an array');
        }
        if (env.optional && !Array.isArray(env.optional)) {
          errors.push('"dependencies.environment.optional" must be an array');
        }
        if (!env.required && !env.optional) {
          errors.push('"dependencies.environment" must have "required" or "optional" field');
        }
      } else {
        errors.push('"dependencies.environment" must be an array or object with required/optional fields');
      }
    }
  }

  // Validate setup_steps
  if (!manifest.setup_steps) {
    errors.push('Missing "setup_steps" field');
  } else if (!Array.isArray(manifest.setup_steps)) {
    errors.push('"setup_steps" must be an array');
  } else if (manifest.setup_steps.length === 0) {
    errors.push('"setup_steps" cannot be empty');
  } else {
    // Validate each setup step
    manifest.setup_steps.forEach((step, index) => {
      if (typeof step !== 'object') {
        errors.push(`setup_steps[${index}] must be an object`);
        return;
      }

      if (!step.name || typeof step.name !== 'string') {
        errors.push(`setup_steps[${index}].name is required and must be a string`);
      }

      if (!step.command || typeof step.command !== 'string') {
        errors.push(`setup_steps[${index}].command is required and must be a string`);
      }
    });
  }

  // Optional: ssh section validation (Phase 5 - P1)
  if (manifest.ssh && typeof manifest.ssh === 'object') {
    if (typeof manifest.ssh.generate !== 'undefined' && typeof manifest.ssh.generate !== 'boolean') {
      errors.push('ssh.generate must be a boolean');
    }
    if (manifest.ssh.comment && typeof manifest.ssh.comment !== 'string') {
      errors.push('ssh.comment must be a string');
    }
    if (manifest.ssh.algorithm && typeof manifest.ssh.algorithm !== 'string') {
      errors.push('ssh.algorithm must be a string');
    }
  }

  // Optional: git section validation (Phase 5 - P2)
  if (manifest.git && typeof manifest.git === 'object') {
    if (typeof manifest.git.configure !== 'undefined' && typeof manifest.git.configure !== 'boolean') {
      errors.push('git.configure must be a boolean');
    }
    if (manifest.git.user && typeof manifest.git.user === 'object') {
      if (manifest.git.user.name && typeof manifest.git.user.name !== 'string') {
        errors.push('git.user.name must be a string');
      }
      if (manifest.git.user.email && typeof manifest.git.user.email !== 'string') {
        errors.push('git.user.email must be a string');
      }
    }
  }

  return errors;
}

/**
 * Validate package name for security
 * Prevents command injection by allowing only safe characters
 * @param {string} packageName - Package name to validate
 * @returns {boolean} True if valid
 * @throws {Error} If package name contains unsafe characters
 */
function validatePackageName(packageName) {
  // Allow: letters, numbers, hyphens, underscores, dots, @ (for scoped packages), forward slashes
  // Disallow: shell metacharacters like ; && || | $ ` etc.
  const validPattern = /^[@a-zA-Z0-9._/-]+$/;

  if (!validPattern.test(packageName)) {
    throw new Error(
      `Invalid package name: "${packageName}". ` +
      `Package names can only contain letters, numbers, hyphens, underscores, dots, @ and /. ` +
      `Shell metacharacters are not allowed for security reasons.`
    );
  }

  return true;
}

/**
 * Extract and categorize dependencies from manifest
 * @param {object} manifest - Parsed manifest object
 * @returns {object} Categorized dependencies object
 */
function extractDependencies(manifest) {
  const dependencies = {
    system: [],
    npm: [],
    python: []
  };

  if (!manifest.dependencies) {
    return dependencies;
  }

  // Extract and validate system dependencies
  if (manifest.dependencies.system && Array.isArray(manifest.dependencies.system)) {
    dependencies.system = manifest.dependencies.system
      .filter(dep => typeof dep === 'string' && dep.trim().length > 0)
      .map(dep => {
        const trimmed = dep.trim();
        validatePackageName(trimmed);
        return trimmed;
      });
  }

  // Extract and validate npm dependencies
  if (manifest.dependencies.npm && Array.isArray(manifest.dependencies.npm)) {
    dependencies.npm = manifest.dependencies.npm
      .filter(dep => typeof dep === 'string' && dep.trim().length > 0)
      .map(dep => {
        const trimmed = dep.trim();
        validatePackageName(trimmed);
        return trimmed;
      });
  }

  // Extract and validate python dependencies
  if (manifest.dependencies.python && Array.isArray(manifest.dependencies.python)) {
    dependencies.python = manifest.dependencies.python
      .filter(dep => typeof dep === 'string' && dep.trim().length > 0)
      .map(dep => {
        const trimmed = dep.trim();
        validatePackageName(trimmed);
        return trimmed;
      });
  }

  return dependencies;
}

/**
 * Extract environment variables from manifest
 * @param {object} manifest - Parsed manifest object
 * @returns {object} Environment variables categorized as required/optional
 */
function extractEnvironment(manifest) {
  const environment = {
    required: [],
    optional: []
  };

  if ((!manifest.dependencies || !manifest.dependencies.environment) && !manifest.environment) {
    return environment;
  }

  const env = manifest.environment || manifest.dependencies.environment;

  // Environment variable name validation pattern (uppercase letters, numbers, underscores)
  const ENV_VAR_PATTERN = /^[A-Z][A-Z0-9_]*$/;

  // Validate environment variable name (security: prevent command injection in Copilot CLI)
  function isValidEnvVarName(varName) {
    if (typeof varName !== 'string' || varName.trim().length === 0) {
      return false;
    }
    return ENV_VAR_PATTERN.test(varName.trim());
  }

  // Handle array format (all are required)
  if (Array.isArray(env)) {
    environment.required = env.filter(varName => {
      if (!isValidEnvVarName(varName)) {
        console.warn(`⚠️  Invalid environment variable name ignored: ${varName} (must match [A-Z][A-Z0-9_]*)`);
        return false;
      }
      return true;
    });
  }
  // Handle object format with required/optional
  else if (typeof env === 'object') {
    if (env.required && Array.isArray(env.required)) {
      environment.required = env.required.filter(varName => {
        if (!isValidEnvVarName(varName)) {
          console.warn(`⚠️  Invalid environment variable name ignored: ${varName} (must match [A-Z][A-Z0-9_]*)`);
          return false;
        }
        return true;
      });
    }
    if (env.optional && Array.isArray(env.optional)) {
      environment.optional = env.optional.filter(varName => {
        if (!isValidEnvVarName(varName)) {
          console.warn(`⚠️  Invalid environment variable name ignored: ${varName} (must match [A-Z][A-Z0-9_]*)`);
          return false;
        }
        return true;
      });
    }
  }

  return environment;
}

/**
 * Extract setup steps from manifest
 * @param {object} manifest - Parsed manifest object
 * @returns {Array<object>} Array of setup step objects
 */
function extractSetupSteps(manifest) {
  if (!manifest.setup_steps || !Array.isArray(manifest.setup_steps)) {
    return [];
  }

  return manifest.setup_steps
    .filter(step => step && typeof step === 'object')
    .map((step, index) => ({
      id: index + 1,
      name: step.name || `Step ${index + 1}`,
      command: step.command || '',
      description: step.description || ''
    }));
}

/**
 * Parse manifest from string content (useful for testing or remote fetching)
 * @param {string} content - YAML content as string
 * @returns {object} Parsed and validated manifest object
 * @throws {Error} If invalid YAML or validation fails
 */
function parseManifestFromString(content) {
  if (!content || content.trim().length === 0) {
    throw new Error('Manifest content is empty');
  }

  let manifest;
  try {
    manifest = yaml.parse(content);
  } catch (error) {
    throw new Error(`Invalid YAML syntax: ${error.message}`);
  }

  if (!manifest || typeof manifest !== 'object') {
    throw new Error('Manifest content contains no valid data');
  }

  const validationErrors = validateManifestSchema(manifest);
  if (validationErrors.length > 0) {
    throw new Error(`Manifest validation failed:\n  - ${validationErrors.join('\n  - ')}`);
  }

  return {
    name: manifest.name,
    description: manifest.description || '',
    dependencies: extractDependencies(manifest),
    environment: extractEnvironment(manifest),
    setupSteps: extractSetupSteps(manifest),
    ssh: manifest.ssh || null,
    git: manifest.git || null,
    metadata: {
      parsedAt: new Date().toISOString(),
      source: 'string'
    }
  };
}

module.exports = {
  parseManifest,
  parseManifestFromString,
  validateManifestSchema,
  extractDependencies,
  extractEnvironment,
  extractSetupSteps
};
