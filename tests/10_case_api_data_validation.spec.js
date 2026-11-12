
const { test, expect } = require('@playwright/test');
const CasesPage = require('../pages/Cases');

test('TC058: Verify created case details against all Cases API pages', async ({ page }) => {

    // Generate unique test data
    const stamp = Date.now().toString();

    const expectedCase = {
        name: `API_Validation_${stamp}`,
        number: `CN-API-${stamp}`,
        description: `Created through Playwright API validation test ${stamp}`
    };

    console.log('\n========== TC058: CASE API VALIDATION ==========\n');

    const casesPage = new CasesPage(page);

    // STEP 1: Open Cases page
    await casesPage.goto();

    await expect(casesPage.heading).toBeVisible();

    // STEP 2: Open Create Case form
    await casesPage.openCreateCaseForm();

    // STEP 3: Enter case details
    await casesPage.fillCaseDetails({
        name: expectedCase.name,
        number: expectedCase.number,
        description: expectedCase.description,
        product: /^Publish/
    });

    // STEP 4: Create the case
    await casesPage.submitCreate();

    // STEP 5: Verify case appears in UI
    await expect(
        casesPage.rowFor(expectedCase.name)
    ).toBeVisible({ timeout: 15000 });

    console.log('UI validation: Case created successfully');

    // STEP 6: Capture Cases API response after reload
    const casesResponsePromise = page.waitForResponse(
        response =>
            new URL(response.url()).pathname === '/api/v1/cases' &&
            response.request().method() === 'GET',
        { timeout: 20000 }
    );

    await page.reload({
        waitUntil: 'domcontentloaded'
    });

    const casesResponse = await casesResponsePromise;

    console.log('Initial API URL:', casesResponse.url());
    console.log('API status:', casesResponse.status());

    expect(casesResponse.status()).toBe(200);

    // STEP 7: Extract organization ID from actual API URL
    const initialUrl = new URL(casesResponse.url());

    const orgId = initialUrl.searchParams.get('orgId');

    expect(orgId, 'Organization ID should be present').toBeTruthy();

    // STEP 8: Read first page
    const firstPageBody = await casesResponse.json();

    const paginationData = firstPageBody.data;

    expect(Array.isArray(paginationData.items)).toBe(true);

    const totalPages = paginationData.totalPages;
    const totalCount = paginationData.totalCount;

    let allCaseRecords = [...paginationData.items];

    console.log('\n========== PAGINATION DETAILS ==========');
    console.log('Current page:', paginationData.pageNumber);
    console.log('Total pages:', totalPages);
    console.log('Total records:', totalCount);
    console.log('First page records:', allCaseRecords.length);

    // STEP 9: Retrieve remaining pages
    for (let pageNumber = 2; pageNumber <= totalPages; pageNumber++) {

        const pageUrl = new URL(initialUrl);

        pageUrl.searchParams.set('page', pageNumber.toString());

        const pageResponse = await page.request.get(pageUrl.toString());

        console.log(`Page ${pageNumber} API status:`, pageResponse.status());

        expect(pageResponse.status()).toBe(200);

        const pageBody = await pageResponse.json();

        expect(Array.isArray(pageBody.data.items)).toBe(true);

        allCaseRecords.push(...pageBody.data.items);

        console.log(
            `Page ${pageNumber} records:`,
            pageBody.data.items.length
        );
    }

    console.log('Total records collected:', allCaseRecords.length);

    // STEP 10: Find newly created case
    const matchingCase = allCaseRecords.find(
        record => record.caseNumber === expectedCase.number
    );

    expect(
        matchingCase,
        `Case ${expectedCase.number} should exist in API records`
    ).toBeTruthy();

    // STEP 11: Compare expected and actual values
    expect(matchingCase.name).toBe(expectedCase.name);

    expect(matchingCase.caseNumber).toBe(expectedCase.number);

    expect(matchingCase.description).toBe(expectedCase.description);

    expect(matchingCase.status).toBeTruthy();

    expect(matchingCase.createdAt).toBeTruthy();

    // STEP 12: Display validation results
    console.log('\n========== VALIDATION RESULTS ==========');

    console.log('Case name:', matchingCase.name);
    console.log('Case number:', matchingCase.caseNumber);
    console.log('Description:', matchingCase.description);
    console.log('Status:', matchingCase.status);
    console.log('Created at:', matchingCase.createdAt);

    console.log('\n========== COMPLETE CASE API RECORD ==========');

    console.log(JSON.stringify(matchingCase, null, 2));

    console.log('\nExpected case matched API record successfully.');

    console.log('\n========== TC058 COMPLETED ==========\n');

});
