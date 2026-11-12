
const { test, expect } = require('@playwright/test');
const CasesPage = require('../pages/Cases');

test('TC054: Inspect Cases API response fields', async ({ page }) => {

    console.log('\n========== CASE API INSPECTION ==========\n');

    // Start listening before opening the Cases page
    const casesResponsePromise = page.waitForResponse(
        response =>
            new URL(response.url()).pathname === '/api/v1/cases' &&
            response.request().method() === 'GET',
        { timeout: 20000 }
    );

    const casesPage = new CasesPage(page);

    await casesPage.goto();

    await expect(casesPage.heading).toBeVisible({
        timeout: 15000
    });

    // Wait for the Cases API response
    const casesResponse = await casesResponsePromise;

    console.log('API status:', casesResponse.status());

    expect(casesResponse.status()).toBe(200);

    const responseData = await casesResponse.json();

    console.log('Top-level fields:', Object.keys(responseData));

    const data = responseData.data;

    console.log('\nData type:', Array.isArray(data) ? 'Array' : typeof data);

    function inspectStructure(value, path = 'data', depth = 0) {

        if (depth > 4 || value === null || value === undefined) {
            return;
        }

        if (Array.isArray(value)) {

            console.log(`${path}: Array, records: ${value.length}`);

            if (value.length > 0) {
                const firstRecord = value[0];

                if (typeof firstRecord === 'object' && firstRecord !== null) {
                    console.log(`${path}[0] fields:`, Object.keys(firstRecord));
                    inspectStructure(firstRecord, `${path}[0]`, depth + 1);
                }
            }

            return;
        }

        if (typeof value === 'object') {

            console.log(`${path} fields:`, Object.keys(value));

            for (const [key, child] of Object.entries(value)) {

                if (child !== null && typeof child === 'object') {
                    inspectStructure(child, `${path}.${key}`, depth + 1);
                }
            }
        }
    }

    inspectStructure(data);

    console.log('\n========== INSPECTION COMPLETED ==========\n');
});
