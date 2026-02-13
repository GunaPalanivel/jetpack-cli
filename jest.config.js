module.exports = {
    projects: [
        {
            displayName: 'unit',
            testMatch: [
                '<rootDir>/tests/*.test.js',
                '!<rootDir>/tests/integration-*.test.js'
            ],
            testEnvironment: 'node'
        },
        {
            displayName: 'integration',
            testMatch: [
                '<rootDir>/tests/integration-*.test.js'
            ],
            testEnvironment: 'node'
        },
        {
            displayName: 'rollback',
            testMatch: [
                '<rootDir>/tests/rollback/**/*.test.js'
            ],
            testEnvironment: 'node'
        }
    ],

    // Unified reporting
    coverageDirectory: './coverage',
    collectCoverageFrom: [
        'src/**/*.js',
        '!**/node_modules/**'
    ],

    // Beautiful reporters
    reporters: [
        'default',
        ['jest-junit', {
            outputDirectory: './test-results',
            outputName: 'junit.xml'
        }],
        ['jest-html-reporter', {
            pageTitle: 'Jetpack Test Report',
            outputPath: './test-results/index.html'
        }]
    ]
};
