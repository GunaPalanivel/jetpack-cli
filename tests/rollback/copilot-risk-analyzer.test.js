const analyzer = require('../../src/rollback/copilot-risk-analyzer');
const childProcess = require('child_process');
const assert = require('assert');

// Mock child_process.execSync
const originalExecSync = childProcess.execSync;
let mockExecSyncResponse = '';
childProcess.execSync = (command, options) => {
    if (command.includes('gh --version')) {
        return 'gh version 2.40.0';
    }
    return mockExecSyncResponse;
};

// Test Suite
async function runTests() {
    console.log('🧪 Testing Copilot Risk Analyzer...');

    try {
        // Test 1: Assess Risks
        console.log('Test 1: Assess Risks...');

        mockExecSyncResponse = JSON.stringify({
            highRisk: ['Uninstalling database'],
            warnings: ['Data loss potential'],
            precautions: ['Backup DB dump']
        });

        const risks = await analyzer.assessRisks(
            { installedPackages: ['postgres'], sshKeys: true },
            { unsafe: true }
        );

        assert.strictEqual(risks.highRisk[0], 'Uninstalling database');
        assert.strictEqual(risks.precautions[0], 'Backup DB dump');
        console.log('  ✓ Risks assessed correctly');

        // Test 2: Fallback
        console.log('Test 2: Fallback on Error...');
        childProcess.execSync = () => { throw new Error('Copilot failed'); };

        const fallback = await analyzer.assessRisks({}, {});
        assert.ok(fallback.warnings[0].includes('Could not analyze'));
        console.log('  ✓ Fallback handled correctly');

        console.log('\n✅ All risk analyzer tests passed!');
    } catch (error) {
        console.error('\n❌ Tests failed:', error);
        process.exit(1);
    } finally {
        // Restore mocks
        childProcess.execSync = originalExecSync;
    }
}

runTests();
