
const { test, expect } = require('@playwright/test');
const CasesPage = require('../pages/Cases');

test.describe('Module 5: Cases Page Filters', () => {

    // TC046: Active status
   


test('TC046: Filter cases by Active status', async ({ page }) => {
    const casesPage = new CasesPage(page);

    await casesPage.goto();
    await expect(casesPage.heading).toBeVisible();

    // Wait for initial cases to load
    await expect.poll(
        async () => await casesPage.caseRows.count(),
        { timeout: 15000 }
    ).toBeGreaterThan(0);

    console.log(
        'Initial case count:',
        await casesPage.caseRows.count()
    );

    // Apply Active status filter
    await casesPage.selectStatusFilter('Active');

    await expect(casesPage.statusFilter).toContainText('Active');

    // Wait until filtered results finish loading
    await expect.poll(
        async () => await casesPage.caseRows.count(),
        { timeout: 15000 }
    ).toBeGreaterThan(0);

    // Verify filtered records
    const rowCount = await casesPage.caseRows.count();

    for (let i = 0; i < rowCount; i++) {
        await expect(casesPage.caseRows.nth(i))
            .toContainText('Active');
    }

    console.log(`Active filter successfully verified ${rowCount} cases.`);
});

    // TC047: Closed status
   

test('TC047: Filter cases by Closed status', async ({ page }) => {
    const casesPage = new CasesPage(page);

    await casesPage.goto();
    await expect(casesPage.heading).toBeVisible();

    // Wait for initial records
    await expect.poll(
        async () => await casesPage.caseRows.count(),
        { timeout: 15000 }
    ).toBeGreaterThan(0);

    console.log(
        'Initial case count:',
        await casesPage.caseRows.count()
    );

    // Apply Closed filter
    await casesPage.selectStatusFilter('Closed');

    await expect(casesPage.statusFilter).toContainText('Closed');

    await page.waitForTimeout(1500);

    console.log('Table after Closed filter:');
    console.log(await casesPage.casesTable.innerText());

    console.log(
        'Rows after Closed filter:',
        await casesPage.caseRows.count()
    );
});



    // TC048: Archived status
    test('TC048: Filter cases by Archived status', async ({ page }) => {
        const casesPage = new CasesPage(page);

        await casesPage.goto();
        await expect(casesPage.heading).toBeVisible();

        await casesPage.selectStatusFilter('Archived');
        await expect(casesPage.statusFilter).toContainText('Archived');

        const rowCount = await casesPage.caseRows.count();

        if (rowCount === 0) {
            console.log('No Archived cases available to validate.');
        } else {
            for (let i = 0; i < rowCount; i++) {
                await expect(casesPage.caseRows.nth(i))
                    .toContainText('Archived');
            }

            console.log(`Verified ${rowCount} Archived cases.`);
        }
    });

    // TC049: Civil matter type
    test('TC049: Filter cases by Civil matter type', async ({ page }) => {
        const casesPage = new CasesPage(page);

        await casesPage.goto();
        await expect(casesPage.heading).toBeVisible();

        await casesPage.selectMatterTypeFilter('Civil');
        await expect(casesPage.matterTypeFilter).toContainText('Civil');

        const rowCount = await casesPage.caseRows.count();

        if (rowCount === 0) {
            console.log('No Civil cases available to validate.');
        } else {
            for (let i = 0; i < rowCount; i++) {
                await expect(casesPage.caseRows.nth(i))
                    .toContainText('Civil');
            }

            console.log(`Verified ${rowCount} Civil cases.`);
        }
    });

    // TC050: Sub-organization
    test('TC050: Filter cases by TestOrgDemoSub organization', async ({ page }) => {
        const casesPage = new CasesPage(page);

        await casesPage.goto();
        await expect(casesPage.heading).toBeVisible();

        await casesPage.selectSubOrgFilter('TestOrgDemoSub');
        await expect(casesPage.subOrgFilter).toContainText('TestOrgDemoSub');

        const rowCount = await casesPage.caseRows.count();

        console.log(`TestOrgDemoSub filter returned ${rowCount} cases.`);
    });

    

test('TC051: Filter cases by Publish product', async ({ page }) => {
    const casesPage = new CasesPage(page);

    await casesPage.goto();
    await expect(casesPage.heading).toBeVisible();

    // Wait for the initial table to finish loading
    await expect(async () => {
        const count = await casesPage.caseRows.count();
        expect(count).toBeGreaterThan(0);
    }).toPass({ timeout: 15000 });

    // Capture initial case count
    const initialCount = await casesPage.caseRows.count();
    console.log('Initial case count:', initialCount);

    // Apply Publish product filter
    await casesPage.selectProductFilter('Publish · TestOrgDemo');

    await expect(casesPage.productFilter).toContainText('Publish');

    // Wait for filtered results
    await expect(async () => {
        const count = await casesPage.caseRows.count();
        expect(count).toBeGreaterThan(0);
    }).toPass({ timeout: 15000 });

    const filteredCount = await casesPage.caseRows.count();

    console.log('Publish filtered count:', filteredCount);

    // Validate result count
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    console.log(`Publish product filter returned ${filteredCount} rows.`);

    // Print filtered case details
    for (let i = 0; i < filteredCount; i++) {
        const row = casesPage.caseRows.nth(i);
        console.log(`Publish result ${i + 1}:`, await row.innerText());
    }
});

   

test('TC052: Verify available product filter options', async ({ page }) => {
    const casesPage = new CasesPage(page);

    await casesPage.goto();
    await expect(casesPage.heading).toBeVisible();

    // Open Product dropdown
    await casesPage.productFilter.click();

    // Wait for product options to load
    await expect.poll(
        async () => await page.getByRole('option').count(),
        { timeout: 10000 }
    ).toBeGreaterThan(1);

    // Capture available options
    const options = await page.getByRole('option').allTextContents();

    console.log('Available product options:', options);

    // Expected options
    const expectedOptions = [
        'All products',
        'Publish · TestOrgDemo',
        'Sync Generator · TestOrgDemo',
        'Capture · TestOrgDemo'
    ];

    // Validate each option
    for (const expectedOption of expectedOptions) {
        expect(options).toContain(expectedOption);
    }

    console.log('All expected product options are available.');
    });
});
