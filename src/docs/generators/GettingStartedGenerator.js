const path = require("path");
const fs = require("fs").promises;
const templateEngine = require("../core/TemplateEngine");
const contentBuilder = require("../core/ContentBuilder");

/**
 * GettingStartedGenerator - Generates quickstart and prerequisites documentation
 */
class GettingStartedGenerator {
  /**
   * Generate getting started documentation
   * @param {object} context - Documentation context
   * @param {string} outputDir - Output directory path
   * @param {object} options - Generation options
   * @returns {Promise<array>} Array of generated file paths
   */
  async generate(context, outputDir, options = {}) {
    const files = [];
    const sectionDir = path.join(outputDir, "getting-started");

    // Generate quickstart.md
    const quickstartPath = path.join(sectionDir, "quickstart.md");
    const quickstartContent = this._generateQuickstart(context);
    await fs.writeFile(quickstartPath, quickstartContent, "utf8");
    files.push(quickstartPath);

    // Generate prerequisites.md
    const prerequisitesPath = path.join(sectionDir, "prerequisites.md");
    const prerequisitesContent = this._generatePrerequisites(context);
    await fs.writeFile(prerequisitesPath, prerequisitesContent, "utf8");
    files.push(prerequisitesPath);

    return files;
  }

  /**
   * Generate quickstart guide
   * @private
   */
  _generateQuickstart(context) {
    const template = `# 🚀 Quickstart Guide

Get started with **{{project.name}}** in 5 minutes.

## Overview

{{project.description}}

## Quick Setup

### 1. Install Dependencies

{{#if dependencies.system}}
System dependencies:
{{#each dependencies.system}}
- \`{{this}}\`
{{/each}}
{{/if}}

{{#if dependencies.npm}}
npm packages:
\`\`\`bash
npm install {{dependencies.npm}}
\`\`\`
{{/if}}

{{#if dependencies.python}}
Python packages:
\`\`\`bash
pip install {{dependencies.python}}
\`\`\`
{{/if}}

### 2. Configure Environment

{{#if environment.required}}
Set up required environment variables in \`.env\`:

{{#each environment.required}}
- \`{{this}}\`
{{/each}}
{{/if}}

{{#if config}}
Configuration files created:
${contentBuilder.buildConfigSummary(context.config)}
{{/if}}

### 3. Verify Installation

Run verification checks to ensure everything is set up correctly:

\`\`\`bash
jetpack verify
\`\`\`

{{#if verification}}
${contentBuilder.buildVerificationSummary(context.verification)}
{{/if}}

## Next Steps

- Review [detailed setup instructions](../setup/dependencies.md)
- Check [troubleshooting guide](../troubleshooting/common-issues.md) if you encounter issues
- Run [health checks](../verification/health-checks.md) to validate your setup

---

${contentBuilder.buildPlatformNote(context.platform.os)}
`;

    return templateEngine.render(template, context);
  }

  /**
   * Generate prerequisites documentation
   * @private
   */
  _generatePrerequisites(context) {
    const template = `# 📋 Prerequisites

Before setting up **{{project.name}}**, ensure your system meets these requirements.

## System Requirements

### Operating System

This project supports:
- **Windows** 10/11 (PowerShell 5.1+)
- **macOS** 11+ (Monterey or later)
- **Linux** (Ubuntu 20.04+, Debian 11+, or equivalent)

Your system: **{{platform.os}}**

### Required Software

The following software must be installed:

{{#if dependencies.system}}
${contentBuilder.buildDependencyTable(context.dependencies)}
{{/if}}

{{#if dependencies.npm}}
#### Node.js & npm

- **Node.js**: 16.x or higher
- **npm**: 8.x or higher

Check your versions:
\`\`\`bash
node --version
npm --version
\`\`\`
{{/if}}

{{#if dependencies.python}}
#### Python

- **Python**: 3.8 or higher
- **pip**: Latest version

Check your version:
\`\`\`bash
python --version
pip --version
\`\`\`
{{/if}}

## Environment Setup

{{#if environment.required}}
### Required Environment Variables

You'll need to configure these variables:

{{#each environment.required}}
- **\`{{this}}\`** - (Description needed)
{{/each}}
{{/if}}

{{#if environment.optional}}
### Optional Environment Variables

These variables are optional but recommended:

{{#each environment.optional}}
- **\`{{this}}\`** - (Description needed)
{{/each}}
{{/if}}

## Verification

After installing prerequisites, verify your setup:

\`\`\`bash
# Check Node.js
node --version

# Check npm
npm --version

{{#if dependencies.system}}
# Check system dependencies
{{#each dependencies.system}}
{{this}} --version
{{/each}}
{{/if}}
\`\`\`

## Troubleshooting

If you're missing any prerequisites:

- **Windows**: Use [Chocolatey](https://chocolatey.org/) or [Scoop](https://scoop.sh/)
- **macOS**: Use [Homebrew](https://brew.sh/)
- **Linux**: Use your distribution's package manager (apt, yum, dnf)

For detailed installation instructions, see [setup documentation](../setup/dependencies.md).

---

${contentBuilder.buildPlatformNote(context.platform.os)}
`;

    return templateEngine.render(template, context);
  }
}

module.exports = new GettingStartedGenerator();
