const logger = require('../ui/logger');

/**
 * Copilot Troubleshooter
 * 
 * Uses GitHub Copilot CLI to analyze errors and provide
 * actionable troubleshooting suggestions.
 */
class CopilotTroubleshooter {
    /**
     * Analyze error and get Copilot suggestions
     * @param {Object} error - Error object with type and message
     * @param {Object} context - Installation context
     * @returns {Promise<Object>} Troubleshooting suggestions
     */
    async analyzeFailed(error, context) {
        const prompt = `
      Troubleshoot this installation error:
      
      Error Type: ${error.type}
      Error Message: ${error.message}
      
      Context:
      - OS: ${context.os}
      - Node Version: ${context.nodeVersion}
      - Failed Step: ${context.failedStep}
      
      Provide:
      1. Root cause analysis
      2. Specific fix command
      3. Prevention tips
      
      Format as JSON:
      {
        "cause": "...",
        "fix": "...",
        "command": "...",
        "prevention": "..."
      }
    `;

        try {
            const result = await this._callCopilot(prompt);
            try {
                return JSON.parse(result);
            } catch (e) {
                // Fallback if Copilot returns non-JSON or markdown wrapped JSON
                const jsonMatch = result.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
                throw new Error('Invalid JSON format from Copilot');
            }
        } catch (err) {
            logger.debug(`Copilot analysis failed: ${err.message}`);
            return {
                cause: "Manual diagnosis required",
                fix: "Check error logs and documentation",
                command: null,
                prevention: "N/A"
            };
        }
    }

    /**
     * Get port conflict resolution
     * @param {number} port - Port number
     * @param {object} context - System context
     */
    async resolvePortConflict(port, context) {
        const prompt = `Port ${port} is already in use on ${context.os}. Provide the exact command to kill the process and prevent future conflicts. Return JSON with { "command": "...", "explanation": "..." }`;

        try {
            const result = await this._callCopilot(prompt);
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : { command: '', explanation: 'Could not generate command' };
        } catch (err) {
            return { command: '', explanation: 'Manual intervention required' };
        }
    }

    /**
     * Suggest dependency alternatives
     * @param {string} packageName - Name of failing package
     * @param {string} error - Error message
     */
    async suggestAlternative(packageName, error) {
        const prompt = `Package "${packageName}" failed to install with error: ${error}. Suggest 2 alternative packages with similar functionality. Return JSON array of objects with { "name": "...", "reason": "..." }`;

        try {
            const result = await this._callCopilot(prompt);
            const jsonMatch = result.match(/\[[\s\S]*\]/);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
        } catch (err) {
            return [];
        }
    }

    /**
     * Execute Copilot CLI command
     * @private
     */
    async _callCopilot(prompt) {
        // Escape double quotes in prompt to prevent shell syntax errors
        const safePrompt = prompt.replace(/"/g, '\\"');

        // Check if gh is available first (optimization)
        try {
            require('child_process').execSync('gh --version', { stdio: 'ignore' });
        } catch (e) {
            throw new Error('GitHub CLI (gh) not installed');
        }

        return require('child_process').execSync(`gh copilot suggest "${safePrompt}" --target shell`, {
            encoding: 'utf-8',
            timeout: 30000
        });
    }
    /**
     * Generate common issues and fixes based on dependencies
     * @param {Object} dependencies - Project dependencies
     */
    async generateCommonIssues(dependencies) {
        const depList = [
            ...(dependencies.npm || []),
            ...(dependencies.python || []),
            ...(dependencies.system || [])
        ].join(', ');

        const prompt = `Generate a troubleshooting guide for a project with these dependencies: ${depList}. List 3 common issues and their fixes. Return JSON array of objects with { "issue": "...", "fix": "..." }`;

        try {
            const result = await this._callCopilot(prompt);
            const jsonMatch = result.match(/\[[\s\S]*\]/);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
        } catch (err) {
            return [];
        }
    }
}

module.exports = new CopilotTroubleshooter();
