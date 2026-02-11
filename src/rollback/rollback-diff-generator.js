const chalk = require('chalk');
const logger = require('../ui/logger');

/**
 * Rollback Diff Generator Module
 * 
 * Generates color-coded preview of rollback changes for dry-run mode
 */
class RollbackDiffGenerator {
  /**
   * Generate full diff preview
   * @param {object} state - Enhanced state object
   * @param {object} options - Rollback options
   * @returns {string} Formatted diff string
   */
  generateDiff(state, options = {}) {
    const lines = [];
    
    lines.push('');
    lines.push(chalk.cyan.bold('🔍 Rollback Preview (Dry Run)'));
    lines.push(chalk.gray('─'.repeat(60)));
    lines.push('');
    
    // Dependencies section
    const depsLines = this.formatPackageChanges(state, options);
    if (depsLines.length > 0) {
      lines.push(...depsLines);
      lines.push('');
    }
    
    // Config section
    const configLines = this.formatConfigChanges(state);
    if (configLines.length > 0) {
      lines.push(...configLines);
      lines.push('');
    }
    
    // SSH keys section
    const sshLines = this.formatSshKeyChanges(state);
    if (sshLines.length > 0) {
      lines.push(...sshLines);
      lines.push('');
    }
    
    // Git config section
    const gitLines = this.formatGitConfigChanges(state);
    if (gitLines.length > 0) {
      lines.push(...gitLines);
      lines.push('');
    }
    
    // Documentation section
    const docsLines = this.formatDocsChanges(state);
    if (docsLines.length > 0) {
      lines.push(...docsLines);
      lines.push('');
    }
    
    lines.push(chalk.gray('─'.repeat(60)));
    
    if (!options.unsafe) {
      lines.push(chalk.yellow('⚠  Add --unsafe to uninstall packages'));
    }
    
    lines.push(chalk.gray('Run without --dry-run to execute rollback'));
    lines.push('');
    
    return lines.join('\n');
  }
  
  /**
   * Format package changes (dependencies)
   * @param {object} state - Enhanced state object
   * @param {object} options - Rollback options
   * @returns {string[]} Formatted lines
   */
  formatPackageChanges(state, options = {}) {
    const lines = [];
    const { npm, pip, system } = state.rollback.dependencies;
    
    const hasPackages = (npm && npm.length > 0) || 
                       (pip && pip.length > 0) || 
                       (system && system.length > 0);
    
    if (!hasPackages) {
      return lines;
    }
    
    lines.push(chalk.blue.bold('📦 Dependencies'));
    
    if (!options.unsafe) {
      lines.push(chalk.yellow('  ⚠  Requires --unsafe flag (skipping)'));
      return lines;
    }
    
    // NPM packages
    if (npm && npm.length > 0) {
      for (const pkg of npm) {
        if (pkg.installed) {
          const version = pkg.version ? `@${pkg.version}` : '';
          lines.push(chalk.red(`  - Would uninstall: ${pkg.name}${version} (npm global)`));
        } else {
          lines.push(chalk.gray(`  ⊘ Would skip: ${pkg.name} (not installed by Jetpack)`));
        }
      }
    }
    
    // Pip packages
    if (pip && pip.length > 0) {
      for (const pkg of pip) {
        if (pkg.installed) {
          const version = pkg.version ? `@${pkg.version}` : '';
          lines.push(chalk.red(`  - Would uninstall: ${pkg.name}${version} (pip)`));
        } else {
          lines.push(chalk.gray(`  ⊘ Would skip: ${pkg.name} (not installed by Jetpack)`));
        }
      }
    }
    
    // System packages
    if (system && system.length > 0) {
      for (const pkg of system) {
        if (pkg.installed) {
          lines.push(chalk.red(`  - Would uninstall: ${pkg.name} (${pkg.platform})`));
        } else {
          lines.push(chalk.gray(`  ⊘ Would skip: ${pkg.name} (not installed by Jetpack)`));
        }
      }
    }
    
    return lines;
  }
  
  /**
   * Format config file changes
   * @param {object} state - Enhanced state object
   * @returns {string[]} Formatted lines
   */
  formatConfigChanges(state) {
    const lines = [];
    const { backups } = state.rollback.config;
    
    if (!backups.env && !backups.gitignore) {
      return lines;
    }
    
    lines.push(chalk.blue.bold('⚙️  Configuration'));
    
    if (backups.env) {
      lines.push(chalk.green(`  + Would restore: .env (from ${backups.env})`));
      lines.push(chalk.red(`  - Would remove: .env.template`));
      lines.push(chalk.red(`  - Would remove: .env.example`));
    }
    
    if (backups.gitignore) {
      lines.push(chalk.green(`  ~ Would restore: .gitignore`));
    }
    
    return lines;
  }
  
  /**
   * Format SSH key changes
   * @param {object} state - Enhanced state object
   * @returns {string[]} Formatted lines
   */
  formatSshKeyChanges(state) {
    const lines = [];
    const { keyPath, publicKeyPath } = state.rollback.ssh;
    
    if (!keyPath && !publicKeyPath) {
      return lines;
    }
    
    lines.push(chalk.blue.bold('🔑 SSH Keys'));
    
    if (keyPath) {
      lines.push(chalk.red(`  - Would remove: ${keyPath}`));
    }
    
    if (publicKeyPath) {
      lines.push(chalk.red(`  - Would remove: ${publicKeyPath}`));
    }
    
    return lines;
  }
  
  /**
   * Format git config changes
   * @param {object} state - Enhanced state object
   * @returns {string[]} Formatted lines
   */
  formatGitConfigChanges(state) {
    const lines = [];
    const { originalGitConfig } = state.rollback.config;
    
    if (!originalGitConfig || Object.keys(originalGitConfig).length === 0) {
      return lines;
    }
    
    lines.push(chalk.blue.bold('📝 Git Config'));
    
    for (const [key, value] of Object.entries(originalGitConfig)) {
      if (value === null || value === undefined) {
        lines.push(chalk.red(`  - Would unset: ${key}`));
      } else {
        lines.push(chalk.green(`  ~ Would restore: ${key} = "${value}"`));
      }
    }
    
    return lines;
  }
  
  /**
   * Format documentation changes
   * @param {object} state - Enhanced state object
   * @returns {string[]} Formatted lines
   */
  formatDocsChanges(state) {
    const lines = [];
    const { outputDir, filesCreated } = state.rollback.docs;
    
    if (!outputDir) {
      return lines;
    }
    
    lines.push(chalk.blue.bold('📚 Documentation'));
    lines.push(chalk.red(`  - Would remove: ${outputDir}/ (${filesCreated} files)`));
    
    return lines;
  }
}

module.exports = new RollbackDiffGenerator();
