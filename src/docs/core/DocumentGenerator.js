/**
 * DocumentGenerator.js
 * Generates project documentation from manifest and state
 */
const fs = require('fs').promises;
const path = require('path');
const templateEngine = require('./TemplateEngine');
const contentBuilder = require('./ContentBuilder');
const codebaseAnalyzer = require('../codebase-analyzer');
const troubleshooter = require('../../core/copilot-troubleshooter');

class DocumentGenerator {
    /**
     * Generate documentation for the project
     * @param {object} manifest - Parsed manifest
     * @param {object} state - Execution state
     * @param {object} options - CLI options
     */
    async generate(manifest, state, options) {
        // Check if documentation is enabled
        if (manifest.documentation && manifest.documentation.enabled === false) {
            return {
                generated: false,
                files: [],
                reason: 'Disabled in manifest'
            };
        }

        const outputDir = (manifest.documentation && (manifest.documentation.outputDir || manifest.documentation.output_dir)) || './docs';
        const dryRun = options.dryRun || false;
        const environment = options.environment || {};

        // Determine sections to generate
        const allSections = ['getting-started', 'setup', 'troubleshooting', 'verification', 'configuration'];
        const sections = (manifest.documentation && manifest.documentation.sections) || allSections;

        // Build context for templates
        const analysis = await codebaseAnalyzer.analyze(process.cwd());
        const context = this._buildContext(manifest, state, environment, analysis);

        // Fetch Copilot Troubleshooting Issues
        if (sections.includes('troubleshooting')) {
            try {
                context.troubleshootingIssues = await troubleshooter.generateCommonIssues(context.dependencies);
            } catch (e) {
                context.troubleshootingIssues = [];
            }
        }

        const files = [];

        // Ensure output directories exist
        if (!dryRun) {
            const dirs = [
                outputDir,
                path.join(outputDir, 'getting-started'),
                path.join(outputDir, 'setup'),
                path.join(outputDir, 'troubleshooting'),
                path.join(outputDir, 'verification')
            ];

            for (const dir of dirs) {
                try {
                    await fs.mkdir(dir, { recursive: true });
                } catch (err) {
                    throw new Error(`Failed to create directory ${dir}: ${err.message}`);
                }
            }
        }

        // 1. Root Index
        const indexContent = `# ${context.projectName} Documentation

${context.description}

## Installation
\`\`\`bash
npm install
\`\`\`
`;
        await this._writeFile(path.join(outputDir, 'index.md'), indexContent, dryRun);
        files.push(path.join(outputDir, 'index.md'));

        // 2. Getting Started - Quickstart
        if (sections.includes('getting-started')) {
            const content = this._generateQuickstart(context);
            const filePath = path.join(outputDir, 'getting-started', 'quickstart.md');
            await this._writeFile(filePath, content, dryRun);
            files.push(filePath);
        }

        // 3. Getting Started - Prerequisites
        if (sections.includes('getting-started')) {
            const content = this._generatePrerequisites(context);
            const filePath = path.join(outputDir, 'getting-started', 'prerequisites.md');
            await this._writeFile(filePath, content, dryRun);
            files.push(filePath);
        }

        // 4. Setup - Dependencies
        if (sections.includes('setup')) {
            const content = this._generateDependencies(context);
            const filePath = path.join(outputDir, 'setup', 'dependencies.md');
            await this._writeFile(filePath, content, dryRun);
            files.push(filePath);
        }

        // 5. Setup - Configuration
        if (sections.includes('setup') || sections.includes('configuration')) {
            const content = this._generateConfiguration(context);
            const filePath = path.join(outputDir, 'setup', 'configuration.md');
            await this._writeFile(filePath, content, dryRun);
            files.push(filePath);
        }

        // 6. Setup - Environment
        if (sections.includes('setup')) {
            const content = this._generateEnvironment(context);
            const filePath = path.join(outputDir, 'setup', 'environment.md');
            await this._writeFile(filePath, content, dryRun);
            files.push(filePath);
        }

        // 7. Setup - Guide
        if (sections.includes('setup')) {
            const content = this._generateSetup(context);
            const filePath = path.join(outputDir, 'setup', 'setup.md');
            await this._writeFile(filePath, content, dryRun);
            files.push(filePath);
        }

        // 8. Troubleshooting - Common Issues
        if (sections.includes('troubleshooting')) {
            const content = this._generateTroubleshooting(context);
            const filePath = path.join(outputDir, 'troubleshooting', 'common-issues.md');
            await this._writeFile(filePath, content, dryRun);
            files.push(filePath);
        }

        // 9. Verification - Health Checks
        if (sections.includes('verification')) {
            const content = this._generateVerification(context);
            const filePath = path.join(outputDir, 'verification', 'health-checks.md');
            await this._writeFile(filePath, content, dryRun);
            files.push(filePath);
        }

        return {
            generated: true,
            files: files,
            outputDir: outputDir,
            dryRun: dryRun
        };
    }

    /**
     * Helper to write file or log in dry run
     * @private
     */
    async _writeFile(filePath, content, dryRun) {
        if (dryRun) {
            return;
        }
        await fs.writeFile(filePath, content, 'utf8');
    }

    /**
     * Build context object for templates
     * @private
     */
    _buildContext(manifest, state, environment, analysis = {}) {
        const configStep = state.steps.find(s => s.name === 'Generate Configurations');
        const configResult = configStep ? configStep.result : {};

        const verifyStep = state.steps.find(s => s.name === 'Verify Setup');
        const verifyResult = verifyStep ? verifyStep.result : {};

        return {
            projectName: manifest.name,
            description: manifest.description || 'No description provided',
            dependencies: manifest.dependencies || {},
            setupSteps: manifest.setupSteps || [],
            environment: manifest.environment || {},
            platform: environment.os || 'Unknown',
            config: {
                envFile: configResult.env && configResult.env.variables ? `.env (${configResult.env.variables.length} variables)` : null,
                sshKey: configResult.ssh ? (configResult.ssh.keyPath) : null,
                gitUser: configResult.git ? (configResult.git.name ? `${configResult.git.name} <${configResult.git.email}>` : null) : null
            },
            verification: verifyResult,
            analysis: analysis
        };
    }

    _generateQuickstart(context) {
        return `# 🚀 Quickstart Guide

Welcome to the **${context.projectName}** quickstart.

## Overview
${context.description}

## Quick Start
1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Run setup:
   \`\`\`bash
   npm run setup
   \`\`\`

## Prerequisites
Ensure strict dependencies involved: docker, nodejs.

## Environment Exists
Check for ${contentBuilder.buildEnvironmentList(context.environment)}.
`;
    }

    _generatePrerequisites(context) {
        return `# Prerequisites

Ensure you have the following tools installed:

${contentBuilder.buildEnvironmentList(context.environment)}

## Version Check
\`\`\`bash
node -v
\`\`\`
`;
    }

    _generateDependencies(context) {
        return `# 📦 Dependencies

The following packages are required:

${contentBuilder.buildDependencyTable(context.dependencies)}

## Install
\`\`\`bash
npm install
\`\`\`
`;
    }

    _generateConfiguration(context) {
        return `# Configuration

## Environment Variables
${contentBuilder.buildEnvironmentList(context.environment)}

## Generated Configs
${contentBuilder.buildConfigSummary(context.config)}

## Check Config
\`\`\`bash
cat .env
\`\`\`
`;
    }

    _generateEnvironment(context) {
        return `# Environment Setup

## Platform Support
Current platform: ${context.platform}

### Windows
${contentBuilder.buildPlatformNote('Windows_NT')}

### macOS
${contentBuilder.buildPlatformNote('Darwin')}

### Linux
${contentBuilder.buildPlatformNote('Linux')}

## Check Platform
\`\`\`bash
echo $SHELL
\`\`\`
`;
    }

    _generateTroubleshooting(context) {
        let content = `# 🔧 Common Issues\n\n`;

        if (context.troubleshootingIssues && context.troubleshootingIssues.length > 0) {
            content += `## 🤖 AI Suggested Solutions\n`;
            context.troubleshootingIssues.forEach(item => {
                content += `### ${item.issue}\n${item.fix}\n\n`;
            });
            content += `---\n\n`;
        }

        content += `## Installation
If \`npm install\` fails, check your network connection.

## Configuration
Ensure your .env file is valid.

## Debug
\`\`\`bash
npm run debug
\`\`\`
`;
        return content;
    }

    _generateVerification(context) {
        return `# ✅ Health Checks

Run \`jetpack verify\` to validate your environment.

\`\`\`bash
jetpack verify
\`\`\`

${contentBuilder.buildVerificationSummary(context.verification)}
`;
    }

    _generateSetup(context) {
        return `# Setup Guide

Follow these steps to set up the project:

${contentBuilder.buildSetupStepsList(context.setupSteps)}

## Verify Setup
\`\`\`bash
npm test
\`\`\`
`;
    }
}

module.exports = new DocumentGenerator();
