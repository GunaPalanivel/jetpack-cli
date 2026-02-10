const { spawn } = require('child_process');

/**
 * ProcessRunner - Safe command execution utility
 */
class ProcessRunner {
  /**
   * Execute a shell command
   * @param {string} command - Command to execute
   * @param {object} options - Execution options
   * @returns {Promise<object>} Result with stdout, stderr, exitCode
   */
  static async executeCommand(command, options = {}) {
    const {
      timeout = 30000,
      env = process.env,
      cwd = process.cwd(),
      shell = true
    } = options;

    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      let stdout = '';
      let stderr = '';
      let timedOut = false;

      // Determine shell based on platform
      const shellCommand = process.platform === 'win32' ? 'cmd.exe' : '/bin/sh';
      const shellArgs = process.platform === 'win32' ? ['/c', command] : ['-c', command];

      const childProcess = spawn(shellCommand, shellArgs, {
        env,
        cwd,
        shell: false,
        windowsHide: true
      });

      // Set timeout
      const timeoutId = setTimeout(() => {
        timedOut = true;
        childProcess.kill('SIGTERM');
        
        // Force kill after 5 seconds
        setTimeout(() => {
          if (!childProcess.killed) {
            childProcess.kill('SIGKILL');
          }
        }, 5000);
      }, timeout);

      // Capture stdout
      childProcess.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      // Capture stderr
      childProcess.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      // Handle completion
      childProcess.on('close', (exitCode) => {
        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;

        if (timedOut) {
          reject(new Error(`Command timed out after ${timeout}ms: ${command}`));
        } else {
          resolve({
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            exitCode: exitCode || 0,
            duration,
            command
          });
        }
      });

      // Handle errors
      childProcess.on('error', (error) => {
        clearTimeout(timeoutId);
        reject(new Error(`Failed to execute command: ${error.message}`));
      });
    });
  }

  /**
   * Check if a command exists in the system
   * @param {string} command - Command name to check
   * @returns {Promise<boolean>}
   */
  static async commandExists(command) {
    const checkCmd = process.platform === 'win32' 
      ? `where ${command}`
      : `which ${command}`;

    try {
      const result = await this.executeCommand(checkCmd, { timeout: 5000 });
      return result.exitCode === 0;
    } catch (error) {
      return false;
    }
  }
}

module.exports = ProcessRunner;
