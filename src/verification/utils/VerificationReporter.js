const chalk = require('chalk');

/**
 * VerificationReporter - Formats and displays verification results
 */
class VerificationReporter {
  /**
   * Print verification results
   * @param {VerificationResult} result - Verification result to display
   * @param {object} options - Display options
   */
  printResults(result, options = {}) {
    const {
      showDetails = false,
      groupBy = 'priority', // priority | type | tag
      colorize = true
    } = options;

    console.log('');
    this._printHeader(result, colorize);
    console.log('');
    
    this._printSummary(result, colorize);
    console.log('');

    if (showDetails) {
      this._printChecks(result, groupBy, colorize);
      console.log('');
    }

    if (result.errors.length > 0) {
      this._printErrors(result.errors, colorize);
      console.log('');
    }

    if (result.warnings.length > 0) {
      this._printWarnings(result.warnings, colorize);
      console.log('');
    }

    this._printFooter(result, colorize);
    console.log('');
  }

  /**
   * Print header
   * @private
   */
  _printHeader(result, colorize) {
    const icon = result.success ? '✅' : '❌';
    const status = result.success ? 'PASSED' : 'FAILED';
    const text = `${icon} Verification ${status}`;
    
    console.log(colorize ? chalk.bold(text) : text);
    console.log(colorize ? chalk.gray('='.repeat(60)) : '='.repeat(60));
  }

  /**
   * Print summary statistics
   * @private
   */
  _printSummary(result, colorize) {
    const s = result.summary;
    
    console.log(colorize ? chalk.bold('Summary:') : 'Summary:');
    console.log(`  Total checks: ${s.total}`);
    
    if (s.passed > 0) {
      const text = `  Passed: ${s.passed}`;
      console.log(colorize ? chalk.green(text) : text);
    }
    
    if (s.failed > 0) {
      const text = `  Failed: ${s.failed}`;
      console.log(colorize ? chalk.red(text) : text);
    }
    
    if (s.skipped > 0) {
      const text = `  Skipped: ${s.skipped}`;
      console.log(colorize ? chalk.yellow(text) : text);
    }

    console.log(`  Pass rate: ${result.passRate.toFixed(1)}%`);
    console.log(`  Duration: ${result.duration}ms`);
    console.log('');

    // Priority breakdown
    console.log(colorize ? chalk.bold('By Priority:') : 'By Priority:');
    for (const [priority, counts] of Object.entries(s.byPriority)) {
      const total = counts.passed + counts.failed + counts.skipped;
      if (total > 0) {
        const statusText = `${counts.passed}✓ ${counts.failed}✗ ${counts.skipped}⊘`;
        console.log(`  ${priority}: ${total} checks (${statusText})`);
      }
    }
  }

  /**
   * Print detailed check results
   * @private
   */
  _printChecks(result, groupBy, colorize) {
    console.log(colorize ? chalk.bold('Detailed Results:') : 'Detailed Results:');
    console.log('');

    const groups = this._groupChecks(result.checks, groupBy);

    for (const [groupName, checks] of Object.entries(groups)) {
      if (checks.length === 0) continue;

      console.log(colorize ? chalk.bold.underline(groupName) : groupName);
      
      for (const check of checks) {
        this._printCheck(check, colorize);
      }
      
      console.log('');
    }
  }

  /**
   * Print single check result
   * @private
   */
  _printCheck(check, colorize) {
    let icon, color;
    
    switch (check.status) {
      case 'passed':
        icon = '✓';
        color = colorize ? chalk.green : (x => x);
        break;
      case 'failed':
        icon = '✗';
        color = colorize ? chalk.red : (x => x);
        break;
      case 'skipped':
        icon = '⊘';
        color = colorize ? chalk.yellow : (x => x);
        break;
      default:
        icon = '?';
        color = (x => x);
    }

    const priorityBadge = `[${check.priority}]`;
    const checkLine = `  ${icon} ${priorityBadge} ${check.name}`;
    console.log(color(checkLine));

    if (check.message) {
      const msgLine = `     ${check.message}`;
      console.log(color(msgLine));
    }

    if (check.duration > 0) {
      const durationLine = `     Duration: ${check.duration}ms`;
      console.log(colorize ? chalk.gray(durationLine) : durationLine);
    }
  }

  /**
   * Print errors
   * @private
   */
  _printErrors(errors, colorize) {
    console.log(colorize ? chalk.bold.red('Errors:') : 'Errors:');
    errors.forEach(error => {
      const text = `  ❌ ${error}`;
      console.log(colorize ? chalk.red(text) : text);
    });
  }

  /**
   * Print warnings
   * @private
   */
  _printWarnings(warnings, colorize) {
    console.log(colorize ? chalk.bold.yellow('Warnings:') : 'Warnings:');
    warnings.forEach(warning => {
      const text = `  ⚠️  ${warning}`;
      console.log(colorize ? chalk.yellow(text) : text);
    });
  }

  /**
   * Print footer
   * @private
   */
  _printFooter(result, colorize) {
    console.log(colorize ? chalk.gray('='.repeat(60)) : '='.repeat(60));
    
    if (result.success) {
      const text = '✅ All verification checks passed!';
      console.log(colorize ? chalk.green.bold(text) : text);
    } else {
      const text = '❌ Verification completed with failures';
      console.log(colorize ? chalk.red.bold(text) : text);
      
      if (result.hasCriticalFailures) {
        const critical = '⚠️  Critical (P0) checks failed';
        console.log(colorize ? chalk.red(critical) : critical);
      }
    }
  }

  /**
   * Group checks by specified field
   * @private
   */
  _groupChecks(checks, groupBy) {
    const groups = {};

    for (const check of checks) {
      let key;
      
      switch (groupBy) {
        case 'priority':
          key = check.priority;
          break;
        case 'type':
          key = check.type;
          break;
        case 'tag':
          key = check.tags.length > 0 ? check.tags[0] : 'untagged';
          break;
        default:
          key = 'all';
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(check);
    }

    return groups;
  }

  /**
   * Print compact summary (for non-verbose mode)
   * @param {VerificationResult} result 
   * @param {boolean} colorize 
   */
  printCompact(result, colorize = true) {
    const icon = result.success ? '✅' : '❌';
    const status = result.success ? 'PASSED' : 'FAILED';
    const summary = `${icon} Verification ${status}: ${result.summary.passed}/${result.summary.total} checks passed`;
    
    console.log(colorize ? (result.success ? chalk.green(summary) : chalk.red(summary)) : summary);
  }
}

module.exports = VerificationReporter;
