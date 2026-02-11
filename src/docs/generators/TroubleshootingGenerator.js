const path = require('path');
const fs = require('fs').promises;
const templateEngine = require('../core/TemplateEngine');
const contentBuilder = require('../core/ContentBuilder');

/**
 * TroubleshootingGenerator - Generates troubleshooting documentation
 */
class TroubleshootingGenerator {
  /**
   * Generate troubleshooting documentation
   * @param {object} context - Documentation context
   * @param {string} outputDir - Output directory path
   * @param {object} options - Generation options
   * @returns {Promise<array>} Array of generated file paths
   */
  async generate(context, outputDir, options = {}) {
    const files = [];
    const sectionDir = path.join(outputDir, 'troubleshooting');

    // Generate common-issues.md
    const issuesPath = path.join(sectionDir, 'common-issues.md');
    const issuesContent = this._generateCommonIssues(context);
    await fs.writeFile(issuesPath, issuesContent, 'utf8');
    files.push(issuesPath);

    // Generate verification-failures.md
    const verificationPath = path.join(sectionDir, 'verification-failures.md');
    const verificationContent = this._generateVerificationFailures(context);
    await fs.writeFile(verificationPath, verificationContent, 'utf8');
    files.push(verificationPath);

    return files;
  }

  /**
   * Generate common issues documentation
   * @private
   */
  _generateCommonIssues(context) {
    const template = `# 🔧 Common Issues

Solutions to common problems when setting up **{{project.name}}**.

## Dependency Installation Issues

### npm packages fail to install

**Problem**: \`npm install\` fails with permission errors or network issues.

**Solutions**:

1. **Permission errors** (Windows):
   \`\`\`powershell
   # Run PowerShell as Administrator
   npm install -g <package>
   \`\`\`

2. **Permission errors** (macOS/Linux):
   \`\`\`bash
   # Don't use sudo - fix npm permissions instead
   mkdir ~/.npm-global
   npm config set prefix '~/.npm-global'
   echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.profile
   source ~/.profile
   \`\`\`

3. **Network issues**:
   \`\`\`bash
   # Clear npm cache
   npm cache clean --force
   
   # Try different registry
   npm config set registry https://registry.npmjs.org/
   \`\`\`

{{#if dependencies.python}}
### Python package installation fails

**Problem**: \`pip install\` fails with version conflicts or missing dependencies.

**Solutions**:

1. **Upgrade pip**:
   \`\`\`bash
   python -m pip install --upgrade pip
   \`\`\`

2. **Use virtual environment**:
   \`\`\`bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\\Scripts\\activate
   pip install {{dependencies.python}}
   \`\`\`

3. **Install missing system dependencies** (Linux):
   \`\`\`bash
   sudo apt-get install python3-dev build-essential
   \`\`\`
{{/if}}

{{#if dependencies.system}}
### System packages not found

**Problem**: System dependencies are not recognized after installation.

**Solutions**:

1. **Refresh PATH**:
   \`\`\`bash
   # Windows: Restart PowerShell
   # macOS/Linux: Reload shell config
   source ~/.bashrc  # or ~/.zshrc
   \`\`\`

2. **Verify installation**:
   {{#each dependencies.system}}
   \`\`\`bash
   which {{this}}  # Unix
   where.exe {{this}}  # Windows
   \`\`\`
   {{/each}}

3. **Reinstall package manager**:
   - Windows: Reinstall Chocolatey/Scoop
   - macOS: \`/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"\`
   - Linux: \`sudo apt update && sudo apt upgrade\`
{{/if}}

## Configuration Issues

### Environment variables not loading

**Problem**: \`.env\` file exists but variables aren't accessible.

**Solutions**:

1. **Check file location**:
   \`\`\`bash
   ls -la .env  # Should be in project root
   \`\`\`

2. **Load variables manually**:
   \`\`\`bash
   # Bash/Zsh
   export $(cat .env | xargs)
   
   # PowerShell
   Get-Content .env | ForEach-Object { 
     $name, $value = $_.split('=')
     [Environment]::SetEnvironmentVariable($name, $value, "Process")
   }
   \`\`\`

3. **Restart your terminal** after setting variables.

{{#if config.sshKey}}
### SSH key not working

**Problem**: SSH authentication fails despite key generation.

**Solutions**:

1. **Add key to ssh-agent**:
   \`\`\`bash
   eval "$(ssh-agent -s)"
   ssh-add {{config.sshKey}}
   \`\`\`

2. **Verify permissions** (Unix):
   \`\`\`bash
   chmod 700 ~/.ssh
   chmod 600 {{config.sshKey}}
   chmod 644 {{config.sshKey}}.pub
   \`\`\`

3. **Add public key to GitHub/GitLab**:
   \`\`\`bash
   cat {{config.sshKey}}.pub
   # Copy output and add to your account settings
   \`\`\`
{{/if}}

{{#if config.gitUser}}
### Git commands fail with identity errors

**Problem**: Git operations fail due to missing user configuration.

**Solutions**:

1. **Verify git config**:
   \`\`\`bash
   git config --global user.name
   git config --global user.email
   \`\`\`

2. **Set manually if needed**:
   \`\`\`bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   \`\`\`
{{/if}}

## Platform-Specific Issues

${contentBuilder.buildPlatformNote(context.platform.os)}

### Windows Issues

- **Execution policy errors**: \`Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned\`
- **Long path errors**: Enable long paths: \`New-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force\`
- **PowerShell version**: Upgrade to PowerShell 7+ for best compatibility

### macOS Issues

- **Command not found**: Add to PATH: \`echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.zshrc\`
- **Xcode tools missing**: \`xcode-select --install\`
- **Homebrew permissions**: \`sudo chown -R $(whoami) /usr/local/Homebrew\`

### Linux Issues

- **Sudo password required**: Add to sudoers for package manager commands
- **Package conflicts**: \`sudo apt-get autoremove && sudo apt-get autoclean\`
- **Missing libraries**: \`sudo apt-get install build-essential\`

## Getting Help

If you're still experiencing issues:

1. Check [verification failures](verification-failures.md) for specific check errors
2. Review [setup documentation](../setup/dependencies.md) for installation details
3. Run diagnostics: \`jetpack verify --verbose\`
4. Search existing GitHub issues or create a new one

## Logs and Debugging

Enable verbose logging:
\`\`\`bash
jetpack init <repo> --verbose
\`\`\`

Check state file for errors:
\`\`\`bash
cat .jetpack-state.json
\`\`\`

---

_Last updated: {{timestamp}}_
`;

    return templateEngine.render(template, context);
  }

  /**
   * Generate verification failures documentation
   * @private
   */
  _generateVerificationFailures(context) {
    const template = `# ⚠️ Verification Failures

How to fix failed verification checks for **{{project.name}}**.

{{#if verification}}
## Your Verification Status

${contentBuilder.buildVerificationSummary(context.verification)}

{{/if}}

## Common Verification Failures

### Command Checks Failed

**Problem**: \`command\` type checks fail because a tool is not found or returns an error.

**Solutions**:

1. **Tool not in PATH**:
   \`\`\`bash
   # Find the tool
   which <tool-name>  # Unix
   where.exe <tool-name>  # Windows
   
   # Add to PATH if found
   export PATH="$PATH:/path/to/tool"  # Unix
   $env:PATH += ";C:\\path\\to\\tool"  # Windows
   \`\`\`

2. **Tool not installed**:
   {{#if dependencies.system}}
   \`\`\`bash
   # Reinstall system dependencies
   {{#each dependencies.system}}
   # Install {{this}}
   {{/each}}
   \`\`\`
   {{/if}}

3. **Version mismatch**:
   \`\`\`bash
   # Check required version in manifest
   <tool-name> --version
   \`\`\`

### HTTP Checks Failed

**Problem**: \`http\` checks fail due to service unavailability or network issues.

**Solutions**:

1. **Service not running**:
   \`\`\`bash
   # Check if service is running
   curl http://localhost:PORT
   
   # Start the service
   npm start  # or appropriate start command
   \`\`\`

2. **Wrong port or URL**:
   - Verify URL in verification check matches your configuration
   - Check \`.env\` file for correct PORT settings

3. **Firewall blocking**:
   - Allow port in firewall settings
   - Check antivirus software blocking local connections

### Port Checks Failed

**Problem**: \`port\` checks fail because a port is not listening or is blocked.

**Solutions**:

1. **Service not started**:
   \`\`\`bash
   # Start the service that should be listening
   npm run dev  # or appropriate command
   \`\`\`

2. **Port already in use**:
   \`\`\`bash
   # Find what's using the port (Unix)
   lsof -i :PORT
   
   # Find what's using the port (Windows)
   netstat -ano | findstr :PORT
   
   # Kill the process or use a different port
   \`\`\`

3. **Incorrect port number**:
   - Check manifest verification config
   - Verify service is configured to use the expected port

### File Checks Failed

**Problem**: \`file\` checks fail because files don't exist or have wrong permissions.

**Solutions**:

1. **File missing**:
   \`\`\`bash
   # Check if file exists
   ls -la /path/to/file  # Unix
   dir /path/to/file  # Windows
   
   # Create file if needed
   touch /path/to/file  # Unix
   New-Item -Path /path/to/file -ItemType File  # Windows
   \`\`\`

2. **Wrong permissions** (Unix):
   \`\`\`bash
   # Fix permissions
   chmod 644 /path/to/file  # For regular files
   chmod 755 /path/to/file  # For executables
   \`\`\`

3. **Wrong content**:
   - Check expected content patterns in verification manifest
   - Ensure file contains required strings or format

{{#if config}}
## Configuration-Related Failures

{{#if config.envFile}}
### Missing environment variables

Check your \`.env\` file contains all required variables:

{{#if environment.required}}
{{#each environment.required}}
- \`{{this}}\`
{{/each}}
{{/if}}

\`\`\`bash
# Regenerate .env from template
cp .env.template .env
# Edit .env and fill in values
\`\`\`
{{/if}}

{{#if config.sshKey}}
### SSH key issues

Verify SSH key:
\`\`\`bash
ssh-add -l  # List loaded keys
ssh -T git@github.com  # Test GitHub connection
\`\`\`
{{/if}}
{{/if}}

## Debugging Verification

### Run checks individually

\`\`\`bash
jetpack verify --verbose
\`\`\`

### Check verification manifest

Review your \`.onboard.yaml\`:
\`\`\`yaml
verification:
  checks:
    - type: command
      command: <tool-name> --version
    - type: http
      url: http://localhost:3000
    # ... other checks
\`\`\`

### Manual verification

Run checks manually to see detailed errors:

\`\`\`bash
# Test command
<command-to-check>

# Test HTTP endpoint
curl -I http://localhost:PORT

# Check port
netstat -an | grep PORT
\`\`\`

## Re-running Verification

After fixing issues, re-run verification:

\`\`\`bash
jetpack verify
\`\`\`

Or re-run full setup:

\`\`\`bash
jetpack init {{project.repoUrl}}
\`\`\`

## Still Failing?

1. Review [common issues](common-issues.md) for general troubleshooting
2. Check [setup documentation](../setup/dependencies.md) for installation requirements
3. Enable debug logging: \`jetpack verify --verbose --debug\`
4. Check \`.jetpack-state.json\` for error details

---

_Last updated: {{timestamp}}_
`;

    return templateEngine.render(template, context);
  }
}

module.exports = new TroubleshootingGenerator();
