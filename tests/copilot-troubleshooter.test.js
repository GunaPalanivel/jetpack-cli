const troubleshooter = require('../src/core/copilot-troubleshooter');
const childProcess = require('child_process');
const assert = require('assert');

// Mock child_process.execSync
const originalExecSync = childProcess.execSync;
let mockExecSyncResponse = '';
let mockExecSyncError = null;

childProcess.execSync = (command, options) => {
    if (command.includes('gh --version')) {
        return 'gh version 2.40.0';
    }
    if (mockExecSyncError) {
        throw mockExecSyncError;
    }
    return mockExecSyncResponse;
};

// Test Suite
async function runTests() {
    console.log('🧪 Testing Copilot Troubleshooter...');

    try {
        // Test 1: Analyze Failed
        console.log('Test 1: Analyze Failed Error...');
        mockExecSyncResponse = JSON.stringify({
            cause: 'Node version mismatch',
            fix: 'Upgrade Node.js',
            command: 'nvm install 18',
            prevention: 'Use .nvmrc'
        });

        const analysis = await troubleshooter.analyzeFailed(
            { type: 'npm', message: 'Engine incompatible' },
            { os: 'linux', nodeVersion: '14.0.0', failedStep: 'install' }
        );

        assert.strictEqual(analysis.cause, 'Node version mismatch');
        assert.strictEqual(analysis.command, 'nvm install 18');
        console.log('  ✓ Analysis correct');

        // Test 2: Port Conflict
        console.log('Test 2: Port Conflict Resolution...');
        mockExecSyncResponse = JSON.stringify({
            command: 'lsof -i :3000 | xargs kill',
            explanation: 'Finds and kills process on port 3000'
        });

        const portFix = await troubleshooter.resolvePortConflict(3000, { os: 'darwin' });
        assert.ok(portFix.command.includes('kill'));
        console.log('  ✓ Port fix command suggested');

        // Test 3: Suggest Alternative
        console.log('Test 3: Suggest Alternatives...');
        mockExecSyncResponse = JSON.stringify([
            { name: 'axios', reason: 'Better maintenance' },
            { name: 'got', reason: 'Lightweight' }
        ]);

        const alternatives = await troubleshooter.suggestAlternative('request', 'Deprecated');
        assert.strictEqual(alternatives.length, 2);
        assert.strictEqual(alternatives[0].name, 'axios');
        console.log('  ✓ Alternatives suggested');

        // Test 4: Error Handling
        console.log('Test 4: GH CLI missing/error...');
        mockExecSyncError = new Error('Command failed');
        const failureAnalysis = await troubleshooter.analyzeFailed(
            { type: 'test', message: 'error' },
            {}
        );
        assert.strictEqual(failureAnalysis.cause, 'Manual diagnosis required');
        console.log('  ✓ Error handling correct');

        console.log('\n✅ All troubleshooter tests passed!');
    } catch (error) {
        console.error('\n❌ Tests failed:', error);
        process.exit(1);
    } finally {
        // Restore execSync
        childProcess.execSync = originalExecSync;
    }
}

runTests();
