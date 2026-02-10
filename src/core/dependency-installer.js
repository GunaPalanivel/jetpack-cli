const logger = require('../ui/logger');
const pm = require('./package-managers');
const { execSync } = require('child_process');

/**
 * Dependency Installer Module
 * 
 * Orchestrates installation of system, npm, and Python packages
 * with check-before-install optimization and error resilience.
 * 
 * Features:
 * - Check if packages already installed (skip redundant installs)
 * - Sequential installation: system → npm → python
 * - Continue on failure (collect all errors)
 * - Full dry-run support
 * - Detailed summary report
 */
class DependencyInstaller {
  /**
   * Install all dependencies from manifest
   * @param {object} dependencies - Manifest dependencies object
   * @param {object} environment - Detected environment
   * @param {object} options - Command options
   * @returns {Promise<object>} Installation results
   */
  async installDependencies(dependencies, environment, options = {}) {
    logger.newLine();
    logger.info('📦 Installing Dependencies...');
    logger.separator();
    
    const results = {
      system: { installed: [], skipped: [], failed: [] },
      npm: { installed: [], skipped: [], failed: [] },
      python: { installed: [], skipped: [], failed: [] }
    };
    
    const errors = [];
    
    try {
      // Phase 1: System packages
      if (dependencies.system && dependencies.system.length > 0) {
        logger.step(1, 'System Dependencies');
        const systemResults = await this.installSystemDependencies(
          dependencies.system,
          environment,
          options
        );
        Object.assign(results.system, systemResults);
      } else {
        logger.info('  → No system dependencies');
      }
      
      // Phase 2: NPM packages
      if (dependencies.npm && dependencies.npm.length > 0) {
        logger.step(2, 'NPM Packages');
        const npmResults = await this.installNpmDependencies(
          dependencies.npm,
          options
        );
        Object.assign(results.npm, npmResults);
      } else {
        logger.info('  → No npm dependencies');
      }
      
      // Phase 3: Python packages
      if (dependencies.python && dependencies.python.length > 0) {
        logger.step(3, 'Python Packages');
        const pythonResults = await this.installPythonDependencies(
          dependencies.python,
          options
        );
        Object.assign(results.python, pythonResults);
      } else {
        logger.info('  → No python dependencies');
      }
      
    } catch (error) {
      errors.push({
        phase: 'general',
        message: error.message
      });
    }
    
    // Generate summary
    logger.newLine();
    this.displaySummary(results, options);
    
    return {
      ...results,
      summary: this.calculateSummary(results),
      errors
    };
  }
  
  /**
   * Install system dependencies
   * @param {string[]} packages - System packages to install
   * @param {object} environment - Detected environment
   * @param {object} options - Command options
   * @returns {Promise<object>} Installation results
   * @private
   */
  async installSystemDependencies(packages, environment, options) {
    const results = { installed: [], skipped: [], failed: [] };
    
    // Check if system package manager is available
    const systemPM = pm.detectSystemPackageManager(environment);
    
    if (!systemPM) {
      logger.warning('  ⚠️  No system package manager detected');
      logger.info(`     Platform: ${environment.platform}`);
      logger.info('     Skipping system dependencies');
      results.failed = packages.map(pkg => ({ package: pkg, reason: 'No package manager available' }));
      return results;
    }
    
    logger.info(`  → Using: ${systemPM}`);
    logger.info(`  → Packages: ${packages.length}`);
    logger.newLine();
    
    for (const pkg of packages) {
      try {
        // Check if already installed
        const isInstalled = await pm.isPackageInstalled(pkg, 'system', environment);
        
        if (isInstalled) {
          logger.success(`  ✓ ${pkg} (already installed)`);
          results.skipped.push(pkg);
          continue;
        }
        
        // Get install command
        const cmd = pm.getSystemPackageCommand(pkg, environment);
        
        if (!cmd) {
          logger.warning(`  ⚠️  ${pkg} (no install command available)`);
          results.failed.push({ package: pkg, reason: 'No install command' });
          continue;
        }
        
        // Execute installation
        if (options.dryRun) {
          logger.info(`  [DRY-RUN] ${pkg}`);
          logger.debug(`    Command: ${cmd}`);
          results.installed.push(pkg);
        } else {
          logger.info(`  → Installing ${pkg}...`);
          const result = await pm.executeCommand(cmd, options);
          
          if (result.success) {
            logger.success(`  ✓ ${pkg} installed`);
            results.installed.push(pkg);
          } else {
            logger.warning(`  ⚠️  ${pkg} failed: ${result.error}`);
            results.failed.push({ package: pkg, reason: result.error });
          }
        }
        
      } catch (error) {
        logger.warning(`  ⚠️  ${pkg} error: ${error.message}`);
        results.failed.push({ package: pkg, reason: error.message });
      }
    }
    
    return results;
  }
  
  /**
   * Install NPM dependencies
   * @param {string[]} packages - NPM packages to install
   * @param {object} options - Command options
   * @returns {Promise<object>} Installation results
   * @private
   */
  async installNpmDependencies(packages, options) {
    const results = { installed: [], skipped: [], failed: [] };
    
    // Check if npm is available
    try {
      execSync('npm --version', { stdio: 'ignore' });
    } catch (error) {
      logger.warning('  ⚠️  npm not available');
      results.failed = packages.map(pkg => ({ package: pkg, reason: 'npm not installed' }));
      return results;
    }
    
    logger.info(`  → Packages: ${packages.length}`);
    logger.newLine();
    
    // Check which packages are already installed
    const toInstall = [];
    
    for (const pkg of packages) {
      const isInstalled = await pm.isPackageInstalled(pkg, 'npm', {});
      
      if (isInstalled) {
        logger.success(`  ✓ ${pkg} (already installed)`);
        results.skipped.push(pkg);
      } else {
        toInstall.push(pkg);
      }
    }
    
    // Install missing packages
    if (toInstall.length > 0) {
      const cmd = `npm install -g ${toInstall.join(' ')}`;
      
      if (options.dryRun) {
        logger.info(`  [DRY-RUN] Would install: ${toInstall.join(', ')}`);
        logger.debug(`    Command: ${cmd}`);
        results.installed = toInstall;
      } else {
        logger.info(`  → Installing ${toInstall.length} package(s)...`);
        logger.debug(`    ${toInstall.join(', ')}`);
        
        const result = await pm.executeCommand(cmd, options);
        
        if (result.success) {
          logger.success(`  ✓ Installed: ${toInstall.join(', ')}`);
          results.installed = toInstall;
        } else {
          logger.warning(`  ⚠️  npm install failed: ${result.error}`);
          results.failed = toInstall.map(pkg => ({ 
            package: pkg, 
            reason: result.error 
          }));
        }
      }
    }
    
    return results;
  }
  
  /**
   * Install Python dependencies
   * @param {string[]} packages - Python packages to install
   * @param {object} options - Command options
   * @returns {Promise<object>} Installation results
   * @private
   */
  async installPythonDependencies(packages, options) {
    const results = { installed: [], skipped: [], failed: [] };
    
    // Check if pip is available
    try {
      execSync('pip --version', { stdio: 'ignore' });
    } catch (error) {
      logger.warning('  ⚠️  pip not available');
      logger.info('     Install Python to use pip packages');
      results.failed = packages.map(pkg => ({ package: pkg, reason: 'pip not installed' }));
      return results;
    }
    
    logger.info(`  → Packages: ${packages.length}`);
    logger.newLine();
    
    // Check which packages are already installed
    const toInstall = [];
    
    for (const pkg of packages) {
      const isInstalled = await pm.isPackageInstalled(pkg, 'python', {});
      
      if (isInstalled) {
        logger.success(`  ✓ ${pkg} (already installed)`);
        results.skipped.push(pkg);
      } else {
        toInstall.push(pkg);
      }
    }
    
    // Install missing packages
    if (toInstall.length > 0) {
      const cmd = `pip install ${toInstall.join(' ')}`;
      
      if (options.dryRun) {
        logger.info(`  [DRY-RUN] Would install: ${toInstall.join(', ')}`);
        logger.debug(`    Command: ${cmd}`);
        results.installed = toInstall;
      } else {
        logger.info(`  → Installing ${toInstall.length} package(s)...`);
        logger.debug(`    ${toInstall.join(', ')}`);
        
        const result = await pm.executeCommand(cmd, options);
        
        if (result.success) {
          logger.success(`  ✓ Installed: ${toInstall.join(', ')}`);
          results.installed = toInstall;
        } else {
          logger.warning(`  ⚠️  pip install failed: ${result.error}`);
          results.failed = toInstall.map(pkg => ({ 
            package: pkg, 
            reason: result.error 
          }));
        }
      }
    }
    
    return results;
  }
  
  /**
   * Calculate summary statistics
   * @param {object} results - Installation results
   * @returns {object} Summary statistics
   * @private
   */
  calculateSummary(results) {
    const total = {
      installed: 0,
      skipped: 0,
      failed: 0
    };
    
    ['system', 'npm', 'python'].forEach(type => {
      total.installed += results[type].installed.length;
      total.skipped += results[type].skipped.length;
      total.failed += Array.isArray(results[type].failed) 
        ? results[type].failed.length 
        : 0;
    });
    
    return total;
  }
  
  /**
   * Display summary of installation results
   * @param {object} results - Installation results
   * @param {object} options - Command options
   * @private
   */
  displaySummary(results, options) {
    const summary = this.calculateSummary(results);
    
    logger.separator();
    logger.header('📊 Installation Summary');
    
    if (options.dryRun) {
      logger.warning('⚠️  DRY RUN - No packages were actually installed');
    }
    
    logger.newLine();
    logger.info(`✓ Installed: ${summary.installed} package(s)`);
    logger.info(`→ Skipped: ${summary.skipped} package(s) (already present)`);
    
    if (summary.failed > 0) {
      logger.warning(`⚠️  Failed: ${summary.failed} package(s)`);
      logger.newLine();
      logger.info('Failed packages:');
      
      ['system', 'npm', 'python'].forEach(type => {
        if (results[type].failed.length > 0) {
          logger.info(`  ${type}:`);
          results[type].failed.forEach(fail => {
            const pkg = typeof fail === 'object' ? fail.package : fail;
            const reason = typeof fail === 'object' ? fail.reason : 'Unknown error';
            logger.warning(`    - ${pkg}: ${reason}`);
          });
        }
      });
    }
    
    logger.newLine();
    
    if (summary.failed === 0 && summary.installed + summary.skipped > 0) {
      logger.success('✅ All dependencies ready!');
    } else if (summary.failed > 0) {
      logger.warning('⚠️  Some dependencies failed to install');
      logger.info('   You may need to install them manually');
    }
  }
}

module.exports = new DependencyInstaller();
