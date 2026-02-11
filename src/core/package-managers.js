const { execSync } = require('child_process');
const logger = require('../ui/logger');

/**
 * Package Managers Utility Module
 * 
 * Provides utilities for detecting, validating, and executing
 * package manager commands across different platforms.
 * 
 * Supports: npm, pip, choco, scoop, winget, brew, apt, yum
 */

/**
 * Check if a package is already installed
 * @param {string} packageName - Package name to check
 * @param {string} type - Package type ('system', 'npm', 'python')
 * @param {object} environment - Detected environment object
 * @returns {Promise<boolean>} True if package is installed
 */
async function isPackageInstalled(packageName, type, environment) {
  try {
    let checkCmd;
    
    switch (type) {
      case 'system':
        checkCmd = getSystemCheckCommand(packageName, environment);
        break;
      case 'npm':
        checkCmd = `npm list -g ${packageName}`;
        break;
      case 'python':
        checkCmd = process.platform === 'win32' 
          ? `pip list | findstr /i "^${packageName} "`
          : `pip list | grep -i "^${packageName} "`;
        break;
      default:
        return false;
    }
    
    if (!checkCmd) {
      return false;
    }
    
    execSync(checkCmd, { 
      stdio: 'ignore',
      encoding: 'utf8'
    });
    
    return true;
  } catch (error) {
    // Command failed = package not installed
    return false;
  }
}

/**
 * Get system package check command based on platform
 * @param {string} packageName - Package name
 * @param {object} environment - Detected environment
 * @returns {string|null} Check command or null
 * @private
 */
function getSystemCheckCommand(packageName, environment) {
  const { platform, packageManagers } = environment;
  
  if (platform === 'win32') {
    if (packageManagers.chocolatey) {
      return `choco list --local-only --exact ${packageName}`;
    }
    if (packageManagers.scoop) {
      return `scoop list ${packageName}`;
    }
    if (packageManagers.winget) {
      return `winget list --exact ${packageName}`;
    }
  } else if (platform === 'darwin') {
    if (packageManagers.homebrew) {
      return `brew list ${packageName}`;
    }
  } else if (platform === 'linux') {
    if (packageManagers.apt) {
      return `dpkg -l ${packageName}`;
    }
    if (packageManagers.yum) {
      return `rpm -q ${packageName}`;
    }
  }
  
  return null;
}

/**
 * Get system package install command
 * @param {string} packageName - Package name to install
 * @param {object} environment - Detected environment
 * @returns {string|null} Install command or null
 */
function getSystemPackageCommand(packageName, environment) {
  const { platform, packageManagers } = environment;
  
  if (platform === 'win32') {
    if (packageManagers.chocolatey) {
      return `choco install ${packageName} -y`;
    }
    if (packageManagers.scoop) {
      return `scoop install ${packageName}`;
    }
    if (packageManagers.winget) {
      return `winget install --id ${packageName} --silent --accept-source-agreements --accept-package-agreements`;
    }
  } else if (platform === 'darwin') {
    if (packageManagers.homebrew) {
      return `brew install ${packageName}`;
    }
  } else if (platform === 'linux') {
    if (packageManagers.apt) {
      return `sudo apt-get install -y ${packageName}`;
    }
    if (packageManagers.yum) {
      return `sudo yum install -y ${packageName}`;
    }
  }
  
  return null;
}

/**
 * Get the best available system package manager for the platform
 * @param {object} environment - Detected environment
 * @returns {string|null} Package manager name or null
 */
function detectSystemPackageManager(environment) {
  const { platform, packageManagers } = environment;
  
  if (platform === 'win32') {
    if (packageManagers.chocolatey) return 'chocolatey';
    if (packageManagers.scoop) return 'scoop';
    if (packageManagers.winget) return 'winget';
  } else if (platform === 'darwin') {
    if (packageManagers.homebrew) return 'homebrew';
  } else if (platform === 'linux') {
    if (packageManagers.apt) return 'apt';
    if (packageManagers.yum) return 'yum';
  }
  
  return null;
}

/**
 * Execute a package manager command with error handling
 * @param {string} command - Command to execute
 * @param {object} options - Execution options
 * @returns {Promise<object>} Result { success, output, error }
 */
async function executeCommand(command, options = {}) {
  const { dryRun = false, verbose = false } = options;
  
  try {
    if (dryRun) {
      logger.debug(`[DRY-RUN] Would execute: ${command}`);
      return { success: true, output: '', dryRun: true };
    }
    
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: verbose || process.env.DEBUG ? 'inherit' : 'pipe'
    });
    
    return { success: true, output: output.trim() };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      exitCode: error.status,
      command
    };
  }
}

/**
 * Validate package manager availability
 * @param {string} manager - Package manager name
 * @param {object} environment - Detected environment
 * @returns {boolean} True if available
 */
function isPackageManagerAvailable(manager, environment) {
  const { packageManagers } = environment;
  
  switch (manager) {
    case 'chocolatey':
      return !!packageManagers.chocolatey;
    case 'scoop':
      return !!packageManagers.scoop;
    case 'winget':
      return !!packageManagers.winget;
    case 'homebrew':
      return !!packageManagers.homebrew;
    case 'apt':
      return !!packageManagers.apt;
    case 'yum':
      return !!packageManagers.yum;
    case 'npm':
      return !!packageManagers.npm;
    case 'pip':
      // Check if pip is available by trying to run it
      try {
        execSync('pip --version', { stdio: 'ignore' });
        return true;
      } catch {
        return false;
      }
    default:
      return false;
  }
}

/**
 * Parse package name from various formats
 * Handles: package@version, package>=version, package==version
 * @param {string} packageString - Package string
 * @returns {object} { name, version, operator }
 */
function parsePackageName(packageString) {
  // For now, return the full string as name
  // Future enhancement: parse version specifiers
  return {
    name: packageString.split(/[@>=<]/)[0],
    fullName: packageString,
    version: null,
    operator: null
  };
}

/**
 * Get uninstall command for a package
 * @param {string} type - Package type ('npm', 'pip', 'system')
 * @param {string} packageName - Package name
 * @param {string} platform - Platform for system packages (win32, darwin, linux)
 * @returns {string|null} Uninstall command or null
 */
function getUninstallCommand(type, packageName, platform = process.platform) {
  switch (type) {
    case 'npm':
      return `npm uninstall -g ${packageName}`;
      
    case 'pip':
      return `pip uninstall -y ${packageName}`;
      
    case 'system':
      if (platform === 'win32') {
        return `choco uninstall ${packageName} -y`;
      } else if (platform === 'darwin') {
        return `brew uninstall ${packageName}`;
      } else if (platform === 'linux') {
        // Try to detect which package manager to use
        try {
          execSync('which apt-get', { stdio: 'ignore' });
          return `sudo apt-get remove -y ${packageName}`;
        } catch {
          try {
            execSync('which yum', { stdio: 'ignore' });
            return `sudo yum remove -y ${packageName}`;
          } catch {
            return null;
          }
        }
      }
      return null;
      
    default:
      return null;
  }
}

module.exports = {
  isPackageInstalled,
  getSystemPackageCommand,
  detectSystemPackageManager,
  executeCommand,
  isPackageManagerAvailable,
  parsePackageName,
  getUninstallCommand
};
