const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const logger = require('../ui/logger');
const pm = require('../core/package-managers');

/**
 * Rollback Actions Module
 * 
 * Executes actual rollback operations:
 * - Uninstall packages (npm, pip, system)
 * - Restore config files from backups
 * - Remove SSH keys
 * - Restore git config
 * - Remove documentation
 */
class RollbackActions {
  /**
   * Rollback dependencies (packages)
   * @param {object} state - Enhanced state object
   * @param {object} options - Rollback options
   * @returns {Promise<object>} { uninstalled: [], skipped: [], failed: [] }
   */
  async rollbackDependencies(state, options = {}) {
    const results = {
      uninstalled: [],
      skipped: [],
      failed: []
    };
    
    if (!options.unsafe) {
      logger.info('  → Skipping dependencies (requires --unsafe flag)');
      return results;
    }
    
    const { npm, pip, system } = state.rollback.dependencies;
    
    // Rollback npm packages
    for (const pkg of npm || []) {
      if (!pkg.installed) {
        results.skipped.push({ name: pkg.name, reason: 'Was not installed by Jetpack' });
        continue;
      }
      
      try {
        const cmd = pm.getUninstallCommand('npm', pkg.name);
        if (cmd) {
          if (!options.dryRun) {
            execSync(cmd, { stdio: 'ignore' });
          }
          results.uninstalled.push({ name: pkg.name, type: 'npm' });
          logger.success(`    ✓ Uninstalled npm package: ${pkg.name}`);
        } else {
          results.skipped.push({ name: pkg.name, reason: 'No uninstall command' });
        }
      } catch (error) {
        results.failed.push({ name: pkg.name, type: 'npm', error: error.message });
        logger.error(`    ✗ Failed to uninstall ${pkg.name}: ${error.message}`);
      }
    }
    
    // Rollback pip packages
    for (const pkg of pip || []) {
      if (!pkg.installed) {
        results.skipped.push({ name: pkg.name, reason: 'Was not installed by Jetpack' });
        continue;
      }
      
      try {
        const cmd = pm.getUninstallCommand('pip', pkg.name);
        if (cmd) {
          if (!options.dryRun) {
            execSync(cmd, { stdio: 'ignore' });
          }
          results.uninstalled.push({ name: pkg.name, type: 'pip' });
          logger.success(`    ✓ Uninstalled pip package: ${pkg.name}`);
        } else {
          results.skipped.push({ name: pkg.name, reason: 'No uninstall command' });
        }
      } catch (error) {
        results.failed.push({ name: pkg.name, type: 'pip', error: error.message });
        logger.error(`    ✗ Failed to uninstall ${pkg.name}: ${error.message}`);
      }
    }
    
    // Rollback system packages
    for (const pkg of system || []) {
      if (!pkg.installed) {
        results.skipped.push({ name: pkg.name, reason: 'Was not installed by Jetpack' });
        continue;
      }
      
      try {
        const cmd = pm.getUninstallCommand('system', pkg.name, pkg.platform);
        if (cmd) {
          if (!options.dryRun) {
            execSync(cmd, { stdio: 'ignore' });
          }
          results.uninstalled.push({ name: pkg.name, type: 'system' });
          logger.success(`    ✓ Uninstalled system package: ${pkg.name}`);
        } else {
          results.skipped.push({ name: pkg.name, reason: 'No uninstall command' });
        }
      } catch (error) {
        results.failed.push({ name: pkg.name, type: 'system', error: error.message });
        logger.error(`    ✗ Failed to uninstall ${pkg.name}: ${error.message}`);
      }
    }
    
    return results;
  }
  
  /**
   * Rollback configuration files
   * @param {object} state - Enhanced state object
   * @param {object} options - Rollback options
   * @returns {Promise<object>} { restored: [], removed: [], skipped: [], failed: [] }
   */
  async rollbackConfigs(state, options = {}) {
    const results = {
      restored: [],
      removed: [],
      skipped: [],
      failed: []
    };
    
    const projectRoot = process.cwd();
    const { backups } = state.rollback.config;
    
    // Restore .env from backup
    if (backups.env) {
      const envPath = path.join(projectRoot, '.env');
      const backupPath = path.join(projectRoot, backups.env);
      
      try {
        if (fs.existsSync(backupPath)) {
          if (!options.dryRun) {
            fs.copyFileSync(backupPath, envPath);
          }
          results.restored.push({ file: '.env', from: backups.env });
          logger.success(`    ✓ Restored .env from backup`);
        } else {
          results.skipped.push({ file: '.env', reason: 'Backup not found' });
          logger.warning(`    ⚠ Backup not found: ${backups.env}`);
        }
      } catch (error) {
        results.failed.push({ file: '.env', error: error.message });
        logger.error(`    ✗ Failed to restore .env: ${error.message}`);
      }
    }
    
    // Remove .env.template
    const envTemplatePath = path.join(projectRoot, '.env.template');
    if (fs.existsSync(envTemplatePath)) {
      try {
        if (!options.dryRun) {
          fs.unlinkSync(envTemplatePath);
        }
        results.removed.push({ file: '.env.template' });
        logger.success(`    ✓ Removed .env.template`);
      } catch (error) {
        results.failed.push({ file: '.env.template', error: error.message });
        logger.error(`    ✗ Failed to remove .env.template: ${error.message}`);
      }
    }
    
    // Remove .env.example
    const envExamplePath = path.join(projectRoot, '.env.example');
    if (fs.existsSync(envExamplePath)) {
      try {
        if (!options.dryRun) {
          fs.unlinkSync(envExamplePath);
        }
        results.removed.push({ file: '.env.example' });
        logger.success(`    ✓ Removed .env.example`);
      } catch (error) {
        results.failed.push({ file: '.env.example', error: error.message });
        logger.error(`    ✗ Failed to remove .env.example: ${error.message}`);
      }
    }
    
    return results;
  }
  
  /**
   * Rollback SSH keys
   * @param {object} state - Enhanced state object
   * @param {object} options - Rollback options
   * @returns {Promise<object>} { removed: [], skipped: [], failed: [] }
   */
  async rollbackSshKeys(state, options = {}) {
    const results = {
      removed: [],
      skipped: [],
      failed: []
    };
    
    const { keyPath, publicKeyPath } = state.rollback.ssh;
    
    // Remove private key
    if (keyPath) {
      const expandedPath = keyPath.replace('~', os.homedir());
      
      try {
        if (fs.existsSync(expandedPath)) {
          if (!options.dryRun) {
            fs.unlinkSync(expandedPath);
          }
          results.removed.push({ file: keyPath });
          logger.success(`    ✓ Removed SSH private key: ${keyPath}`);
        } else {
          results.skipped.push({ file: keyPath, reason: 'File not found' });
        }
      } catch (error) {
        results.failed.push({ file: keyPath, error: error.message });
        logger.error(`    ✗ Failed to remove ${keyPath}: ${error.message}`);
      }
    }
    
    // Remove public key
    if (publicKeyPath) {
      const expandedPath = publicKeyPath.replace('~', os.homedir());
      
      try {
        if (fs.existsSync(expandedPath)) {
          if (!options.dryRun) {
            fs.unlinkSync(expandedPath);
          }
          results.removed.push({ file: publicKeyPath });
          logger.success(`    ✓ Removed SSH public key: ${publicKeyPath}`);
        } else {
          results.skipped.push({ file: publicKeyPath, reason: 'File not found' });
        }
      } catch (error) {
        results.failed.push({ file: publicKeyPath, error: error.message });
        logger.error(`    ✗ Failed to remove ${publicKeyPath}: ${error.message}`);
      }
    }
    
    return results;
  }
  
  /**
   * Rollback git configuration
   * @param {object} state - Enhanced state object
   * @param {object} options - Rollback options
   * @returns {Promise<object>} { restored: [], unset: [], skipped: [], failed: [] }
   */
  async rollbackGitConfig(state, options = {}) {
    const results = {
      restored: [],
      unset: [],
      skipped: [],
      failed: []
    };
    
    const { originalGitConfig } = state.rollback.config;
    
    if (!originalGitConfig || Object.keys(originalGitConfig).length === 0) {
      logger.warning('    ⚠ No original git config values to restore');
      return results;
    }
    
    for (const [key, value] of Object.entries(originalGitConfig)) {
      try {
        if (value === null || value === undefined) {
          // Config didn't exist before, unset it
          if (!options.dryRun) {
            execSync(`git config --global --unset ${key}`, { stdio: 'ignore' });
          }
          results.unset.push({ key });
          logger.success(`    ✓ Unset git config: ${key}`);
        } else {
          // Restore original value
          if (!options.dryRun) {
            execSync(`git config --global ${key} "${value}"`, { stdio: 'ignore' });
          }
          results.restored.push({ key, value });
          logger.success(`    ✓ Restored git config: ${key} = "${value}"`);
        }
      } catch (error) {
        results.failed.push({ key, error: error.message });
        logger.error(`    ✗ Failed to restore ${key}: ${error.message}`);
      }
    }
    
    return results;
  }
  
  /**
   * Rollback documentation
   * @param {object} state - Enhanced state object
   * @param {object} options - Rollback options
   * @returns {Promise<object>} { removed: [], skipped: [], failed: [] }
   */
  async rollbackDocumentation(state, options = {}) {
    const results = {
      removed: [],
      skipped: [],
      failed: []
    };
    
    const { outputDir, filesCreated } = state.rollback.docs;
    
    if (!outputDir) {
      logger.info('    → No documentation to remove');
      return results;
    }
    
    const docsPath = path.join(process.cwd(), outputDir);
    
    try {
      if (fs.existsSync(docsPath)) {
        if (!options.dryRun) {
          fs.rmSync(docsPath, { recursive: true, force: true });
        }
        results.removed.push({ directory: outputDir, filesCount: filesCreated });
        logger.success(`    ✓ Removed documentation directory: ${outputDir} (${filesCreated} files)`);
      } else {
        results.skipped.push({ directory: outputDir, reason: 'Directory not found' });
        logger.warning(`    ⚠ Documentation directory not found: ${outputDir}`);
      }
    } catch (error) {
      results.failed.push({ directory: outputDir, error: error.message });
      logger.error(`    ✗ Failed to remove ${outputDir}: ${error.message}`);
    }
    
    return results;
  }
}

module.exports = new RollbackActions();
