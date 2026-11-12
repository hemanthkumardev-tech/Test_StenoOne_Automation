
const { test, expect } = require('@playwright/test');

test('TC056: Compare Audit Log actor with logged-in user', async ({ page }) => {
    const auditResponsePromise = page.waitForResponse(response =>
        new URL(response.url()).pathname === '/api/v1/admin/audit-log' &&
        response.request().method() === 'GET',
        { timeout: 20000 }
    );

    await page.goto('/');

    const auditResponse = await auditResponsePromise;

    expect(auditResponse.status()).toBe(200);

    const responseBody = await auditResponse.json();
    const auditItems = responseBody.data.items;

    console.log('\n========== AUDIT RECORD SUMMARY ==========');
    console.log('Records received:', auditItems.length);

    for (const item of auditItems) {
        console.log({
            resource: item.resource,
            action: item.action,
            timestamp: item.timestamp,
            actorMatchesEnvLogin:
                item.userEmail?.toLowerCase() ===
                process.env.STENO_EMAIL?.toLowerCase()
        });
    }

    console.log('==========================================\n');
});
