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
  .action(async (repoUrl, options) => {
    try {
      await initCommand(repoUrl, options);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// jetpack verify
program
  .command('verify')
  .description('Verify all dependencies and configurations are correctly installed')
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
  .description('Rollback the last onboarding session')
  .option('-s, --state <file>', 'Path to state file', '.jetpack-state.json')
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
