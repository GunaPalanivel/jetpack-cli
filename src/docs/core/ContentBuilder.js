/**
 * ContentBuilder - Section composers for generating documentation content
 * Provides utilities to build tables, command snippets, and formatted sections
 */
class ContentBuilder {
  /**
   * Build a markdown table for dependencies
   * @param {object} dependencies - Dependencies object {system: [], npm: [], python: []}
   * @returns {string} Markdown table
   */
  buildDependencyTable(dependencies) {
    if (!dependencies) return '';

    const rows = [];
    
    if (dependencies.system && dependencies.system.length > 0) {
      rows.push(`| System | ${dependencies.system.join(', ')} |`);
    }
    
    if (dependencies.npm && dependencies.npm.length > 0) {
      rows.push(`| npm | ${dependencies.npm.join(', ')} |`);
    }
    
    if (dependencies.python && dependencies.python.length > 0) {
      rows.push(`| Python | ${dependencies.python.join(', ')} |`);
    }

    if (rows.length === 0) {
      return '_No dependencies specified_';
    }

    return [
      '| Type | Packages |',
      '|------|----------|',
      ...rows
    ].join('\n');
  }

  /**
   * Build command snippet with platform detection
   * @param {string} command - Command to format
   * @param {string} platform - Platform (Windows_NT, Darwin, Linux)
   * @returns {string} Formatted code block
   */
  buildCommandSnippet(command, platform = process.platform) {
    const shell = platform === 'win32' || platform === 'Windows_NT' ? 'powershell' : 'bash';
    return `\`\`\`${shell}\n${command}\n\`\`\``;
  }

  /**
   * Build environment variables list
   * @param {object} environment - Environment config {required: [], optional: []}
   * @returns {string} Formatted list
   */
  buildEnvironmentList(environment) {
    if (!environment) return '_No environment variables_';

    const sections = [];

    if (environment.required && environment.required.length > 0) {
      sections.push('**Required:**\n' + environment.required.map(v => `- \`${v}\``).join('\n'));
    }

    if (environment.optional && environment.optional.length > 0) {
      sections.push('**Optional:**\n' + environment.optional.map(v => `- \`${v}\``).join('\n'));
    }

    return sections.length > 0 ? sections.join('\n\n') : '_No environment variables_';
  }

  /**
   * Build verification checks summary
   * @param {object} verification - Verification result {checks: number, passed: number, failed: number}
   * @returns {string} Formatted summary
   */
  buildVerificationSummary(verification) {
    if (!verification || !verification.checks) {
      return '_No verification checks configured_';
    }

    const { checks, passed, failed } = verification;
    const status = failed === 0 ? '✅ All checks passed' : `⚠️ ${failed} check(s) failed`;

    return `${status} (${passed}/${checks} successful)`;
  }

  /**
   * Build setup steps list
   * @param {array} setupSteps - Array of setup steps [{name, command, description}]
   * @returns {string} Formatted list
   */
  buildSetupStepsList(setupSteps) {
    if (!setupSteps || setupSteps.length === 0) {
      return '_No setup steps defined_';
    }

    return setupSteps.map((step, index) => {
      const description = step.description ? ` - ${step.description}` : '';
      
      // Handle missing command gracefully
      if (!step.command) {
        return `${index + 1}. **${step.name}**${description}\n   _⚠️ No command specified_`;
      }
      
      return `${index + 1}. **${step.name}**${description}\n   \`\`\`bash\n   ${step.command}\n   \`\`\``;
    }).join('\n\n');
  }

  /**
   * Build configuration summary
   * @param {object} config - Configuration object {envFile, sshKey, gitUser}
   * @returns {string} Formatted summary
   */
  buildConfigSummary(config) {
    if (!config) return '_No configuration generated_';

    const items = [];

    if (config.envFile) {
      items.push(`- **Environment**: ${config.envFile}`);
    }

    if (config.sshKey) {
      items.push(`- **SSH Key**: ${config.sshKey}`);
    }

    if (config.gitUser) {
      items.push(`- **Git User**: ${config.gitUser}`);
    }

    return items.length > 0 ? items.join('\n') : '_No configuration generated_';
  }

  /**
   * Build platform-specific note
   * @param {string} platform - Platform (Windows_NT, Darwin, Linux)
   * @returns {string} Platform-specific instructions
   */
  buildPlatformNote(platform) {
    const notes = {
      'Windows_NT': '> **Note for Windows users**: Use PowerShell or Command Prompt to run commands.',
      'win32': '> **Note for Windows users**: Use PowerShell or Command Prompt to run commands.',
      'Darwin': '> **Note for macOS users**: Some commands may require `sudo` for system-level changes.',
      'darwin': '> **Note for macOS users**: Some commands may require `sudo` for system-level changes.',
      'Linux': '> **Note for Linux users**: Package manager commands may require `sudo` privileges.',
      'linux': '> **Note for Linux users**: Package manager commands may require `sudo` privileges.'
    };

    return notes[platform] || '';
  }

  /**
   * Build quick navigation links
   * @param {array} sections - Array of section names
   * @returns {string} Navigation links
   */
  buildNavigation(sections) {
    if (!sections || sections.length === 0) return '';

    return sections.map(section => {
      const link = section.toLowerCase().replace(/\s+/g, '-');
      return `- [${section}](${link}.md)`;
    }).join('\n');
  }
}

module.exports = new ContentBuilder();
