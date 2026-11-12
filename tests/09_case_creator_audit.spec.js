
const { test, expect } = require('@playwright/test');
const CasesPage = require('../pages/Cases');

test('TC057: Verify case creator through Audit Logs API', async ({ page }) => {

    const stamp = Date.now().toString();
    const caseName = `Audit_Verification_${stamp}`;
    const caseNumber = `AUD-${stamp}`;

    const casesPage = new CasesPage(page);

    // Navigate to Cases and create a unique case.
    await casesPage.goto();
    await casesPage.openCreateCaseForm();

    await casesPage.fillCaseDetails({
        name: caseName,
        description: 'Created for audit creator verification',
        number: caseNumber,
        venue: 'State of California',
        product: /^Publish/,
    });

    await expect(casesPage.createCaseButton).toBeEnabled();
    await casesPage.submitCreate();

    await expect(casesPage.createDialog).toBeHidden();

    // Confirm that the case exists.
    await casesPage.search(caseName);
    await expect(casesPage.rowFor(caseName)).toBeVisible();

    console.log('Case created and verified in Cases list:', true);

    // Dashboard navigation triggers the Audit Logs API.
    const auditResponsePromise = page.waitForResponse(response =>
        new URL(response.url()).pathname === '/api/v1/admin/audit-log' &&
        response.request().method() === 'GET',
        { timeout: 20000 }
    );

    await page.goto('/');

    const auditResponse = await auditResponsePromise;
    expect(auditResponse.status()).toBe(200);

    const body = await auditResponse.json();
    const items = body.data.items;

    // Inspect audit records without printing personal information.
    console.log('\n========== AUDIT RECORD INSPECTION ==========');
    console.log('Audit records received:', items.length);

    const matchingRecord = items.find(item =>
        JSON.stringify(item).includes(caseName)
    );

    console.log('Matching case audit record found:', Boolean(matchingRecord));

    if (matchingRecord) {
        console.log('Resource:', matchingRecord.resource);
        console.log('Action:', matchingRecord.action);
        console.log(
            'Actor matches login:',
            matchingRecord.userEmail?.toLowerCase() ===
            process.env.STENO_EMAIL?.toLowerCase()
        );
    }

    console.log('=============================================\n');

    expect(matchingRecord, 'Expected an audit record for the created case').toBeTruthy();

    expect(matchingRecord.resource).toBe('Case');
    expect(matchingRecord.action).toBe('Created');

    expect(matchingRecord.userEmail?.toLowerCase()).toBe(
        process.env.STENO_EMAIL?.toLowerCase()
    );
});
