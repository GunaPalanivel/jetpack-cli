const analyzer = require('../../src/rollback/copilot-risk-analyzer');
const childProcess = require('child_process');

jest.mock('child_process');

describe('Copilot Risk Analyzer Tests', () => {

    beforeEach(() => {
        childProcess.execSync.mockReset();
        // Default mock for version check
        childProcess.execSync.mockImplementation((cmd) => {
            if (cmd.includes('gh --version')) return 'gh version 2.40.0';
            return '';
        });
    });

    test('Assess Risks', async () => {
        const mockResponse = JSON.stringify({
            highRisk: ['Uninstalling database'],
            warnings: ['Data loss potential'],
            precautions: ['Backup DB dump']
        });

        childProcess.execSync.mockImplementation((cmd) => {
            if (cmd.includes('gh --version')) return 'gh version 2.40.0';
            return mockResponse;
        });

        const risks = await analyzer.assessRisks(
            { installedPackages: ['postgres'], sshKeys: true },
            { unsafe: true }
        );

        expect(risks.highRisk[0]).toBe('Uninstalling database');
        expect(risks.precautions[0]).toBe('Backup DB dump');
    });

    test('Fallback on Error', async () => {
        childProcess.execSync.mockImplementation(() => { throw new Error('Copilot failed'); });

        const fallback = await analyzer.assessRisks({}, {});
        expect(fallback.warnings[0]).toContain('Could not analyze');
    });

});
