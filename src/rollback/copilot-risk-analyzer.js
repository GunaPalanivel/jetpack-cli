const logger = require('../ui/logger');

/**
 * Copilot Risk Analyzer
 * 
 * Uses GitHub Copilot to assess risks associated with
 * rolling back changes, identifying potential data loss
 * or side effects.
 */
class CopilotRiskAnalyzer {
    /**
     * Assess rollback risks with Copilot
     * @param {Object} state - Current installation state
     * @param {Object} options - Rollback options
     * @returns {Promise<Object>} Risk assessment
     */
    async assessRisks(state, options) {
        const prompt = `
      Assess risks of rolling back these changes:
      
      Packages to uninstall: ${state.installedPackages ? state.installedPackages.join(', ') : 'None'}
      Configs to restore: ${state.configFiles ? state.configFiles.join(', ') : 'None'}
      Git config changes: ${state.gitConfig ? JSON.stringify(state.gitConfig) : 'None'}
      SSH keys to remove: ${state.sshKeys ? 'Yes' : 'No'}
      
      Options:
      - Unsafe mode: ${options.unsafe}
      - Partial rollback: ${options.partial || 'No'}
      
      Provide:
      1. High-risk actions (list)
      2. Data loss warnings
      3. Recommended precautions
      
      Return JSON: { "highRisk": [], "warnings": [], "precautions": [] }
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
            logger.debug(`Copilot risk analysis failed: ${err.message}`);
            return this._fallbackResponse();
        }
    }

    async suggestSaferAlternative(riskyAction) {
        const prompt = `The user wants to: ${riskyAction}. This is risky. Suggest a safer alternative approach. Return JSON with { "suggestion": "..." }`;
        try {
            const result = await this._callCopilot(prompt);
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : { suggestion: 'Manual backup recommended' };
        } catch (err) {
            return { suggestion: 'Manual backup recommended' };
        }
    }

    _fallbackResponse() {
        return {
            highRisk: ["Manual verification required"],
            warnings: ["Could not analyze risks automatically"],
            precautions: ["Backup all data before proceeding"]
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

module.exports = new CopilotRiskAnalyzer();
