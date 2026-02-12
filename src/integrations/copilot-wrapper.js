const { execSync } = require('child_process');
const crypto = require('crypto');

/**
 * Copilot Wrapper
 * 
 * Abstraction layer for GitHub Copilot CLI interactions.
 * Handles command execution, error parsing, and fallback strategies.
 */
class CopilotWrapper {
  constructor() {
    this.isAvailable = this.checkAvailability();
  }

  /**
   * Check if gh copilot extension is installed and authenticated
   * @returns {boolean} True if available
   */
  checkAvailability() {
    try {
      execSync('gh copilot --version', { 
        stdio: 'ignore',
        timeout: 3000
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get a suggestion from Copilot for a specific task
   * @param {string} prompt - The task to suggest for
   * @param {string} type - 'shell' (default) or 'gh'
   * @returns {string|null} The suggested command or value
   */
  suggest(prompt, type = 'shell') {
    if (!this.isAvailable) return null;

    try {
      const cmd = `gh copilot suggest -t ${type} "${prompt}"`;
      const result = execSync(cmd, {
        encoding: 'utf8',
        timeout: 10000, // 10s timeout for network requests
        stdio: ['pipe', 'pipe', 'ignore']
      });

      return this._parseSuggestion(result);
    } catch (error) {
      // Fail silently for AI features
      return null;
    }
  }

  /**
   * Ask Copilot to explain something
   * @param {string} query - What to explain
   * @returns {string|null} The explanation
   */
  explain(query) {
    if (!this.isAvailable) return null;

    try {
      const cmd = `gh copilot explain "${query}"`;
      const result = execSync(cmd, {
        encoding: 'utf8',
        timeout: 10000,
        stdio: ['pipe', 'pipe', 'ignore']
      });

      return this._parseExplanation(result);
    } catch (error) {
      return null;
    }
  }

  /**
   * Parse output from 'gh copilot suggest'
   * @private
   */
  _parseSuggestion(output) {
    const lines = output.split('\n');
    // Filter out interactive prompts and headers
    // This is a heuristic as the CLI output can vary
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && 
          !trimmed.startsWith('#') && 
          !trimmed.includes('Suggestion:') &&
          !trimmed.includes('Welcome to GitHub Copilot')) {
        return trimmed;
      }
    }
    return null;
  }

  /**
   * Parse output from 'gh copilot explain'
   * @private
   */
  _parseExplanation(output) {
    // Keep the main content, remove headers/footers
    return output
      .split('\n')
      .filter(l => !l.includes('Explanation:') && !l.includes('Welcome to GitHub Copilot'))
      .join('\n')
      .trim();
  }
}

module.exports = new CopilotWrapper();
