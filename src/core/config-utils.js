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
  try {
    const isCopilotAvailable = checkCommand('gh');
    if (isCopilotAvailable) {
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
      
      const result = execSync(`gh copilot suggest -t shell "${prompt}"`, {
        encoding: 'utf8',
        timeout: 5000,
        stdio: ['pipe', 'pipe', 'ignore']
      });
      
      // Parse Copilot response (basic extraction)
      const lines = result.split('\n');
      for (const line of lines) {
        if (line.trim() && !line.includes('Suggestion:')) {
          return line.trim();
        }
      }
    }
  } catch (error) {
    // Copilot unavailable or failed, use fallback
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
  try {
    const isCopilotAvailable = checkCommand('gh');
    if (isCopilotAvailable) {
      const result = execSync(
        `gh copilot explain "what is ${varName} environment variable used for"`,
        {
          encoding: 'utf8',
          timeout: 5000,
          stdio: ['pipe', 'pipe', 'ignore']
        }
      );
      
      // Extract explanation (basic parsing)
      const lines = result.split('\n').filter(l => l.trim() && !l.includes('Explanation:'));
      if (lines.length > 0) {
        return lines.join(' ').slice(0, 120); // Limit to 120 chars
      }
    }
  } catch (error) {
    // Copilot unavailable, use fallback
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

module.exports = {
  mergeEnvFile,
  validateEnvVar,
  generateCopilotValue,
  getCopilotExplanation,
  backupFile,
  updateGitignore,
  checkCommand
};
