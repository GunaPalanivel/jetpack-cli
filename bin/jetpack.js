#!/usr/bin/env node

const { program } = require('commander');

// Import commands
const initCommand = require('../src/cli/commands/init');
const verifyCommand = require('../src/cli/commands/verify');
const rollbackCommand = require('../src/cli/commands/rollback');

// Configure CLI
program
  .name('jetpack')
  .version('1.0.0')
  .description('🚀 Zero-config developer onboarding orchestrator powered by GitHub Copilot CLI');

// jetpack init <repo-url>
program
  .command('init <repo-url>')
  .description('Initialize developer environment from repository')
  .option('-m, --manifest <file>', 'Path to .onboard.yaml manifest', '.onboard.yaml')
  .option('--no-cache', 'Skip manifest cache, always fetch fresh')
  .option('--skip-install', 'Skip dependency installation')
  .option('--dry-run', 'Show what would be installed without executing')
  .option('--copilot-generate', 'Generate manifest using Copilot (for local repos)')
  .action(async (repoUrl, options) => {
    try {
      await initCommand(repoUrl, options);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// jetpack generate-manifest
program
  .command('generate-manifest')
  .description('Generate .onboard.yaml from repository analysis')
  .option('--copilot', 'Use GitHub Copilot to analyze repo')
  .action(async (options) => {
    try {
      if (!options.copilot) {
        console.error('❌ Error: --copilot flag is required');
        process.exit(1);
      }
      const generator = require('../src/core/manifest-generator');
      const fs = require('fs');
      const path = require('path');
      const yaml = await generator.generateFromRepo(process.cwd());

      const outputPath = path.join(process.cwd(), '.onboard.yaml');
      fs.writeFileSync(outputPath, yaml);
      console.log(`✅ Generated ${outputPath}`);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// jetpack verify
program
  .command('verify')
  .description('Verify all dependencies and configurations are correctly installed')
  .option('--copilot-troubleshoot', 'Use GitHub Copilot to analyze failures')
  .action(async (options) => {
    try {
      await verifyCommand(options);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// jetpack rollback
program
  .command('rollback')
  .description('Rollback all Jetpack changes')
  .option('--check-risks', 'Use Copilot to analyze rollback risks')
  .option('--dry-run', 'Preview changes without executing')
  .option('--partial <phases>', 'Rollback specific phases (docs,config,ssh,git,dependencies)')
  .option('--unsafe', 'Allow package uninstallation')
  .option('--force', 'Skip safety checks (dangerous)')
  .action(async (options) => {
    try {
      await rollbackCommand(options);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
