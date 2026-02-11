const path = require('path');
const fs = require('fs').promises;
const templateEngine = require('../core/TemplateEngine');
const contentBuilder = require('../core/ContentBuilder');

/**
 * SetupDocsGenerator - Generates setup documentation (dependencies, configuration, environment)
 */
class SetupDocsGenerator {
  /**
   * Generate setup documentation
   * @param {object} context - Documentation context
   * @param {string} outputDir - Output directory path
   * @param {object} options - Generation options
   * @returns {Promise<array>} Array of generated file paths
   */
  async generate(context, outputDir, options = {}) {
    const files = [];
    const sectionDir = path.join(outputDir, 'setup');

    // Generate dependencies.md
    const depsPath = path.join(sectionDir, 'dependencies.md');
    const depsContent = this._generateDependencies(context);
    await fs.writeFile(depsPath, depsContent, 'utf8');
    files.push(depsPath);

    // Generate configuration.md
    const configPath = path.join(sectionDir, 'configuration.md');
    const configContent = this._generateConfiguration(context);
    await fs.writeFile(configPath, configContent, 'utf8');
    files.push(configPath);

    // Generate environment.md
    const envPath = path.join(sectionDir, 'environment.md');
    const envContent = this._generateEnvironment(context);
    await fs.writeFile(envPath, envContent, 'utf8');
    files.push(envPath);

    return files;
  }

  /**
   * Generate dependencies documentation
   * @private
   */
  _generateDependencies(context) {
    const template = `# 📦 Dependencies

Complete list of dependencies installed for **{{project.name}}**.

## Installed Packages

${contentBuilder.buildDependencyTable(context.dependencies)}

{{#if dependencies.system}}
## System Dependencies

These tools were installed at the system level:

{{#each dependencies.system}}
### \`{{this}}\`

Check installation:
\`\`\`bash
{{this}} --version
\`\`\`
{{/each}}
{{/if}}

{{#if dependencies.npm}}
## npm Packages

Global npm packages installed:

{{#each dependencies.npm}}
- **\`{{this}}\`**
{{/each}}

Check installations:
\`\`\`bash
npm list -g --depth=0
\`\`\`
{{/if}}

{{#if dependencies.python}}
## Python Packages

Python packages installed via pip:

{{#each dependencies.python}}
- **\`{{this}}\`**
{{/each}}

Check installations:
\`\`\`bash
pip list
\`\`\`
{{/if}}

## Updating Dependencies

To update dependencies in the future:

{{#if dependencies.npm}}
\`\`\`bash
npm update -g
\`\`\`
{{/if}}

{{#if dependencies.python}}
\`\`\`bash
pip install --upgrade {{dependencies.python}}
\`\`\`
{{/if}}

## Uninstalling

If you need to remove dependencies:

{{#if dependencies.npm}}
\`\`\`bash
npm uninstall -g {{dependencies.npm}}
\`\`\`
{{/if}}

{{#if dependencies.python}}
\`\`\`bash
pip uninstall {{dependencies.python}}
\`\`\`
{{/if}}

---

For troubleshooting dependency issues, see [common issues](../troubleshooting/common-issues.md).
`;

    return templateEngine.render(template, context);
  }

  /**
   * Generate configuration documentation
   * @private
   */
  _generateConfiguration(context) {
    const template = `# ⚙️ Configuration

Configuration files and settings for **{{project.name}}**.

{{#if config}}
## Generated Configuration

The following configuration was automatically generated:

${contentBuilder.buildConfigSummary(context.config)}

{{#if config.envFile}}
### Environment Variables

Your \`.env\` file has been created with project-specific variables.

**Important**: Never commit \`.env\` to version control. Use \`.env.template\` or \`.env.example\` for sharing configuration structure.

View your configuration:
\`\`\`bash
cat .env
\`\`\`
{{/if}}

{{#if config.sshKey}}
### SSH Keys

SSH key generated at: **{{config.sshKey}}**

Your public key:
\`\`\`bash
cat {{config.sshKey}}.pub
\`\`\`

Add this key to your GitHub/GitLab account for repository access.
{{/if}}

{{#if config.gitUser}}
### Git Configuration

Git identity configured as: **{{config.gitUser}}**

View your git config:
\`\`\`bash
git config --global user.name
git config --global user.email
\`\`\`
{{/if}}
{{/if}}

## Manual Configuration

{{#if environment.required}}
### Required Variables

Ensure these environment variables are set in your \`.env\`:

{{#each environment.required}}
\`\`\`bash
{{this}}=your_value_here
\`\`\`
{{/each}}
{{/if}}

{{#if environment.optional}}
### Optional Variables

You may also configure these optional variables:

{{#each environment.optional}}
\`\`\`bash
{{this}}=your_value_here
\`\`\`
{{/each}}
{{/if}}

## Configuration Files

Common configuration files for this project:

- **\`.env\`** - Environment variables (DO NOT commit)
- **\`.env.template\`** - Template for required variables (commit this)
- **\`.env.example\`** - Example configuration with documentation
- **\`.gitignore\`** - Ensures sensitive files aren't committed

## Validation

Verify your configuration:

\`\`\`bash
jetpack verify
\`\`\`

This will check that all required variables are set and valid.

---

For configuration issues, see [troubleshooting guide](../troubleshooting/common-issues.md).
`;

    return templateEngine.render(template, context);
  }

  /**
   * Generate environment-specific documentation
   * @private
   */
  _generateEnvironment(context) {
    const template = `# 🖥️ Environment Setup

Platform-specific setup instructions for **{{project.name}}**.

## Your Environment

- **Operating System**: {{platform.os}}
- **Shell**: {{platform.shell}}

## Platform-Specific Notes

${contentBuilder.buildPlatformNote(context.platform.os)}

{{#if platform.os}}
### {{platform.os}} Setup

{{/if}}

### Package Managers

Recommended package managers for your platform:

**Windows:**
- [Chocolatey](https://chocolatey.org/) - \`choco install <package>\`
- [Scoop](https://scoop.sh/) - \`scoop install <package>\`
- [winget](https://docs.microsoft.com/en-us/windows/package-manager/) - \`winget install <package>\`

**macOS:**
- [Homebrew](https://brew.sh/) - \`brew install <package>\`

**Linux:**
- apt (Debian/Ubuntu) - \`sudo apt install <package>\`
- yum (RHEL/CentOS) - \`sudo yum install <package>\`
- dnf (Fedora) - \`sudo dnf install <package>\`

## Shell Configuration

Add these to your shell configuration file:

**PowerShell** (\`$PROFILE\`):
\`\`\`powershell
# Add custom PATH entries
$env:PATH += ";C:\\path\\to\\your\\tools"
\`\`\`

**Bash/Zsh** (\`~/.bashrc\` or \`~/.zshrc\`):
\`\`\`bash
# Add custom PATH entries
export PATH="$PATH:/path/to/your/tools"
\`\`\`

## Environment Variables

Set environment variables for your shell:

**PowerShell**:
\`\`\`powershell
[Environment]::SetEnvironmentVariable("VAR_NAME", "value", "User")
\`\`\`

**Bash/Zsh**:
\`\`\`bash
export VAR_NAME=value
echo 'export VAR_NAME=value' >> ~/.bashrc
\`\`\`

## Permissions

{{#if platform.os}}
**{{platform.os}}** users may need elevated permissions for system-level changes.
{{/if}}

**Windows**: Run PowerShell as Administrator
**macOS/Linux**: Use \`sudo\` for system commands

## Verification

Check your environment setup:

\`\`\`bash
# Check shell
echo $SHELL

# Check PATH
echo $PATH

# Check environment variables
{{#if environment.required}}
{{#each environment.required}}
echo \${{this}}
{{/each}}
{{/if}}
\`\`\`

---

For environment-related issues, see [troubleshooting guide](../troubleshooting/common-issues.md).
`;

    return templateEngine.render(template, context);
  }
}

module.exports = new SetupDocsGenerator();
