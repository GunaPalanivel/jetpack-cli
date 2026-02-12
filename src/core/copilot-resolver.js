const logger = require('../ui/logger');

/**
 * Copilot Resolver
 * 
 * Uses GitHub Copilot CLI to resolve dependency conflicts
 * and suggest fixes for missing peer dependencies.
 */
class CopilotResolver {
    /**
     * Resolve version conflicts
     * @param {string} packageName - Package name
     * @param {string} requiredVersion - Required version
     * @param {string} currentVersion - Current/Conflicting version
     * @returns {Promise<Object>} Resolution suggestion
     */
    async resolveVersionConflict(packageName, requiredVersion, currentVersion) {
        const prompt = `
      Package "${packageName}" version conflict:
      - Required: ${requiredVersion}
      - Current: ${currentVersion}
      
      Provide:
      1. Upgrade/downgrade command
      2. Breaking changes warning
      3. Alternative solution if incompatible
      
      Return JSON with: { "action": "...", "command": "...", "warnings": "...", "alternative": "..." }
    `;

        try {
            const result = await this._callCopilot(prompt);
            try {
                const jsonMatch = result.match(/\{[\s\S]*\}/);
                return jsonMatch ? JSON.parse(jsonMatch[0]) : this._fallbackResponse();
            } catch (e) {
                return this._fallbackResponse();
            }
        } catch (err) {
            logger.debug(`Copilot resolution failed: ${err.message}`);
            return this._fallbackResponse();
        }
    }

    /**
     * Suggest missing peer dependencies
     * @param {string} packageName - Package name
     * @param {string} error - Error message
     * @returns {Promise<Object>} Suggested fix
     */
    async suggestPeerDependencies(packageName, error) {
        const prompt = `Package "${packageName}" has unmet peer dependencies. Error: ${error}. List the exact npm install commands needed. Return JSON with { "command": "...", "explanation": "..." }`;

        try {
            const result = await this._callCopilot(prompt);
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : { command: '', explanation: 'Could not generate fix' };
        } catch (err) {
            return { command: '', explanation: 'Manual intervention required' };
        }
    }

    _fallbackResponse() {
        return {
            action: "Manual resolution",
            command: "",
            warnings: "Could not prevent conflict automatically",
            alternative: "Check package documentation"
        };
    }

    /**
     * Execute Copilot CLI command
     * @private
     */
    async _callCopilot(prompt) {
        const safePrompt = prompt.replace(/"/g, '\\"');

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
}

module.exports = new CopilotResolver();
