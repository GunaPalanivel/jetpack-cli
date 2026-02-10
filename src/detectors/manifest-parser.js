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
      } else if (manifest.dependencies.system.length === 0) {
        errors.push('"dependencies.system" cannot be empty');
      }
    }

    // Validate npm dependencies
    if (manifest.dependencies.npm) {
      if (!Array.isArray(manifest.dependencies.npm)) {
        errors.push('"dependencies.npm" must be an array');
      } else if (manifest.dependencies.npm.length === 0) {
        errors.push('"dependencies.npm" cannot be empty');
      }
    }

    // Validate python dependencies
    if (manifest.dependencies.python) {
      if (!Array.isArray(manifest.dependencies.python)) {
        errors.push('"dependencies.python" must be an array');
      } else if (manifest.dependencies.python.length === 0) {
        errors.push('"dependencies.python" cannot be empty');
      }
    }

    // Validate environment variables structure
    if (manifest.dependencies.environment) {
      const env = manifest.dependencies.environment;
      
      // Allow both array format and object format
      if (Array.isArray(env)) {
        if (env.length === 0) {
          errors.push('"dependencies.environment" cannot be empty');
        }
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

  return errors;
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

  // Extract system dependencies
  if (manifest.dependencies.system && Array.isArray(manifest.dependencies.system)) {
    dependencies.system = manifest.dependencies.system.filter(dep => 
      typeof dep === 'string' && dep.trim().length > 0
    );
  }

  // Extract npm dependencies
  if (manifest.dependencies.npm && Array.isArray(manifest.dependencies.npm)) {
    dependencies.npm = manifest.dependencies.npm.filter(dep => 
      typeof dep === 'string' && dep.trim().length > 0
    );
  }

  // Extract python dependencies
  if (manifest.dependencies.python && Array.isArray(manifest.dependencies.python)) {
    dependencies.python = manifest.dependencies.python.filter(dep => 
      typeof dep === 'string' && dep.trim().length > 0
    );
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

  if (!manifest.dependencies || !manifest.dependencies.environment) {
    return environment;
  }

  const env = manifest.dependencies.environment;

  // Handle array format (all are required)
  if (Array.isArray(env)) {
    environment.required = env.filter(varName => 
      typeof varName === 'string' && varName.trim().length > 0
    );
  }
  // Handle object format with required/optional
  else if (typeof env === 'object') {
    if (env.required && Array.isArray(env.required)) {
      environment.required = env.required.filter(varName => 
        typeof varName === 'string' && varName.trim().length > 0
      );
    }
    if (env.optional && Array.isArray(env.optional)) {
      environment.optional = env.optional.filter(varName => 
        typeof varName === 'string' && varName.trim().length > 0
      );
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
