const chalk = require('chalk');
const logger = require('../ui/logger');

/**
 * Rollback Summary Module
 * 
 * Generates formatted summary reports of rollback results
 */
class RollbackSummary {
  /**
   * Generate complete rollback summary
   * @param {object} results - Rollback results from all phases
   * @param {object} options - Rollback options
   * @returns {string} Formatted summary string
   */
  generateSummary(results, options = {}) {
    const lines = [];
    
    lines.push('');
    lines.push(chalk.cyan.bold('📋 Rollback Summary'));
    lines.push(chalk.gray('─'.repeat(60)));
    lines.push('');
    
    // Calculate totals
    const totals = this.calculateTotals(results);
    
    // Overall status
    if (totals.failed === 0) {
      lines.push(chalk.green.bold(`✓ Rollback completed successfully`));
    } else {
      lines.push(chalk.yellow.bold(`⚠ Rollback completed with ${totals.failed} failure(s)`));
    }
    
    lines.push('');
    lines.push(this.formatResultsTable(totals));
    lines.push('');
    
    // Detailed sections
    if (results.dependencies && this.hasResults(results.dependencies)) {
      lines.push(...this.formatDependenciesResults(results.dependencies));
      lines.push('');
    }
    
    if (results.config && this.hasResults(results.config)) {
      lines.push(...this.formatConfigResults(results.config));
      lines.push('');
    }
    
    if (results.ssh && this.hasResults(results.ssh)) {
      lines.push(...this.formatSshResults(results.ssh));
      lines.push('');
    }
    
    if (results.git && this.hasResults(results.git)) {
      lines.push(...this.formatGitResults(results.git));
      lines.push('');
    }
    
    if (results.docs && this.hasResults(results.docs)) {
      lines.push(...this.formatDocsResults(results.docs));
      lines.push('');
    }
    
    // Manual cleanup notes
    const manualSteps = this.getManualCleanupSteps(results);
    if (manualSteps.length > 0) {
      lines.push(chalk.yellow.bold('⚠  Manual Cleanup Required:'));
      manualSteps.forEach(step => {
        lines.push(chalk.yellow(`  • ${step}`));
      });
      lines.push('');
    }
    
    // Time taken
    if (results.timeTaken) {
      lines.push(chalk.gray(`⏱  Time taken: ${results.timeTaken}s`));
      lines.push('');
    }
    
    return lines.join('\n');
  }
  
  /**
   * Calculate totals across all results
   * @param {object} results - All rollback results
   * @returns {object} Totals object
   */
  calculateTotals(results) {
    const totals = {
      removed: 0,
      restored: 0,
      skipped: 0,
      failed: 0
    };
    
    // Sum up from all phases
    for (const phase of Object.values(results)) {
      if (typeof phase !== 'object') continue;
      
      totals.removed += (phase.uninstalled?.length || 0) + (phase.removed?.length || 0);
      totals.restored += (phase.restored?.length || 0) + (phase.unset?.length || 0);
      totals.skipped += (phase.skipped?.length || 0);
      totals.failed += (phase.failed?.length || 0);
    }
    
    return totals;
  }
  
  /**
   * Format results table
   * @param {object} totals - Totals object
   * @returns {string} Formatted table
   */
  formatResultsTable(totals) {
    const lines = [];
    
    lines.push('  Phase             Removed  Restored  Skipped  Failed');
    lines.push('  ' + chalk.gray('─'.repeat(56)));
    
    const row = `  ${chalk.cyan('Total')}             ${this.pad(totals.removed, 7)}  ${this.pad(totals.restored, 8)}  ${this.pad(totals.skipped, 7)}  ${this.pad(totals.failed, 6)}`;
    lines.push(row);
    
    return lines.join('\n');
  }
  
  /**
   * Format dependencies results
   * @param {object} deps - Dependencies results
   * @returns {string[]} Formatted lines
   */
  formatDependenciesResults(deps) {
    const lines = [];
    
    lines.push(chalk.blue.bold('📦 Dependencies:'));
    
    if (deps.uninstalled && deps.uninstalled.length > 0) {
      lines.push(chalk.green(`  ✓ Uninstalled ${deps.uninstalled.length} package(s):`));
      deps.uninstalled.slice(0, 10).forEach(pkg => {
        lines.push(chalk.green(`    • ${pkg.name} (${pkg.type})`));
      });
      if (deps.uninstalled.length > 10) {
        lines.push(chalk.gray(`    ... and ${deps.uninstalled.length - 10} more`));
      }
    }
    
    if (deps.skipped && deps.skipped.length > 0) {
      lines.push(chalk.yellow(`  ⊘ Skipped ${deps.skipped.length} package(s):`));
      deps.skipped.slice(0, 5).forEach(pkg => {
        lines.push(chalk.yellow(`    • ${pkg.name} (${pkg.reason})`));
      });
      if (deps.skipped.length > 5) {
        lines.push(chalk.gray(`    ... and ${deps.skipped.length - 5} more`));
      }
    }
    
    if (deps.failed && deps.failed.length > 0) {
      lines.push(chalk.red(`  ✗ Failed ${deps.failed.length} package(s):`));
      deps.failed.forEach(pkg => {
        lines.push(chalk.red(`    • ${pkg.name}: ${pkg.error}`));
      });
    }
    
    return lines;
  }
  
  /**
   * Format config results
   * @param {object} config - Config results
   * @returns {string[]} Formatted lines
   */
  formatConfigResults(config) {
    const lines = [];
    
    lines.push(chalk.blue.bold('⚙️  Configuration:'));
    
    if (config.restored && config.restored.length > 0) {
      config.restored.forEach(item => {
        lines.push(chalk.green(`  ✓ Restored: ${item.file} (from ${item.from})`));
      });
    }
    
    if (config.removed && config.removed.length > 0) {
      config.removed.forEach(item => {
        lines.push(chalk.green(`  ✓ Removed: ${item.file}`));
      });
    }
    
    if (config.failed && config.failed.length > 0) {
      config.failed.forEach(item => {
        lines.push(chalk.red(`  ✗ Failed: ${item.file} - ${item.error}`));
      });
    }
    
    return lines;
  }
  
  /**
   * Format SSH results
   * @param {object} ssh - SSH results
   * @returns {string[]} Formatted lines
   */
  formatSshResults(ssh) {
    const lines = [];
    
    lines.push(chalk.blue.bold('🔑 SSH Keys:'));
    
    if (ssh.removed && ssh.removed.length > 0) {
      ssh.removed.forEach(item => {
        lines.push(chalk.green(`  ✓ Removed: ${item.file}`));
      });
    }
    
    if (ssh.skipped && ssh.skipped.length > 0) {
      ssh.skipped.forEach(item => {
        lines.push(chalk.yellow(`  ⊘ Skipped: ${item.file} (${item.reason})`));
      });
    }
    
    if (ssh.failed && ssh.failed.length > 0) {
      ssh.failed.forEach(item => {
        lines.push(chalk.red(`  ✗ Failed: ${item.file} - ${item.error}`));
      });
    }
    
    return lines;
  }
  
  /**
   * Format git results
   * @param {object} git - Git results
   * @returns {string[]} Formatted lines
   */
  formatGitResults(git) {
    const lines = [];
    
    lines.push(chalk.blue.bold('📝 Git Config:'));
    
    if (git.restored && git.restored.length > 0) {
      git.restored.forEach(item => {
        lines.push(chalk.green(`  ✓ Restored: ${item.key} = "${item.value}"`));
      });
    }
    
    if (git.unset && git.unset.length > 0) {
      git.unset.forEach(item => {
        lines.push(chalk.green(`  ✓ Unset: ${item.key}`));
      });
    }
    
    if (git.failed && git.failed.length > 0) {
      git.failed.forEach(item => {
        lines.push(chalk.red(`  ✗ Failed: ${item.key} - ${item.error}`));
      });
    }
    
    return lines;
  }
  
  /**
   * Format docs results
   * @param {object} docs - Docs results
   * @returns {string[]} Formatted lines
   */
  formatDocsResults(docs) {
    const lines = [];
    
    lines.push(chalk.blue.bold('📚 Documentation:'));
    
    if (docs.removed && docs.removed.length > 0) {
      docs.removed.forEach(item => {
        lines.push(chalk.green(`  ✓ Removed: ${item.directory} (${item.filesCount} files)`));
      });
    }
    
    if (docs.skipped && docs.skipped.length > 0) {
      docs.skipped.forEach(item => {
        lines.push(chalk.yellow(`  ⊘ Skipped: ${item.directory} (${item.reason})`));
      });
    }
    
    if (docs.failed && docs.failed.length > 0) {
      docs.failed.forEach(item => {
        lines.push(chalk.red(`  ✗ Failed: ${item.directory} - ${item.error}`));
      });
    }
    
    return lines;
  }
  
  /**
   * Get manual cleanup steps
   * @param {object} results - All rollback results
   * @returns {string[]} Manual cleanup steps
   */
  getManualCleanupSteps(results) {
    const steps = [];
    
    // Check for setup steps that can't be reversed
    if (results.setupSteps && results.setupSteps.length > 0) {
      steps.push('Review and manually undo custom setup steps (cannot be automated)');
    }
    
    // Check for backup files
    steps.push('Review and remove backup files (.env.backup.*) if no longer needed');
    
    return steps;
  }
  
  /**
   * Check if results object has any data
   * @param {object} results - Results object
   * @returns {boolean}
   */
  hasResults(results) {
    if (!results) return false;
    
    const keys = ['uninstalled', 'removed', 'restored', 'unset', 'skipped', 'failed'];
    return keys.some(key => results[key] && results[key].length > 0);
  }
  
  /**
   * Pad number for table alignment
   * @param {number} num - Number to pad
   * @param {number} width - Target width
   * @returns {string} Padded string
   */
  pad(num, width) {
    const str = String(num);
    return str.padStart(width, ' ');
  }
}

module.exports = new RollbackSummary();
