const chalk = require('chalk');

/**
 * Logger - Formatted console output with colors and emojis
 */
class Logger {
  /**
   * Display header with styling
   * @param {string} text - Header text
   */
  header(text) {
    console.log(chalk.bold.cyan('\n' + text));
    console.log(chalk.cyan('='.repeat(text.length)));
  }

  /**
   * Display info message
   * @param {string} message - Info message
   */
  info(message) {
    console.log(chalk.blue('ℹ'), message);
  }

  /**
   * Display success message
   * @param {string} message - Success message
   */
  success(message) {
    console.log(chalk.green(message));
  }

  /**
   * Display error message
   * @param {string} message - Error message
   * @param {string} details - Optional error details
   */
  error(message, details = '') {
    console.error(chalk.red(message));
    if (details) {
      console.error(chalk.gray(details));
    }
  }

  /**
   * Display warning message
   * @param {string} message - Warning message
   */
  warning(message) {
    console.log(chalk.yellow(message));
  }

  /**
   * Display step number with description
   * @param {number} stepNumber - Step number
   * @param {string} description - Step description
   */
  step(stepNumber, description) {
    console.log(chalk.bold.magenta(`\n[${stepNumber}] ${description}`));
  }

  /**
   * Print a new line
   */
  newLine() {
    console.log('');
  }

  /**
   * Display a separator line
   */
  separator() {
    console.log(chalk.gray('─'.repeat(60)));
  }

  /**
   * Display debug message (only in verbose mode)
   * @param {string} message - Debug message
   */
  debug(message) {
    if (process.env.DEBUG) {
      console.log(chalk.gray('[DEBUG]'), message);
    }
  }
}

module.exports = new Logger();
