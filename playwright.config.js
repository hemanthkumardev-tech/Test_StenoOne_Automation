
// @ts-check
const { defineConfig, devices } = require('@playwright/test');
require('dotenv').config({ override: true });

module.exports = defineConfig({

    testDir: './tests',

    timeout: 30 * 1000,

    expect: {
        timeout: 10 * 1000,
    },

    fullyParallel: false,

    reporter: [
        ['list'],
        ['html', { open: 'never' }]
    ],

    use: {
        baseURL: 'https://dev.steno.one/',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        headless: false,
    },

    projects: [

        // Step 1: Login once and save authentication state
        {
            name: 'setup',
            testMatch: /auth\.setup\.js/,
        },

        // Step 2: Reuse saved authentication state
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                storageState: '.auth/user.json',
            },
            dependencies: ['setup'],
        },

    ],

});
