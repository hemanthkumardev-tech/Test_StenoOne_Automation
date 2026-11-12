
const { test, expect } = require('@playwright/test');
const CasesPage = require('../pages/Cases');

test('TC053: Discover Cases page API requests', async ({ page }) => {

    const apiRequests = [];

    // Capture API requests
    page.on('request', request => {
        const url = request.url();

        if (
            url.includes('/api/') &&
            ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())
        ) {
            const endpoint = new URL(url).pathname;

            apiRequests.push({
                method: request.method(),
                endpoint
            });

            console.log('API REQUEST:', request.method(), endpoint);
        }
    });

    // Capture API responses
    page.on('response', response => {
        const url = response.url();

        if (url.includes('/api/')) {
            console.log(
                'API RESPONSE:',
                response.status(),
                new URL(url).pathname
            );
        }
    });

    // Open Cases page
    const casesPage = new CasesPage(page);

    await casesPage.goto();

    await expect(casesPage.heading).toBeVisible({
        timeout: 15000
    });

    await expect.poll(
        async () => await casesPage.caseRows.count(),
        { timeout: 15000 }
    ).toBeGreaterThan(0);

    console.log('\nCases page loaded successfully.');

    // Display unique endpoints
    const uniqueEndpoints = [
        ...new Map(
            apiRequests.map(item => [
                `${item.method} ${item.endpoint}`,
                item
            ])
        ).values()
    ];

    console.log('\n========== DISCOVERED API ENDPOINTS ==========');

    for (const item of uniqueEndpoints) {
        console.log(`${item.method} ${item.endpoint}`);
    }

    console.log('\nTotal requests:', apiRequests.length);
    console.log('Unique endpoints:', uniqueEndpoints.length);

    expect(uniqueEndpoints.length).toBeGreaterThan(0);
});
