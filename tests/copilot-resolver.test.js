const resolver = require('../src/core/copilot-resolver');
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
    console.log('🧪 Testing Copilot Resolver...');

    try {
        // Test 1: Version Conflict
        console.log('Test 1: Version Conflict Resolution...');
        mockExecSyncResponse = JSON.stringify({
            action: 'Upgrade',
            command: 'npm install react@18',
            warnings: 'Breaking changes in v18',
            alternative: 'Stay on v17'
        });

        const resolution = await resolver.resolveVersionConflict('react', '18.0.0', '17.0.2');

        assert.strictEqual(resolution.action, 'Upgrade');
        assert.strictEqual(resolution.command, 'npm install react@18');
        console.log('  ✓ Resolution suggestion correct');

        // Test 2: Peer Dependencies
        console.log('Test 2: Peer Dependencies...');
        mockExecSyncResponse = JSON.stringify({
            command: 'npm install peer-dep@2',
            explanation: 'Installs missing peer dependency'
        });

        const peerFix = await resolver.suggestPeerDependencies('my-lib', 'Missing peer-dep');
        assert.strictEqual(peerFix.command, 'npm install peer-dep@2');
        console.log('  ✓ Peer dep fix suggested');

        // Test 3: Fallback on Error
        console.log('Test 3: Fallback on Error...');
        mockExecSyncError = new Error('Command failed');
        const fallback = await resolver.resolveVersionConflict('pkg', '1.0', '2.0');
        assert.strictEqual(fallback.action, 'Manual resolution');
        console.log('  ✓ Fallback mechanism works');

        console.log('\n✅ All resolver tests passed!');
    } catch (error) {
        console.error('\n❌ Tests failed:', error);
        process.exit(1);
    } finally {
        // Restore execSync
        childProcess.execSync = originalExecSync;
    }
}

runTests();
