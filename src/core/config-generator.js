const logger = require('../ui/logger');
const fs = require('fs');
const path = require('path');
const utils = require('./config-utils');

/**
 * Configuration Generator Module
 * 
 * Generates configuration files from .onboard.yaml manifests:
 * - P0: .env files (template, example, actual) with merge mode
 * - P1: SSH keys (ed25519, no passphrase)
 * - P2: Git config (user.name, user.email, defaultBranch)
 * 
 * Features:
 * - Continue-on-failure error handling
 * - Dry-run mode support
 * - Copilot CLI integration for value generation
 * - Cross-platform compatibility
 */
class ConfigGenerator {
  /**
   * Generate all configurations from manifest
   * @param {object} manifest - Parsed manifest
   * @param {object} environment - Detected environment
   * @param {object} options - Command options
   * @returns {Promise<object>} Generation results
   */
  async generateConfigs(manifest, environment, options = {}) {
    logger.newLine();
    logger.info('⚙️  Generating Configurations...');
    logger.separator();
    
    const results = {
      env: { created: [], failed: [], warnings: [] },
      ssh: { created: [], failed: [], warnings: [] },
      git: { created: [], failed: [], warnings: [] }
    };
    
    const projectRoot = process.cwd();
    
    try {
      // P0: Generate .env files
      if (manifest.environment) {
        logger.step(1, 'Environment Files');
        const envResults = await this.generateEnvFiles(
          manifest,
          projectRoot,
          options
        );
        Object.assign(results.env, envResults);
      } else {
        logger.info('  → No environment variables defined');
      }
      
      // TODO: P1 - SSH key generation (Commit 2)
      // TODO: P2 - Git config setup (Commit 3)
      
    } catch (error) {
      results.env.failed.push({
        file: 'general',
        reason: error.message
      });
    }
    
    // Display summary
    this.displaySummary(results, options);
    
    return {
      generated: this.calculateSummary(results).created > 0,
      files: results,
      summary: this.calculateSummary(results)
    };
  }
  
  /**
   * P0: Generate .env files (template, example, actual)
   * @param {object} manifest - Parsed manifest
   * @param {string} projectRoot - Project root directory
   * @param {object} options - Command options
   * @returns {Promise<object>} ENV generation results
   * @private
   */
  async generateEnvFiles(manifest, projectRoot, options) {
    const results = { created: [], failed: [], warnings: [] };
    const { dryRun } = options;
    
    // Normalize environment variables (handle both formats)
    const envVars = this.normalizeEnvironmentVars(manifest.environment);
    const allVars = [...envVars.required, ...envVars.optional];
    
    if (allVars.length === 0) {
      logger.warning('  → No environment variables to generate');
      return results;
    }
    
    logger.info(`  → Variables: ${envVars.required.length} required, ${envVars.optional.length} optional`);
    
    try {
      // Generate .env.template
      await this.createEnvTemplate(projectRoot, allVars, envVars, dryRun, results);
      
      // Generate .env.example
      await this.createEnvExample(projectRoot, allVars, envVars, manifest, dryRun, results);
      
      // Generate/merge .env (actual file)
      await this.createOrMergeEnv(projectRoot, allVars, envVars, manifest, dryRun, results);
      
      // Update .gitignore
      this.updateGitignore(projectRoot, dryRun, results);
      
    } catch (error) {
      results.failed.push({
        file: '.env',
        reason: error.message
      });
    }
    
    return results;
  }
  
  /**
   * Normalize environment variables from manifest
   * Handles both array format and object format
   * @param {Array|object} envConfig - Environment config from manifest
   * @returns {object} { required: [], optional: [], defaults: {} }
   * @private
   */
  normalizeEnvironmentVars(envConfig) {
    if (Array.isArray(envConfig)) {
      // Simple array format - all are required
      return {
        required: envConfig,
        optional: [],
        defaults: {}
      };
    }
    
    // Object format with required/optional/defaults
    return {
      required: envConfig.required || [],
      optional: envConfig.optional || [],
      defaults: envConfig.defaults || {}
    };
  }
  
  /**
   * Create .env.template file (with ${VAR} placeholders)
   * @private
   */
  async createEnvTemplate(projectRoot, allVars, envVars, dryRun, results) {
    const templatePath = path.join(projectRoot, '.env.template');
    
    if (dryRun) {
      logger.info(`  [DRY RUN] Would create: .env.template`);
      results.created.push('.env.template');
      return;
    }
    
    let content = '# Environment Variables Template\n';
    content += '# Copy to .env and fill in actual values\n\n';
    
    // Required variables
    if (envVars.required.length > 0) {
      content += '# Required Variables\n';
      for (const varName of envVars.required) {
        const explanation = await utils.getCopilotExplanation(varName);
        content += `# ${explanation}\n`;
        content += `${varName}=\${${varName}}\n\n`;
      }
    }
    
    // Optional variables
    if (envVars.optional.length > 0) {
      content += '# Optional Variables\n';
      for (const varName of envVars.optional) {
        content += `# ${varName}=\${${varName}}\n`;
      }
    }
    
    try {
      fs.writeFileSync(templatePath, content, 'utf8');
      logger.success('  ✓ Created .env.template');
      results.created.push('.env.template');
    } catch (error) {
      logger.error(`  ✗ Failed to create .env.template: ${error.message}`);
      results.failed.push({ file: '.env.template', reason: error.message });
    }
  }
  
  /**
   * Create .env.example file (with example values and comments)
   * @private
   */
  async createEnvExample(projectRoot, allVars, envVars, manifest, dryRun, results) {
    const examplePath = path.join(projectRoot, '.env.example');
    
    if (dryRun) {
      logger.info(`  [DRY RUN] Would create: .env.example`);
      results.created.push('.env.example');
      return;
    }
    
    let content = '# Environment Variables Example\n';
    content += '# This file shows example values and formats\n\n';
    
    // Required variables with examples
    if (envVars.required.length > 0) {
      content += '# Required Variables\n';
      for (const varName of envVars.required) {
        const explanation = await utils.getCopilotExplanation(varName);
        content += `# ${explanation}\n`;
        
        // Generate example value
        let exampleValue = '';
        if (varName.includes('URL')) {
          exampleValue = 'postgresql://user:password@localhost:5432/dbname';
        } else if (varName.includes('KEY') || varName.includes('SECRET')) {
          exampleValue = 'your_secret_key_here';
        } else if (varName.includes('PORT')) {
          exampleValue = '3000';
        } else if (varName.includes('EMAIL')) {
          exampleValue = 'user@example.com';
        } else {
          exampleValue = 'value_here';
        }
        
        content += `${varName}=${exampleValue}\n\n`;
      }
    }
    
    // Optional variables with defaults
    if (envVars.optional.length > 0) {
      content += '# Optional Variables (with defaults)\n';
      for (const varName of envVars.optional) {
        const defaultValue = envVars.defaults[varName] || '';
        content += `# ${varName}=${defaultValue || 'optional'}\n`;
      }
    }
    
    try {
      fs.writeFileSync(examplePath, content, 'utf8');
      logger.success('  ✓ Created .env.example');
      results.created.push('.env.example');
    } catch (error) {
      logger.error(`  ✗ Failed to create .env.example: ${error.message}`);
      results.failed.push({ file: '.env.example', reason: error.message });
    }
  }
  
  /**
   * Create or merge .env file (actual values)
   * @private
   */
  async createOrMergeEnv(projectRoot, allVars, envVars, manifest, dryRun, results) {
    const envPath = path.join(projectRoot, '.env');
    const exists = fs.existsSync(envPath);
    
    if (dryRun) {
      if (exists) {
        logger.info(`  [DRY RUN] Would merge: .env (preserving existing values)`);
      } else {
        logger.info(`  [DRY RUN] Would create: .env`);
      }
      results.created.push('.env');
      return;
    }
    
    let content = '';
    let mergeResult = null;
    
    if (exists) {
      // Backup existing .env
      const backupPath = utils.backupFile(envPath);
      if (backupPath) {
        logger.info(`  → Backed up to: ${path.basename(backupPath)}`);
      }
      
      // Read existing content
      const existingContent = fs.readFileSync(envPath, 'utf8');
      
      // Build new variables object
      const newVars = {};
      for (const varName of allVars) {
        // Try to generate suggested value with Copilot
        let value = '';
        if (envVars.required.includes(varName)) {
          // Generate suggested value for required vars
          if (varName.includes('KEY') || varName.includes('SECRET')) {
            value = await utils.generateCopilotValue(varName, 'api_key');
          } else if (varName.includes('URL')) {
            value = await utils.generateCopilotValue(varName, 'database_url');
          }
        } else {
          // Use defaults for optional vars
          value = envVars.defaults[varName] || '';
        }
        newVars[varName] = value;
      }
      
      // Merge with existing
      mergeResult = utils.mergeEnvFile(existingContent, newVars);
      content = mergeResult.content;
      
      logger.success(`  ✓ Merged .env`);
      logger.info(`    → Added: ${mergeResult.added.length} variables`);
      logger.info(`    → Preserved: ${mergeResult.preserved.length} existing values`);
      
    } else {
      // Create new .env file
      content = '# Environment Variables\n';
      content += '# Generated by Jetpack CLI\n\n';
      
      // Add required variables with suggested values
      if (envVars.required.length > 0) {
        content += '# Required Variables\n';
        for (const varName of envVars.required) {
          const explanation = await utils.getCopilotExplanation(varName);
          content += `# ${explanation}\n`;
          
          // Generate value with Copilot or fallback
          let value = '';
          if (varName.includes('KEY') || varName.includes('SECRET')) {
            value = await utils.generateCopilotValue(varName, 'api_key');
          } else if (varName.includes('URL')) {
            value = await utils.generateCopilotValue(varName, 'database_url');
          }
          
          content += `${varName}=${value}\n\n`;
        }
      }
      
      // Add optional variables with defaults
      if (envVars.optional.length > 0) {
        content += '# Optional Variables\n';
        envVars.optional.forEach(varName => {
          const value = envVars.defaults[varName] || '';
          content += `${varName}=${value}\n`;
        });
      }
      
      logger.success('  ✓ Created .env');
    }
    
    try {
      fs.writeFileSync(envPath, content, 'utf8');
      results.created.push('.env');
    } catch (error) {
      logger.error(`  ✗ Failed to write .env: ${error.message}`);
      results.failed.push({ file: '.env', reason: error.message });
    }
  }
  
  /**
   * Update .gitignore with .env entries
   * @private
   */
  updateGitignore(projectRoot, dryRun, results) {
    if (dryRun) {
      logger.info('  [DRY RUN] Would update: .gitignore');
      return;
    }
    
    const entries = [
      '.env',
      '.env.local',
      '.env.*.local',
      '.jetpack-state.json',
      '.env.backup.*'
    ];
    
    const result = utils.updateGitignore(projectRoot, entries);
    
    if (result.added.length > 0) {
      logger.success(`  ✓ Updated .gitignore (${result.added.length} entries added)`);
    } else {
      logger.info('  → .gitignore already up-to-date');
    }
  }
  
  /**
   * Calculate summary statistics
   * @param {object} results - Generation results
   * @returns {object} Summary statistics
   * @private
   */
  calculateSummary(results) {
    const total = {
      created: 0,
      failed: 0,
      warnings: 0
    };
    
    ['env', 'ssh', 'git'].forEach(type => {
      if (results[type]) {
        total.created += results[type].created.length;
        total.failed += results[type].failed.length;
        total.warnings += results[type].warnings.length;
      }
    });
    
    return total;
  }
  
  /**
   * Display summary of configuration generation
   * @param {object} results - Generation results
   * @param {object} options - Command options
   * @private
   */
  displaySummary(results, options) {
    const summary = this.calculateSummary(results);
    
    logger.separator();
    logger.header('📊 Configuration Summary');
    
    if (options.dryRun) {
      logger.warning('⚠️  DRY RUN - No files were actually created');
    }
    
    logger.newLine();
    logger.info(`✓ Created: ${summary.created} file(s)`);
    
    if (summary.warnings > 0) {
      logger.warning(`⚠️  Warnings: ${summary.warnings}`);
    }
    
    if (summary.failed > 0) {
      logger.warning(`⚠️  Failed: ${summary.failed} file(s)`);
      logger.newLine();
      logger.info('Failed files:');
      
      ['env', 'ssh', 'git'].forEach(type => {
        if (results[type] && results[type].failed.length > 0) {
          logger.info(`  ${type}:`);
          results[type].failed.forEach(fail => {
            logger.warning(`    - ${fail.file}: ${fail.reason}`);
          });
        }
      });
    }
    
    logger.newLine();
    
    if (summary.failed === 0 && summary.created > 0) {
      logger.success('✅ All configurations generated!');
    } else if (summary.failed > 0) {
      logger.warning('⚠️  Some configurations failed to generate');
      logger.info('   Review errors above and fix manually if needed');
    }
  }
}

module.exports = new ConfigGenerator();
