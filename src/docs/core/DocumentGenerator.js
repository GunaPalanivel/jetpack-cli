const fs = require('fs').promises;
const path = require('path');
const templateEngine = require('./TemplateEngine');
const contentBuilder = require('./ContentBuilder');
const logger = require('../../ui/logger');

/**
 * DocumentGenerator - Main orchestrator for documentation generation
 * Coordinates template rendering, content building, and file writing
 */
class DocumentGenerator {
  /**
   * Generate documentation for a project
   * @param {object} manifest - Parsed manifest object
   * @param {object} state - Orchestrator state with step results
   * @param {object} options - Generation options
   * @returns {Promise<object>} Generation result {generated: boolean, files: array}
   */
  async generate(manifest, state, options = {}) {
    try {
      // Get documentation config from manifest (with defaults)
      const docConfig = this._getDocConfig(manifest);

      if (!docConfig.enabled) {
        logger.info('  → Documentation generation disabled in manifest');
        return { generated: false, files: [], reason: 'Disabled in manifest' };
      }

      // Build context from manifest and state
      const context = this._buildContext(manifest, state, options);

      // Determine output directory
      const outputDir = this._resolveOutputDir(docConfig.output_dir, options);

      if (options.dryRun) {
        return this._dryRunPreview(docConfig, context, outputDir);
      }

      // Create output directory structure (only for enabled sections)
      await this._createDirectories(outputDir, docConfig.sections);

      // Generate documentation files
      const files = [];
      const generators = this._getGenerators();

      for (const section of docConfig.sections) {
        const generator = generators[section];
        
        if (!generator) {
          logger.warning(`  → Unknown documentation section: ${section}`);
          continue;
        }

        try {
          const generatedFiles = await generator.generate(context, outputDir, options);
          files.push(...generatedFiles);
        } catch (error) {
          logger.warning(`  → Failed to generate ${section} docs: ${error.message}`);
          // Continue with other sections
        }
      }

      logger.success(`  → Generated ${files.length} documentation file(s)`);

      return {
        generated: true,
        files,
        outputDir
      };

    } catch (error) {
      logger.error(`  → Documentation generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get documentation config with defaults
   * @private
   */
  _getDocConfig(manifest) {
    const defaults = {
      enabled: true,
      output_dir: './docs',
      sections: ['getting-started', 'setup', 'troubleshooting', 'verification'],
      custom: {}
    };

    if (!manifest.documentation) {
      return defaults;
    }

    return {
      enabled: manifest.documentation.enabled !== false,
      output_dir: manifest.documentation.output_dir || defaults.output_dir,
      sections: manifest.documentation.sections || defaults.sections,
      custom: manifest.documentation.custom || {}
    };
  }

  /**
   * Build context object for template rendering
   * @private
   */
  _buildContext(manifest, state, options) {
    const context = {
      project: {
        name: manifest.name || 'Unknown Project',
        description: manifest.description || '',
        repoUrl: state.repoUrl || '',
        ...manifest.documentation?.custom
      },
      dependencies: {
        system: manifest.dependencies?.system || [],
        npm: manifest.dependencies?.npm || [],
        python: manifest.dependencies?.python || []
      },
      environment: {
        required: manifest.environment?.required || [],
        optional: manifest.environment?.optional || []
      },
      setupSteps: manifest.setup_steps || [],
      config: this._extractConfigInfo(state),
      verification: this._extractVerificationInfo(state),
      platform: {
        os: options.environment?.os || process.platform,
        shell: this._detectShell(options.environment?.os)
      },
      timestamp: new Date().toISOString()
    };

    return context;
  }

  /**
   * Extract configuration info from state
   * @private
   */
  _extractConfigInfo(state) {
    const configStep = state.steps?.find(s => s.name === 'Generate Configurations');
    
    if (!configStep || !configStep.result) {
      return null;
    }

    const result = configStep.result;
    const config = {};

    if (result.env && result.env.generated) {
      const varCount = result.env.variables?.length || 0;
      config.envFile = `.env (${varCount} variable${varCount !== 1 ? 's' : ''})`;
    }

    if (result.ssh && result.ssh.generated) {
      config.sshKey = result.ssh.keyPath || '~/.ssh/id_ed25519';
    }

    if (result.git && result.git.configured) {
      config.gitUser = `${result.git.name || 'Unknown'} <${result.git.email || 'unknown@example.com'}>`;
    }

    return Object.keys(config).length > 0 ? config : null;
  }

  /**
   * Extract verification info from state
   * @private
   */
  _extractVerificationInfo(state) {
    const verifyStep = state.steps?.find(s => s.name === 'Verify Setup');
    
    if (!verifyStep || !verifyStep.result || verifyStep.result.skipped) {
      return null;
    }

    const result = verifyStep.result;
    
    return {
      checks: result.totalChecks || 0,
      passed: result.passedChecks || 0,
      failed: result.failedChecks || 0
    };
  }

  /**
   * Detect shell based on OS
   * @private
   */
  _detectShell(os) {
    const platform = os || process.platform;
    if (platform === 'win32' || platform === 'Windows_NT') return 'powershell';
    if (platform === 'darwin' || platform === 'Darwin') return 'zsh';
    return 'bash';
  }

  /**
   * Resolve output directory path
   * @private
   */
  _resolveOutputDir(outputDir, options) {
    // If absolute path, use as-is
    if (path.isAbsolute(outputDir)) {
      return outputDir;
    }

    // Relative to project root (current working directory)
    return path.resolve(process.cwd(), outputDir);
  }

  /**
   * Create directory structure for documentation
   * @private
   */
  async _createDirectories(outputDir, sections) {
    const dirs = [outputDir];
    
    // Only create directories for enabled sections
    for (const section of sections) {
      dirs.push(path.join(outputDir, section));
    }

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Get generator instances
   * @private
   */
  _getGenerators() {
    return {
      'getting-started': require('../generators/GettingStartedGenerator'),
      'setup': require('../generators/SetupDocsGenerator'),
      'troubleshooting': require('../generators/TroubleshootingGenerator'),
      'verification': require('../generators/VerificationDocsGenerator')
    };
  }

  /**
   * Dry run preview - show what would be generated
   * @private
   */
  _dryRunPreview(docConfig, context, outputDir) {
    logger.info('  → Dry run mode - documentation that would be generated:');
    logger.info(`  → Output directory: ${outputDir}`);
    logger.info(`  → Sections: ${docConfig.sections.join(', ')}`);
    
    const estimatedFiles = docConfig.sections.flatMap(section => {
      const fileMap = {
        'getting-started': ['quickstart.md', 'prerequisites.md'],
        'setup': ['dependencies.md', 'configuration.md', 'environment.md'],
        'troubleshooting': ['common-issues.md', 'verification-failures.md'],
        'verification': ['health-checks.md', 'manual-testing.md']
      };
      
      return (fileMap[section] || []).map(file => path.join(outputDir, section, file));
    });

    estimatedFiles.forEach(file => logger.info(`  →   ${file}`));

    return {
      generated: false,
      dryRun: true,
      files: estimatedFiles,
      outputDir
    };
  }
}

module.exports = new DocumentGenerator();
