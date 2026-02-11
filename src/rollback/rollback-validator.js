const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const logger = require('../ui/logger');

/**
 * Rollback Validator Module
 * 
 * Performs safety checks before rollback:
 * - Validates backups exist
 * - Checks package dependents
 * - Validates SSH keys and git config
 */
class RollbackValidator {
  /**
   * Run all safety validations
   * @param {object} state - Enhanced state object
   * @param {object} options - Rollback options
   * @returns {object} Validation results { safe: boolean, warnings: [], errors: [] }
   */
  async validate(state, options = {}) {
    const warnings = [];
    const errors = [];
    
    if (!state || !state.rollback) {
      errors.push('Invalid state - cannot perform safety checks');
      return { safe: false, warnings, errors };
    }
    
    // Check backups exist
    const backupCheck = this.validateBackupsExist(state);
    warnings.push(...backupCheck.warnings);
    errors.push(...backupCheck.errors);
    
    // Check package dependents (if dependencies being rolled back)
    if (options.unsafe || options.components?.includes('npmPackages') || 
        options.components?.includes('pythonPackages')) {
      const dependentCheck = await this.checkPackageDependents(state);
      warnings.push(...dependentCheck.warnings);
    }
    
    // Validate SSH keys
    const sshCheck = this.validateSshKeyBeforeDelete(state);
    warnings.push(...sshCheck.warnings);
    
    // Validate git config
    const gitCheck = this.validateGitConfigBeforeRestore(state);
    warnings.push(...gitCheck.warnings);
    
    return {
      safe: errors.length === 0,
      warnings,
      errors
    };
  }
  
  /**
   * Check if backup files exist
   * @param {object} state - Enhanced state object
   * @returns {object} { warnings: [], errors: [] }
   */
  validateBackupsExist(state) {
    const warnings = [];
    const errors = [];
    
    const { backups } = state.rollback.config;
    
    if (backups.env) {
      const envBackupPath = path.join(process.cwd(), backups.env);
      if (!fs.existsSync(envBackupPath)) {
        warnings.push(`Environment backup not found: ${backups.env}`);
      }
    }
    
    if (backups.gitignore) {
      const gitignoreBackupPath = path.join(process.cwd(), backups.gitignore);
      if (!fs.existsSync(gitignoreBackupPath)) {
        warnings.push(`Gitignore backup not found: ${backups.gitignore}`);
      }
    }
    
    return { warnings, errors };
  }
  
  /**
   * Check if npm/pip packages have dependents
   * @param {object} state - Enhanced state object
   * @returns {Promise<object>} { warnings: [] }
   */
  async checkPackageDependents(state) {
    const warnings = [];
    
    // Check npm dependents
    const npmPackages = state.rollback.dependencies.npm || [];
    for (const pkg of npmPackages) {
      if (pkg.installed) {
        const dependents = await this.checkNpmDependents(pkg.name);
        if (dependents.length > 0) {
          warnings.push(
            `Package ${pkg.name} has ${dependents.length} dependent(s): ${dependents.slice(0, 3).join(', ')}${dependents.length > 3 ? '...' : ''}`
          );
        }
      }
    }
    
    // Check pip dependents
    const pipPackages = state.rollback.dependencies.pip || [];
    for (const pkg of pipPackages) {
      if (pkg.installed) {
        const dependents = await this.checkPipDependents(pkg.name);
        if (dependents.length > 0) {
          warnings.push(
            `Package ${pkg.name} has ${dependents.length} dependent(s): ${dependents.slice(0, 3).join(', ')}${dependents.length > 3 ? '...' : ''}`
          );
        }
      }
    }
    
    return { warnings };
  }
  
  /**
   * Check npm package dependents
   * @param {string} packageName - NPM package name
   * @returns {Promise<string[]>} Array of dependent package names
   */
  async checkNpmDependents(packageName) {
    try {
      const output = execSync(`npm ls -g --depth=0`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore']
      });
      
      const lines = output.split('\n');
      const dependents = [];
      
      for (const line of lines) {
        if (line.includes(packageName) && !line.startsWith(`├─`) && !line.startsWith(`└─`)) {
          const match = line.match(/[├└]──\s+([^@]+)@/);
          if (match && match[1] !== packageName) {
            dependents.push(match[1]);
          }
        }
      }
      
      return dependents;
    } catch (error) {
      return [];
    }
  }
  
  /**
   * Check pip package dependents
   * @param {string} packageName - pip package name
   * @returns {Promise<string[]>} Array of dependent package names
   */
  async checkPipDependents(packageName) {
    try {
      const output = execSync(`pip show ${packageName}`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore']
      });
      
      const lines = output.split('\n');
      const requiredByLine = lines.find(l => l.startsWith('Required-by:'));
      
      if (requiredByLine) {
        const dependents = requiredByLine
          .replace('Required-by:', '')
          .trim()
          .split(',')
          .map(d => d.trim())
          .filter(d => d && d !== '');
        
        return dependents;
      }
      
      return [];
    } catch (error) {
      return [];
    }
  }
  
  /**
   * Validate SSH key before deletion
   * @param {object} state - Enhanced state object
   * @returns {object} { warnings: [] }
   */
  validateSshKeyBeforeDelete(state) {
    const warnings = [];
    
    const { keyPath, publicKeyPath } = state.rollback.ssh;
    
    if (keyPath) {
      const expandedPath = keyPath.replace('~', os.homedir());
      if (!fs.existsSync(expandedPath)) {
        warnings.push(`SSH key not found: ${keyPath} (may have been manually deleted)`);
      }
    }
    
    if (publicKeyPath) {
      const expandedPath = publicKeyPath.replace('~', os.homedir());
      if (!fs.existsSync(expandedPath)) {
        warnings.push(`SSH public key not found: ${publicKeyPath} (may have been manually deleted)`);
      }
    }
    
    return { warnings };
  }
  
  /**
   * Validate git config before restore
   * @param {object} state - Enhanced state object
   * @returns {object} { warnings: [] }
   */
  validateGitConfigBeforeRestore(state) {
    const warnings = [];
    
    const { originalGitConfig } = state.rollback.config;
    
    if (!originalGitConfig || Object.keys(originalGitConfig).length === 0) {
      warnings.push('No original git config values found to restore');
    }
    
    return { warnings };
  }
}

module.exports = new RollbackValidator();
