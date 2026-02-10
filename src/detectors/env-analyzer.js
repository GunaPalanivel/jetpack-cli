const { execSync } = require('child_process');
const os = require('os');

/**
 * Environment Analyzer - Detects system capabilities and installed tools
 */
class EnvironmentAnalyzer {
  /**
   * Detect comprehensive system environment information
   * @returns {Promise<object>} Environment details
   */
  async detect() {
    const environment = {
      os: this.detectOS(),
      platform: process.platform,
      arch: process.arch,
      shell: this.detectShell(),
      nodeVersion: process.version,
      npmVersion: await this.getVersion('npm'),
      gitVersion: await this.getVersion('git'),
      packageManagers: await this.detectPackageManagers(),
      hasDocker: await this.checkCommand('docker'),
      timestamp: new Date().toISOString()
    };

    return environment;
  }

  /**
   * Detect operating system
   * @returns {string} OS name
   */
  detectOS() {
    const platform = process.platform;
    switch (platform) {
      case 'win32':
        return 'Windows';
      case 'darwin':
        return 'macOS';
      case 'linux':
        return 'Linux';
      default:
        return platform;
    }
  }

  /**
   * Detect shell type
   * @returns {string} Shell name
   */
  detectShell() {
    if (process.platform === 'win32') {
      return process.env.ComSpec || 'cmd.exe';
    }
    return process.env.SHELL || 'bash';
  }

  /**
   * Get version of a command-line tool
   * @param {string} command - Command to check
   * @returns {Promise<string>} Version string or 'Not installed'
   */
  async getVersion(command) {
    try {
      const versionFlag = command === 'git' ? '--version' : '--version';
      const result = execSync(`${command} ${versionFlag}`, { 
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore']
      });
      return result.trim().split('\n')[0];
    } catch (error) {
      return 'Not installed';
    }
  }

  /**
   * Check if a command exists
   * @param {string} command - Command to check
   * @returns {Promise<boolean>} True if command exists
   */
  async checkCommand(command) {
    try {
      const checkCmd = process.platform === 'win32' 
        ? `where ${command}` 
        : `which ${command}`;
      execSync(checkCmd, { stdio: 'ignore' });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if a specific dependency is installed
   * @param {string} dependency - Dependency name to check
   * @returns {Promise<boolean>}
   */
  async checkDependency(dependency) {
    return await this.checkCommand(dependency);
  }

  /**
   * Detect available package managers on the system
   * @returns {Promise<object>} Available package managers
   */
  async detectPackageManagers() {
    const managers = {
      npm: await this.checkCommand('npm'),
      yarn: await this.checkCommand('yarn'),
      pnpm: await this.checkCommand('pnpm'),
    };

    if (process.platform === 'win32') {
      managers.chocolatey = await this.checkCommand('choco');
      managers.scoop = await this.checkCommand('scoop');
      managers.winget = await this.checkCommand('winget');
    } else if (process.platform === 'darwin') {
      managers.homebrew = await this.checkCommand('brew');
    } else if (process.platform === 'linux') {
      managers.apt = await this.checkCommand('apt-get');
      managers.yum = await this.checkCommand('yum');
    }

    return managers;
  }
}

module.exports = new EnvironmentAnalyzer();
