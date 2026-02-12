/**
 * ContentBuilder.js
 * Helpers for generating Markdown content sections
 */
class ContentBuilder {
    /**
     * Build a markdown table of dependencies
     * @param {object} dependencies - Dependencies object from manifest
     * @returns {string} Markdown table
     */
    buildDependencyTable(dependencies) {
        if (!dependencies || Object.keys(dependencies).length === 0) {
            return '_No dependencies specified_';
        }

        let markdown = '| Type | Packages |\n| :--- | :--- |\n';
        let hasRows = false;

        if (dependencies.system && dependencies.system.length > 0) {
            markdown += `| System | ${dependencies.system.join(', ')} |\n`;
            hasRows = true;
        }
        if (dependencies.npm && dependencies.npm.length > 0) {
            markdown += `| npm | ${dependencies.npm.join(', ')} |\n`;
            hasRows = true;
        }
        if (dependencies.python && dependencies.python.length > 0) {
            markdown += `| Python | ${dependencies.python.join(', ')} |\n`;
            hasRows = true;
        }

        return hasRows ? markdown : '_No dependencies specified_';
    }

    /**
     * Build a code block for a command
     * @param {string} command - Command string
     * @param {string} platform - OS platform (Windows_NT, Linux, Darwin)
     * @returns {string} Markdown code block
     */
    buildCommandSnippet(command, platform) {
        const lang = platform === 'Windows_NT' ? 'powershell' : 'bash';
        return `\`\`\`${lang}\n${command}\n\`\`\``;
    }

    /**
     * Build a list of environment variables
     * @param {object} environment - Environment object from manifest
     * @returns {string} Markdown list
     */
    buildEnvironmentList(environment) {
        if (!environment) return '_No environment variables specified_';

        let markdown = '';

        if (environment.required && environment.required.length > 0) {
            markdown += '**Required:**\n';
            environment.required.forEach(v => {
                markdown += `*   \`${v}\`\n`;
            });
            markdown += '\n';
        }

        if (environment.optional && environment.optional.length > 0) {
            markdown += '**Optional:**\n';
            environment.optional.forEach(v => {
                markdown += `*   \`${v}\`\n`;
            });
        }

        return markdown || '_No environment variables specified_';
    }

    /**
     * Build verification summary message
     * @param {object} result - Verification result object
     * @returns {string} Summary string
     */
    buildVerificationSummary(result) {
        if (!result) return 'Verification not run';

        // Handle both direct result object and nested summary object for compatibility
        const total = result.checks || result.total || 0;
        const passed = result.passed || 0;
        const failed = result.failed || 0;

        if (failed === 0) {
            return `✅ All checks passed (${passed}/${total} successful)`;
        }
        return `⚠️ ${failed} check(s) failed (${passed}/${total} successful)`;
    }

    /**
     * Build numbered list of setup steps
     * @param {Array} steps - List of setup steps
     * @returns {string} Markdown list
     */
    buildSetupStepsList(steps) {
        if (!steps || steps.length === 0) return '_No setup steps specified_';

        return steps.map((step, index) => {
            const desc = step.description ? ` - ${step.description}` : '';
            return `${index + 1}. **${step.name}**\n   \`${step.command}\`${desc}`;
        }).join('\n\n');
    }

    /**
     * Build configuration summary
     * @param {object} config - Config object (envFile, sshKey, gitUser)
     * @returns {string} Markdown bullet list
     */
    buildConfigSummary(config) {
        const items = [];
        if (config.envFile) items.push(`*   **Environment**: ${config.envFile}`);
        if (config.sshKey) items.push(`*   **SSH Key**: ${config.sshKey}`);
        if (config.gitUser) items.push(`*   **Git User**: ${config.gitUser}`);

        return items.length > 0 ? items.join('\n') : '_No configuration generated_';
    }

    /**
     * Build platform specific note
     * @param {string} platform - OS platform
     * @returns {string} Note string
     */
    buildPlatformNote(platform) {
        if (platform === 'Windows_NT') {
            return '> **Note for Windows users**: Commands are executed in powershell.';
        }
        if (platform === 'Darwin') {
            return '> **Note for macOS users**: Some commands may require `sudo`.';
        }
        return '> **Note**: Commands are executed in the default shell.';
    }
}

module.exports = new ContentBuilder();
