const fs = require('fs');
const path = require('path');
const copilot = require('../integrations/copilot-wrapper');
const logger = require('../ui/logger');

/**
 * Codebase Analyzer
 * 
 * Scans the repository to understand its structure, languages, and frameworks.
 * Uses both static analysis (file extensions, package.json) and AI (Copilot)
 * to generate deep insights for documentation.
 */
class CodebaseAnalyzer {
    /**
     * Analyze the codebase
     * @param {string} rootDir - Root directory of the project
     * @returns {Promise<object>} Analysis result
     */
    async analyze(rootDir) {
        logger.info('  → Analyzing codebase structure...');

        const analysis = {
            languages: this.detectLanguages(rootDir),
            frameworks: this.detectFrameworks(rootDir),
            structure: this.scanStructure(rootDir),
            summary: await this.generateSummary(rootDir)
        };

        logger.info(`  → Detected: ${analysis.languages.join(', ')}`);
        if (analysis.frameworks.length > 0) {
            logger.info(`  → Frameworks: ${analysis.frameworks.join(', ')}`);
        }

        return analysis;
    }

    /**
     * Detect programming languages based on file extensions
     * @private
     */
    detectLanguages(rootDir) {
        const languages = new Set();

        try {
            const files = this._getAllFiles(rootDir, 2); // Depth 2

            files.forEach(file => {
                const ext = path.extname(file).toLowerCase();
                if (ext === '.js' || ext === '.jsx') languages.add('JavaScript');
                if (ext === '.ts' || ext === '.tsx') languages.add('TypeScript');
                if (ext === '.py') languages.add('Python');
                if (ext === '.java') languages.add('Java');
                if (ext === '.go') languages.add('Go');
                if (ext === '.rs') languages.add('Rust');
                if (ext === '.rb') languages.add('Ruby');
                if (ext === '.php') languages.add('PHP');
                if (ext === '.cs') languages.add('C#');
            });
        } catch (error) {
            logger.warning(`  ⚠️  Language detection failed: ${error.message}`);
        }

        return Array.from(languages);
    }

    /**
     * Detect frameworks based on manifest files
     * @private
     */
    detectFrameworks(rootDir) {
        const frameworks = new Set();

        // Node.js frameworks
        const packageJsonPath = path.join(rootDir, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            try {
                const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

                if (allDeps.react) frameworks.add('React');
                if (allDeps.vue) frameworks.add('Vue');
                if (allDeps.angular) frameworks.add('Angular');
                if (allDeps.express) frameworks.add('Express');
                if (allDeps.next) frameworks.add('Next.js');
                if (allDeps.nuxt) frameworks.add('Nuxt');
                if (allDeps.nest) frameworks.add('NestJS');
                if (allDeps.jest) frameworks.add('Jest');
            } catch (e) { /* ignore */ }
        }

        // Python frameworks
        const requirementsPath = path.join(rootDir, 'requirements.txt');
        if (fs.existsSync(requirementsPath)) {
            try {
                const content = fs.readFileSync(requirementsPath, 'utf8');
                if (content.includes('django')) frameworks.add('Django');
                if (content.includes('flask')) frameworks.add('Flask');
                if (content.includes('fastapi')) frameworks.add('FastAPI');
            } catch (e) { /* ignore */ }
        }

        return Array.from(frameworks);
    }

    /**
     * Scan directory structure
     * @private
     */
    scanStructure(rootDir) {
        try {
            return fs.readdirSync(rootDir, { withFileTypes: true })
                .filter(dirent => !dirent.name.startsWith('.'))
                .map(dirent => ({
                    name: dirent.name,
                    type: dirent.isDirectory() ? 'directory' : 'file'
                }))
                .slice(0, 20); // Limit to top 20 items
        } catch (error) {
            return [];
        }
    }

    /**
     * Generate AI summary of the codebase using Copilot
     * @private
     */
    async generateSummary(rootDir) {
        if (!copilot.isAvailable) {
            return 'Codebase analysis not available (Copilot disabled)';
        }

        logger.info('  → Asking Copilot to analyze architecture...');

        // Identify key file for context
        let contextFile = 'package.json';
        if (fs.existsSync(path.join(rootDir, 'requirements.txt'))) contextFile = 'requirements.txt';
        if (fs.existsSync(path.join(rootDir, 'go.mod'))) contextFile = 'go.mod';
        if (fs.existsSync(path.join(rootDir, 'pom.xml'))) contextFile = 'pom.xml';

        try {
            // Read a snippet of the context file
            const content = fs.readFileSync(path.join(rootDir, contextFile), 'utf8').slice(0, 1000);

            // Ask Copilot
            const prompt = `explain the architecture of a project with this dependency file: ${content}`;
            const summary = copilot.explain(prompt);

            return summary || 'No summary generated';
        } catch (error) {
            return 'Failed to analyze project structure';
        }
    }

    /**
     * Recursive file scanner (limited depth)
     * @private
     */
    _getAllFiles(dir, depth, currentDepth = 0) {
        if (currentDepth > depth) return [];

        let results = [];
        try {
            const list = fs.readdirSync(dir);
            list.forEach(file => {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                if (stat && stat.isDirectory()) {
                    if (!file.startsWith('.') && file !== 'node_modules') {
                        results = results.concat(this._getAllFiles(filePath, depth, currentDepth + 1));
                    }
                } else {
                    results.push(filePath);
                }
            });
        } catch (e) { /* ignore */ }
        return results;
    }
}

module.exports = new CodebaseAnalyzer();
