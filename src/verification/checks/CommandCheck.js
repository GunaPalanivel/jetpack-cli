const BaseCheck = require('./BaseCheck');
const ProcessRunner = require('../utils/ProcessRunner');

/**
 * CommandCheck - Validates command execution and output
 */
class CommandCheck extends BaseCheck {
  constructor(config) {
    super({ ...config, type: 'command' });
    this.command = config.command;
    this.expectedExitCode = config.expectedExitCode !== undefined ? config.expectedExitCode : 0;
    this.expectedOutput = config.expectedOutput || null;
    this.env = config.env || {};
  }

  /**
   * Validate configuration
   */
  validate() {
    super.validate();
    this.validateConfig(['command']);

    if (typeof this.command !== 'string' || !this.command.trim()) {
      throw new Error('command must be a non-empty string');
    }
  }

  /**
   * Execute the command check
   * @param {object} context - Execution context
   * @returns {Promise<CheckResult>}
   */
  async execute(context = {}) {
    const result = this.createResult();
    result.markRunning();

    try {
      // Execute command
      const execResult = await ProcessRunner.executeCommand(this.command, {
        timeout: this.timeout,
        env: { ...process.env, ...this.env },
        cwd: context.cwd || process.cwd()
      });

      result.actualValue = {
        exitCode: execResult.exitCode,
        stdout: execResult.stdout,
        stderr: execResult.stderr
      };

      // Check exit code
      if (execResult.exitCode !== this.expectedExitCode) {
        result.markFailed(
          `Command exited with code ${execResult.exitCode}, expected ${this.expectedExitCode}`,
          new Error(`Exit code mismatch`)
        );
        result.output = {
          stdout: execResult.stdout,
          stderr: execResult.stderr,
          exitCode: execResult.exitCode
        };
        return result;
      }

      // Check output if pattern specified
      if (this.expectedOutput) {
        const outputToCheck = execResult.stdout || execResult.stderr || '';
        const pattern = new RegExp(this.expectedOutput);
        
        if (!pattern.test(outputToCheck)) {
          result.markFailed(
            `Command output did not match expected pattern: ${this.expectedOutput}`,
            new Error('Output pattern mismatch')
          );
          result.expectedValue = this.expectedOutput;
          result.output = {
            stdout: execResult.stdout,
            stderr: execResult.stderr
          };
          return result;
        }
      }

      // Success!
      result.markPassed(
        `Command executed successfully with exit code ${execResult.exitCode}`,
        {
          stdout: execResult.stdout,
          stderr: execResult.stderr,
          exitCode: execResult.exitCode,
          duration: execResult.duration
        }
      );

    } catch (error) {
      result.markFailed(
        `Command execution failed: ${error.message}`,
        error
      );
    }

    return result;
  }
}

module.exports = CommandCheck;
