const path = require('path');
const fs = require('fs').promises;
const templateEngine = require('../core/TemplateEngine');
const contentBuilder = require('../core/ContentBuilder');

/**
 * VerificationDocsGenerator - Generates verification and health check documentation
 */
class VerificationDocsGenerator {
  /**
   * Generate verification documentation
   * @param {object} context - Documentation context
   * @param {string} outputDir - Output directory path
   * @param {object} options - Generation options
   * @returns {Promise<array>} Array of generated file paths
   */
  async generate(context, outputDir, options = {}) {
    const files = [];
    const sectionDir = path.join(outputDir, 'verification');

    // Generate health-checks.md
    const healthPath = path.join(sectionDir, 'health-checks.md');
    const healthContent = this._generateHealthChecks(context);
    await fs.writeFile(healthPath, healthContent, 'utf8');
    files.push(healthPath);

    // Generate manual-testing.md
    const manualPath = path.join(sectionDir, 'manual-testing.md');
    const manualContent = this._generateManualTesting(context);
    await fs.writeFile(manualPath, manualContent, 'utf8');
    files.push(manualPath);

    return files;
  }

  /**
   * Generate health checks documentation
   * @private
   */
  _generateHealthChecks(context) {
    const template = `# ✅ Health Checks

Automated verification checks for **{{project.name}}**.

{{#if verification}}
## Current Status

${contentBuilder.buildVerificationSummary(context.verification)}

{{/if}}

## Automated Verification

Run all health checks:

\`\`\`bash
jetpack verify
\`\`\`

This command automatically verifies:
- All dependencies are installed and accessible
- Configuration files exist and are valid
- Required services are running
- Environment variables are set correctly

## Check Types

### Command Checks

Verifies that required commands are available and executable.

Example checks:
{{#if dependencies.system}}
{{#each dependencies.system}}
\`\`\`bash
{{this}} --version
\`\`\`
{{/each}}
{{/if}}

{{#if dependencies.npm}}
\`\`\`bash
npm list -g --depth=0
\`\`\`
{{/if}}

### HTTP Checks

Verifies that web services are running and responding.

\`\`\`bash
# Check if service is responding
curl -I http://localhost:3000/health
\`\`\`

### Port Checks

Verifies that required ports are open and listening.

\`\`\`bash
# Check if port is listening
netstat -an | grep PORT
\`\`\`

### File Checks

Verifies that configuration files exist and contain expected content.

{{#if config}}
{{#if config.envFile}}
\`\`\`bash
# Check .env file
test -f .env && echo ".env exists"
\`\`\`
{{/if}}

{{#if config.sshKey}}
\`\`\`bash
# Check SSH key
test -f {{config.sshKey}} && echo "SSH key exists"
\`\`\`
{{/if}}
{{/if}}

## Interpreting Results

### ✅ Success

All checks passed - your environment is ready!

\`\`\`
✅ All verification checks passed (12/12)
\`\`\`

### ⚠️ Warnings

Some non-critical checks failed - review and fix if needed.

\`\`\`
⚠️ 2 checks failed (10/12 successful)
\`\`\`

### ❌ Failure

Critical checks failed - setup is incomplete.

\`\`\`
❌ 5 checks failed (7/12 successful)
\`\`\`

## Troubleshooting Failed Checks

If checks fail, see:
- [Verification Failures Guide](../troubleshooting/verification-failures.md) for specific fixes
- [Common Issues](../troubleshooting/common-issues.md) for general troubleshooting

## Verbose Mode

Get detailed information about each check:

\`\`\`bash
jetpack verify --verbose
\`\`\`

This shows:
- Exact commands being run
- Full output from each check
- Detailed error messages
- Timing information

## Custom Verification

You can define custom checks in your \`.onboard.yaml\`:

\`\`\`yaml
verification:
  checks:
    # Command check
    - type: command
      command: docker --version
      expected_output: "Docker version"
      tags: [critical]
      
    # HTTP check
    - type: http
      url: http://localhost:3000/health
      expected_status: 200
      tags: [service]
      
    # Port check
    - type: port
      port: 3000
      host: localhost
      tags: [service]
      
    # File check
    - type: file
      path: .env
      should_exist: true
      contains: "DATABASE_URL"
      tags: [config]
\`\`\`

## Continuous Verification

Add verification to your workflow:

\`\`\`bash
# Before starting work
jetpack verify && npm start

# In CI/CD pipeline
jetpack verify --json > verification-results.json
\`\`\`

## Health Check Schedule

Recommended verification frequency:
- **After setup**: Immediately after \`jetpack init\`
- **Daily**: Before starting development
- **After updates**: When dependencies or config changes
- **In CI**: On every pull request

---

For manual testing procedures, see [manual testing guide](manual-testing.md).
`;

    return templateEngine.render(template, context);
  }

  /**
   * Generate manual testing documentation
   * @private
   */
  _generateManualTesting(context) {
    const template = `# 🧪 Manual Testing

Manual verification procedures for **{{project.name}}**.

## Pre-Flight Checklist

Before running the application, verify:

{{#if dependencies.system}}
### System Dependencies

{{#each dependencies.system}}
- [ ] \`{{this}}\` is installed and in PATH
  \`\`\`bash
  {{this}} --version
  \`\`\`
{{/each}}
{{/if}}

{{#if dependencies.npm}}
### Node.js Dependencies

- [ ] npm packages are installed globally
  \`\`\`bash
  npm list -g --depth=0
  \`\`\`
{{/if}}

{{#if dependencies.python}}
### Python Dependencies

- [ ] Python packages are installed
  \`\`\`bash
  pip list
  \`\`\`
{{/if}}

{{#if config}}
### Configuration

{{#if config.envFile}}
- [ ] \`.env\` file exists and is populated
  \`\`\`bash
  cat .env
  \`\`\`
{{/if}}

{{#if config.sshKey}}
- [ ] SSH key is generated and loaded
  \`\`\`bash
  ssh-add -l
  \`\`\`
{{/if}}

{{#if config.gitUser}}
- [ ] Git user is configured
  \`\`\`bash
  git config user.name && git config user.email
  \`\`\`
{{/if}}
{{/if}}

{{#if environment.required}}
### Environment Variables

{{#each environment.required}}
- [ ] \`{{this}}\` is set
  \`\`\`bash
  echo ${{this}}
  \`\`\`
{{/each}}
{{/if}}

## Setup Steps Testing

{{#if setupSteps}}
Verify each setup step completes successfully:

${contentBuilder.buildSetupStepsList(context.setupSteps)}

{{/if}}

## Functional Testing

### Basic Functionality

Test core features manually:

1. **Start the application**
   \`\`\`bash
   npm start
   # or appropriate start command
   \`\`\`

2. **Access the application**
   - Open browser to \`http://localhost:PORT\`
   - Verify homepage loads correctly

3. **Test key features**
   - Create/read/update/delete operations
   - Authentication (if applicable)
   - API endpoints (if applicable)

### Integration Testing

Test integrations with external services:

1. **Database connection**
   \`\`\`bash
   # Test database connection
   npm run db:test
   \`\`\`

2. **API connectivity**
   \`\`\`bash
   # Test external API calls
   curl http://localhost:PORT/api/health
   \`\`\`

3. **Third-party services**
   - Test authentication providers
   - Test payment gateways
   - Test notification services

## Common Test Scenarios

### Scenario 1: Fresh Install

1. Run \`jetpack init\`
2. Verify all dependencies install
3. Verify configuration generates
4. Run \`jetpack verify\`
5. Start application
6. Test basic functionality

### Scenario 2: Configuration Changes

1. Modify \`.env\` file
2. Restart application
3. Verify changes take effect
4. Run \`jetpack verify\`

### Scenario 3: Dependency Updates

1. Update package versions
2. Run installation
3. Run test suite
4. Verify functionality

## Smoke Tests

Quick tests to verify basic functionality:

\`\`\`bash
# Test 1: Application starts
npm start &
sleep 5
curl http://localhost:PORT

# Test 2: Health endpoint
curl http://localhost:PORT/health

# Test 3: Database connection
npm run db:ping

# Test 4: Environment loaded
echo $DATABASE_URL
\`\`\`

## Performance Testing

Basic performance checks:

\`\`\`bash
# Response time test
time curl http://localhost:PORT

# Load test (if ab is installed)
ab -n 100 -c 10 http://localhost:PORT/

# Memory usage
ps aux | grep node
\`\`\`

## Security Checks

Verify security measures:

1. **Secrets not exposed**
   \`\`\`bash
   # .env should not be in git
   git status --ignored | grep .env
   \`\`\`

2. **HTTPS in production**
   - Verify SSL certificates
   - Test HTTPS redirects

3. **Authentication**
   - Test login/logout
   - Verify token expiration
   - Test password reset

## Regression Testing

After making changes, verify:

- [ ] Existing features still work
- [ ] No new errors in console
- [ ] Tests pass: \`npm test\`
- [ ] Verification passes: \`jetpack verify\`

## Rollback Testing

Test rollback functionality:

\`\`\`bash
# Create backup
cp .env .env.backup

# Make changes
# Test changes
# If issues, rollback
cp .env.backup .env

# Or use jetpack rollback
jetpack rollback
\`\`\`

## Logging and Monitoring

Check logs for errors:

\`\`\`bash
# Application logs
tail -f logs/app.log

# System logs (Linux)
journalctl -u <service-name> -f

# Windows Event Viewer
Get-EventLog -LogName Application -Newest 50
\`\`\`

## Documentation Testing

Verify documentation accuracy:

- [ ] All commands in docs are correct
- [ ] All links work
- [ ] Screenshots are up-to-date
- [ ] Examples are executable

## Reporting Issues

If manual tests fail:

1. Document exact steps to reproduce
2. Capture error messages and logs
3. Note environment details (OS, versions)
4. Check [troubleshooting guide](../troubleshooting/common-issues.md)
5. File an issue with reproduction steps

---

For automated health checks, see [health checks guide](health-checks.md).
`;

    return templateEngine.render(template, context);
  }
}

module.exports = new VerificationDocsGenerator();
