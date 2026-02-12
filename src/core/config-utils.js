const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

/**
 * Configuration Utilities
 * 
 * Shared utilities for configuration file generation, validation, and management.
 * Used by config-generator.js for all P0/P1/P2 operations.
 */

/**
 * Merge environment variables into existing .env file
 * Preserves existing values, adds missing variables
 * @param {string} existingContent - Current .env file content
 * @param {object} newVars - Variables to add { VAR_NAME: value }
 * @returns {object} { content: string, added: [], preserved: [] }
 */
function mergeEnvFile(existingContent, newVars) {
  const lines = existingContent.split('\n');
  const existing = {};
  const added = [];
  const preserved = [];

  // Parse existing variables
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const match = trimmed.match(/^([^=]+)=/);
      if (match) {
        const varName = match[1].trim();
        existing[varName] = true;
        preserved.push(varName);
      }
    }
  });

  // Add missing variables
  let newContent = existingContent.trim();
  if (newContent && !newContent.endsWith('\n')) {
    newContent += '\n';
  }

  Object.keys(newVars).forEach(varName => {
    if (!existing[varName]) {
      const value = newVars[varName] || '';
      newContent += `\n${varName}=${value}`;
      added.push(varName);
    }
  });

  return {
    content: newContent,
    added,
    preserved
  };
}

/**
 * Validate environment variable format
 * @param {string} name - Variable name
 * @param {string} value - Variable value
 * @param {string} type - Expected type (url, email, port, boolean)
 * @returns {object} { valid: boolean, error: string }
 */
function validateEnvVar(name, value, type = 'string') {
  if (!value) {
    return { valid: true, error: null }; // Empty is valid (user will fill)
  }

  switch (type) {
    case 'url':
      const urlPattern = /^(https?|postgres|mysql|mongodb):\/\/.+/i;
      if (!urlPattern.test(value)) {
        return { valid: false, error: 'Invalid URL format' };
      }
      break;

    case 'email':
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value)) {
        return { valid: false, error: 'Invalid email format' };
      }
      break;

    case 'port':
      const port = parseInt(value);
      if (isNaN(port) || port < 1 || port > 65535) {
        return { valid: false, error: 'Port must be 1-65535' };
      }
      break;

    case 'boolean':
      const boolPattern = /^(true|false|1|0)$/i;
      if (!boolPattern.test(value)) {
        return { valid: false, error: 'Must be true/false or 1/0' };
      }
      break;
  }

  return { valid: true, error: null };
}

/**
 * Generate secure value using Copilot CLI or fallback
 * @param {string} varName - Variable name
 * @param {string} type - Type (api_key, jwt_secret, database_url, etc.)
 * @returns {Promise<string>} Generated value
 */
async function generateCopilotValue(varName, type = 'string') {
  // Try Copilot CLI first
  const copilot = require('../integrations/copilot-wrapper');

  if (copilot.isAvailable) {
    let prompt = '';

    switch (type) {
      case 'api_key':
        prompt = 'generate secure 32-character alphanumeric API key';
        break;
      case 'jwt_secret':
        prompt = 'generate secure 64-character random JWT secret key';
        break;
      case 'database_url':
        prompt = `suggest PostgreSQL connection string format for ${varName}`;
        break;
      default:
        prompt = `suggest value for environment variable ${varName}`;
    }

    const suggestion = copilot.suggest(prompt, 'shell');
    if (suggestion) return suggestion;
  }

  // Fallback: Generate using Node crypto
  switch (type) {
    case 'api_key':
      return crypto.randomBytes(16).toString('hex').toUpperCase();
    case 'jwt_secret':
      return crypto.randomBytes(32).toString('hex');
    case 'database_url':
      return `postgresql://localhost:5432/${varName.toLowerCase().replace(/_/g, '')}`;
    default:
      return '';
  }
}

/**
 * Get Copilot CLI explanation for environment variable
 * @param {string} varName - Variable name
 * @returns {Promise<string>} Explanation or default description
 */
async function getCopilotExplanation(varName) {
  const copilot = require('../integrations/copilot-wrapper');

  if (copilot.isAvailable) {
    const explanation = copilot.explain(`what is ${varName} environment variable used for`);
    if (explanation) {
      return explanation.slice(0, 120); // Limit length
    }
  }

  // Fallback descriptions
  const commonVars = {
    'DATABASE_URL': 'Database connection string',
    'API_KEY': 'API authentication key',
    'JWT_SECRET': 'Secret key for JWT token signing',
    'PORT': 'Server port number',
    'NODE_ENV': 'Node environment (development/production)',
    'DEBUG': 'Debug mode flag'
  };

  return commonVars[varName] || `Environment variable: ${varName}`;
}

/**
 * Backup file with timestamp
 * @param {string} filePath - File to backup
 * @returns {string|null} Backup file path or null if skipped
 */
function backupFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);
  const backupPath = `${filePath}.backup.${timestamp}`;

  try {
    fs.copyFileSync(filePath, backupPath);

    // Clean old backups (keep last 3)
    const dir = path.dirname(filePath);
    const filename = path.basename(filePath);
    const backupPattern = new RegExp(`^${filename}\\.backup\\.\\d+$`);

    const backups = fs.readdirSync(dir)
      .filter(f => backupPattern.test(f))
      .map(f => ({
        name: f,
        path: path.join(dir, f),
        time: fs.statSync(path.join(dir, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    // Delete old backups (keep last 3)
    backups.slice(3).forEach(backup => {
      try {
        fs.unlinkSync(backup.path);
      } catch (err) {
        // Ignore deletion errors
      }
    });

    return backupPath;
  } catch (error) {
    console.error(`Warning: Failed to backup ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Update .gitignore with entries
 * @param {string} projectRoot - Project root directory
 * @param {Array<string>} entries - Entries to add
 * @returns {object} { added: [], skipped: [] }
 */
function updateGitignore(projectRoot, entries) {
  const gitignorePath = path.join(projectRoot, '.gitignore');
  const added = [];
  const skipped = [];

  let content = '';
  let existingEntries = new Set();

  // Read existing .gitignore
  if (fs.existsSync(gitignorePath)) {
    content = fs.readFileSync(gitignorePath, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        existingEntries.add(trimmed);
      }
    });
  }

  // Add header if new file or no jetpack section
  if (!content.includes('# Jetpack CLI')) {
    content += '\n# Jetpack CLI - Auto-generated\n';
  }

  // Add missing entries
  entries.forEach(entry => {
    if (!existingEntries.has(entry)) {
      content += `${entry}\n`;
      added.push(entry);
    } else {
      skipped.push(entry);
    }
  });

  // Write updated .gitignore
  if (added.length > 0) {
    try {
      fs.writeFileSync(gitignorePath, content, 'utf8');
    } catch (error) {
      console.error('Warning: Failed to update .gitignore:', error.message);
    }
  }

  return { added, skipped };
}

/**
 * Check if command is available
 * @param {string} command - Command to check
 * @returns {boolean} True if command exists
 */
function checkCommand(command) {
  try {
    execSync(`${command} --version`, {
      stdio: 'ignore',
      timeout: 3000
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Generate SSH key pair (ed25519)
 * @param {string} keyPath - Path to private key (e.g., ~/.ssh/id_ed25519)
 * @param {string} comment - SSH key comment
 * @param {string} passphrase - Passphrase (empty for no passphrase)
 * @returns {object} { success: boolean, publicKey: string, error: string }
 */
function generateSshKey(keyPath, comment = 'jetpack-cli', passphrase = '') {
  try {
    // Check if ssh-keygen exists
    if (!checkCommand('ssh-keygen')) {
      return { success: false, publicKey: null, error: 'ssh-keygen not found' };
    }

    // Generate key with ed25519 algorithm (using array syntax to prevent command injection)
    const { execFileSync } = require('child_process');
    execFileSync('ssh-keygen', [
      '-t', 'ed25519',
      '-f', keyPath,
      '-C', comment,
      '-N', passphrase,
      '-q'
    ], { timeout: 10000 });

    // Read public key
    const publicKey = fs.readFileSync(`${keyPath}.pub`, 'utf8').trim();

    return { success: true, publicKey, error: null };
  } catch (error) {
    return { success: false, publicKey: null, error: error.message };
  }
}

/**
 * Add SSH key to ssh-agent
 * @param {string} keyPath - Path to private key
 * @returns {object} { success: boolean, error: string }
 */
function addSshKeyToAgent(keyPath) {
  try {
    // Check if ssh-add exists
    if (!checkCommand('ssh-add')) {
      return { success: false, error: 'ssh-add not found' };
    }

    // Try to add key to agent (using array syntax to prevent command injection)
    const { execFileSync } = require('child_process');
    execFileSync('ssh-add', [keyPath], { timeout: 5000 });

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get git config value
 * @param {string} key - Config key (e.g., 'user.name')
 * @param {boolean} global - Get from global config
 * @returns {string|null} Config value or null if not set
 */
function getGitConfig(key, global = true) {
  try {
    const { execFileSync } = require('child_process');
    const scope = global ? '--global' : '--local';
    const result = execFileSync('git', ['config', scope, key], {
      encoding: 'utf8',
      timeout: 3000
    });
    return result.trim();
  } catch (error) {
    return null;
  }
}

/**
 * Set git config value
 * @param {string} key - Config key (e.g., 'user.name')
 * @param {string} value - Config value
 * @param {boolean} global - Set in global config
 * @returns {object} { success: boolean, error: string }
 */
function setGitConfig(key, value, global = true) {
  try {
    // Validate key format (git config keys: section.subsection.variable, case-insensitive)
    const keyPattern = /^[a-zA-Z][a-zA-Z0-9.-]*$/;
    if (!keyPattern.test(key)) {
      return { success: false, error: `Invalid git config key: ${key}` };
    }

    const { execFileSync } = require('child_process');
    const scope = global ? '--global' : '--local';
    execFileSync('git', ['config', scope, key, value], {
      timeout: 3000
    });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  mergeEnvFile,
  validateEnvVar,
  generateCopilotValue,
  getCopilotExplanation,
  backupFile,
  updateGitignore,
  checkCommand,
  generateSshKey,
  addSshKeyToAgent,
  getGitConfig,
  setGitConfig
};
