const resolver = require('../src/core/copilot-resolver');
const childProcess = require('child_process');

jest.mock('child_process');

describe('Copilot Resolver', () => {

    beforeEach(() => {
        childProcess.execSync.mockReset();
        childProcess.execSync.mockImplementation((command) => {
            if (command.includes('gh --version')) {
                return 'gh version 2.40.0';
            }
            return '';
        });
    });

    test('Version Conflict Resolution', async () => {
        childProcess.execSync.mockReturnValue(JSON.stringify({
            action: 'Upgrade',
            command: 'npm install react@18',
            warnings: 'Breaking changes in v18',
            alternative: 'Stay on v17'
        }));

        const resolution = await resolver.resolveVersionConflict('react', '18.0.0', '17.0.2');

        expect(resolution.action).toBe('Upgrade');
        expect(resolution.command).toBe('npm install react@18');
    });

    test('Peer Dependencies', async () => {
        childProcess.execSync.mockReturnValue(JSON.stringify({
            command: 'npm install peer-dep@2',
            explanation: 'Installs missing peer dependency'
        }));

        const peerFix = await resolver.suggestPeerDependencies('my-lib', 'Missing peer-dep');
        expect(peerFix.command).toBe('npm install peer-dep@2');
    });

    test('Fallback on Error', async () => {
        childProcess.execSync.mockImplementation((cmd) => {
            if (cmd.includes('gh --version')) return 'gh version 2.40.0';
            throw new Error('Command failed');
        });

        const fallback = await resolver.resolveVersionConflict('pkg', '1.0', '2.0');
        expect(fallback.action).toBe('Manual resolution');
    });

});
