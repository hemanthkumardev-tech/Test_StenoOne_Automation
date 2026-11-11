
require('dotenv').config({ override: true });

// Set once in the runner process so restarted workers reuse the same test data names.
process.env.TEST_RUN_ID ??= String(Date.now());

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'list',

    use: {
        trace: 'on-first-retry',
    },

    projects: [
        {
            name: 'cases-chrome',
            testMatch: /04_create_case\.spec\.js/,
            use: {
                browserName: 'chromium',
                headless: false,
                viewport: null,
                launchOptions: {
                    slowMo: 500,
                    args: ['--start-maximized'],
                },
            },
        },
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] }
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] }
        },
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] }
        },
    ],
});
