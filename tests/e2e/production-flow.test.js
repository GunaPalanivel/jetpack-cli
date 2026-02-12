const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const logger = require('../../src/ui/logger');

/**
 * Production Flow E2E Test
 * 
 * Simulates a real user running 'jetpack init' in a directory.
 * - Uses a temporary test directory
 * - Runs the CLI process
 * - Verifies file creation (.env, README)
 * - Verifies state file
 */
async function runProductionTest() {
    logger.header('🏭 E2E Test: Production Workflow');

    const testDir = path.join(__dirname, 'sandbox');
    const binPath = path.join(__dirname, '../../bin/jetpack.js');
    const templatePath = path.join(__dirname, 'test-manifest.yaml');

    // Cleanup & Setup
    if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir);

    // Copy template to sandbox
    const manifestPath = path.join(testDir, '.onboard.yaml');
    fs.copyFileSync(templatePath, manifestPath);

    logger.info(`1. Sandbox created at: ${testDir}`);

    // Run CLI process
    logger.info('2. executing "jetpack init" ...');

    return new Promise((resolve, reject) => {
        // We use --skip-install to avoid polluting the global system, 
        // but the rest of the flow (config, docs, intelligence) runs for real.
        const child = spawn('node', [binPath, 'init', 'https://github.com/example/repo', '-m', '.onboard.yaml', '--skip-install'], {
            cwd: testDir,
            stdio: 'inherit', // Pipe output so we can see it
            env: { ...process.env, FORCE_COLOR: '1' }
        });

        child.on('close', (code) => {
            logger.newLine();
            if (code !== 0) {
                logger.error(`❌ CLI process exited with code ${code}`);
                reject(new Error('CLI failed'));
                return;
            }
            logger.success('✓ CLI process completed successfully');
            verifyResults(testDir).then(resolve).catch(reject);
        });
    });
}

async function verifyResults(testDir) {
    logger.info('\n3. Verifying artifacts...');
    const errors = [];

    // Check .env.example (auto-generated from manifest)
    if (fs.existsSync(path.join(testDir, '.env.example'))) {
        logger.success('✓ .env.example created');
    } else {
        errors.push('.env.example missing');
    }

    // Check Documentation
    const docsDir = path.join(testDir, 'docs');
    if (fs.existsSync(docsDir) && fs.readdirSync(docsDir).length > 0) {
        logger.success(`✓ docs/ created with ${fs.readdirSync(docsDir).length} files`);
    } else {
        errors.push('docs/ directory missing or empty');
    }

    // Check JSON State
    if (fs.existsSync(path.join(testDir, '.jetpack-state.json'))) {
        logger.success('✓ .jetpack-state.json created');
    } else {
        errors.push('State file missing');
    }

    if (errors.length > 0) {
        logger.error('❌ Verification failed:');
        errors.forEach(e => logger.error(`   - ${e}`));
        throw new Error('Artifact verification failed');
    }

    logger.newLine();
    logger.success('🎉 Production E2E test passed!');
}

runProductionTest().catch(err => {
    logger.error('\n❌ Test failed:', err.message);
    process.exit(1);
});
