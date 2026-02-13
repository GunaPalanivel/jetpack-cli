const troubleshooter = require('../src/core/copilot-troubleshooter');
const childProcess = require('child_process');

// Mock child_process.execSync
jest.mock('child_process');

describe('Copilot Troubleshooter', () => {

    beforeEach(() => {
        childProcess.execSync.mockReset();
        // Default behavior for version checks
        childProcess.execSync.mockImplementation((command) => {
            if (command.includes('gh --version')) {
                return 'gh version 2.40.0';
            }
            return '';
        });
    });

    test('Analyze Failed Error', async () => {
        childProcess.execSync.mockReturnValue(JSON.stringify({
            cause: 'Node version mismatch',
            fix: 'Upgrade Node.js',
            command: 'nvm install 18',
            prevention: 'Use .nvmrc'
        }));

        const analysis = await troubleshooter.analyzeFailed(
            { type: 'npm', message: 'Engine incompatible' },
            { os: 'linux', nodeVersion: '14.0.0', failedStep: 'install' }
        );

        expect(analysis.cause).toBe('Node version mismatch');
        expect(analysis.command).toBe('nvm install 18');
    });

    test('Port Conflict Resolution', async () => {
        childProcess.execSync.mockReturnValue(JSON.stringify({
            command: 'lsof -i :3000 | xargs kill',
            explanation: 'Finds and kills process on port 3000'
        }));

        const portFix = await troubleshooter.resolvePortConflict(3000, { os: 'darwin' });
        expect(portFix.command).toContain('kill');
    });

    test('Suggest Alternatives', async () => {
        childProcess.execSync.mockReturnValue(JSON.stringify([
            { name: 'axios', reason: 'Better maintenance' },
            { name: 'got', reason: 'Lightweight' }
        ]));

        const alternatives = await troubleshooter.suggestAlternative('request', 'Deprecated');
        expect(alternatives.length).toBe(2);
        expect(alternatives[0].name).toBe('axios');
    });

    test('GH CLI missing/error triggers fallback', async () => {
        childProcess.execSync.mockImplementation((cmd) => {
            if (cmd.includes('gh --version')) return 'gh version 2.40.0';
            throw new Error('Command failed');
        });

        const failureAnalysis = await troubleshooter.analyzeFailed(
            { type: 'test', message: 'error' },
            {}
        );
        expect(failureAnalysis.cause).toBe('Manual diagnosis required');
    });

});
