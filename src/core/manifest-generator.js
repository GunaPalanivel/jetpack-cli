const fs = require('fs');
const path = require('path');
const logger = require('../ui/logger');

/**
 * Manifest Generator
 * 
 * Analyzes repository structure and uses GitHub Copilot
 * to generate a comprehensive .onboard.yaml manifest.
 */
class ManifestGenerator {
    /**
     * Analyze repository and generate .onboard.yaml
     * @param {string} repoPath - Path to repository root
     * @returns {Promise<string>} Generated YAML content
     */
    async generateFromRepo(repoPath) {
        logger.info('  🔍 Analyzing repository structure...');
        const analysis = this.analyzeRepository(repoPath);

        const prompt = `
      Analyze this project and generate a .onboard.yaml manifest:
      
      Files found:
      - package.json: ${analysis.hasPackageJson}
      - requirements.txt: ${analysis.hasPython}
      - Dockerfile: ${analysis.hasDocker}
      - README.md: ${analysis.hasReadme}
      
      Package.json scripts: ${JSON.stringify(analysis.scripts)}
      
      Generate YAML with:
      1. name and description (infer from package.json or folder name)
      2. dependencies (system, npm, python)
      3. setup_steps (based on scripts, e.g. install, build, test)
      4. environment variables (infer from code or .env.example)
      
      Return ONLY valid YAML format. Start with "name:".
    `;

        logger.info('  🤖 Asking Copilot to generate manifest...');
        try {
            const yaml = await this.callCopilot(prompt);
            // Clean up markdown code blocks if present
            return yaml.replace(/```yaml/g, '').replace(/```/g, '').trim();
        } catch (error) {
            logger.error(`Failed to generate manifest: ${error.message}`);
            throw error;
        }
    }

    /**
     * Analyze repository files to provide context
     */
    analyzeRepository(repoPath) {
        const analysis = {
            hasPackageJson: false,
            hasPython: false,
            hasDocker: false,
            hasReadme: false,
            scripts: {}
        };

        try {
            if (fs.existsSync(path.join(repoPath, 'package.json'))) {
                analysis.hasPackageJson = true;
                const pkg = JSON.parse(fs.readFileSync(path.join(repoPath, 'package.json'), 'utf8'));
                analysis.scripts = pkg.scripts || {};
            }

            if (fs.existsSync(path.join(repoPath, 'requirements.txt'))) {
                analysis.hasPython = true;
            }

            if (fs.existsSync(path.join(repoPath, 'Dockerfile'))) {
                analysis.hasDocker = true;
            }

            if (fs.existsSync(path.join(repoPath, 'README.md'))) {
                analysis.hasReadme = true;
            }
        } catch (e) {
            logger.warning(`Analysis warning: ${e.message}`);
        }

        return analysis;
    }

    async callCopilot(prompt) {
        const safePrompt = prompt.replace(/"/g, '\\"');

        try {
            require('child_process').execSync('gh --version', { stdio: 'ignore' });
        } catch (e) {
            throw new Error('GitHub CLI (gh) not installed');
        }

        return require('child_process').execSync(`gh copilot -p "${safePrompt}"`, {
            encoding: 'utf-8',
            timeout: 45000 // Higher timeout for generation
        });
    }
}

module.exports = new ManifestGenerator();
