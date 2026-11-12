
const { test, expect } = require('@playwright/test');
const CasesPage = require('../pages/Cases');

test('TC059: Comprehensive Case API Field Validation', async ({ page }) => {

    const stamp = Date.now().toString();

    const expectedCase = {
        name: `TC059_Validation_${stamp}`,
        number: `CN-TC059-${stamp}`,
        description: `Comprehensive API validation ${stamp}`
    };

    console.log('\n========== TC059: COMPREHENSIVE API VALIDATION ==========\n');

    const casesPage = new CasesPage(page);

    // STEP 1: Open Cases page
    await casesPage.goto();

    await expect(casesPage.heading).toBeVisible();

    // STEP 2: Create a new test case
    await casesPage.openCreateCaseForm();

    await casesPage.fillCaseDetails({
        name: expectedCase.name,
        number: expectedCase.number,
        description: expectedCase.description,
        product: /^Publish/
    });

    await casesPage.submitCreate();

    // STEP 3: Verify case appears in UI
    await expect(
        casesPage.rowFor(expectedCase.name)
    ).toBeVisible({ timeout: 15000 });

    console.log('UI validation: Case created successfully');

    // STEP 4: Capture Cases API response
    const casesResponsePromise = page.waitForResponse(
        response =>
            new URL(response.url()).pathname === '/api/v1/cases' &&
            response.request().method() === 'GET',
        { timeout: 20000 }
    );

    await page.reload({ waitUntil: 'domcontentloaded' });

    const casesResponse = await casesResponsePromise;

    expect(casesResponse.status()).toBe(200);

    const initialUrl = new URL(casesResponse.url());
    const orgId = initialUrl.searchParams.get('orgId');

    expect(orgId).toBeTruthy();

    const firstPageBody = await casesResponse.json();
    const paginationData = firstPageBody.data;

    expect(Array.isArray(paginationData.items)).toBe(true);

    let allCaseRecords = [...paginationData.items];

    const totalPages = paginationData.totalPages;

    // STEP 5: Retrieve remaining pages
    for (let pageNumber = 2; pageNumber <= totalPages; pageNumber++) {

        const pageUrl = new URL(initialUrl);

        pageUrl.searchParams.set('page', pageNumber.toString());

        const pageResponse = await page.request.get(pageUrl.toString());

        expect(pageResponse.status()).toBe(200);

        const pageBody = await pageResponse.json();

        allCaseRecords.push(...pageBody.data.items);
    }

    console.log('Total pages:', totalPages);
    console.log('Total records collected:', allCaseRecords.length);

    // STEP 6: Find the newly created case
    const matchingCase = allCaseRecords.find(
        record => record.caseNumber === expectedCase.number
    );

    expect(
        matchingCase,
        `Case ${expectedCase.number} should exist`
    ).toBeTruthy();

    // STEP 7: Validate required fields
    console.log('\n========== REQUIRED FIELD VALIDATION ==========');

    expect(matchingCase.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );

    expect(matchingCase.name).toBe(expectedCase.name);

    expect(matchingCase.caseNumber).toBe(expectedCase.number);

    expect(matchingCase.description).toBe(expectedCase.description);

    expect(matchingCase.status).toBe('Active');

    expect(matchingCase.orgId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );

    expect(matchingCase.productInstanceId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );

    expect(matchingCase.createdAt).toBeTruthy();

    expect(Number.isNaN(Date.parse(matchingCase.createdAt))).toBe(false);

    console.log('Case ID: PASS');
    console.log('Case name: PASS');
    console.log('Case number: PASS');
    console.log('Description: PASS');
    console.log('Status: PASS');
    console.log('Organization ID: PASS');
    console.log('Product instance ID: PASS');
    console.log('Created timestamp: PASS');

    // STEP 8: Validate optional fields
    console.log('\n========== OPTIONAL FIELD VALIDATION ==========');

    const optionalFields = [
        'subOrgId',
        'deptId',
        'venueLocation',
        'matterType',
        'client',
        'hearingDate',
        'assignedTo'
    ];

    for (const field of optionalFields) {

        const value = matchingCase[field];

        expect(
            value === null || typeof value === 'string',
            `${field} should be a string or null`
        ).toBe(true);

        console.log(`${field}:`, value === null ? 'NULL' : 'POPULATED');
    }

    // STEP 9: Validate job count
    console.log('\n========== JOB COUNT VALIDATION ==========');

    expect(Number.isInteger(matchingCase.jobCount)).toBe(true);

    expect(matchingCase.jobCount).toBeGreaterThanOrEqual(0);

    console.log('Job count:', matchingCase.jobCount);
    console.log('Job count validation: PASS');

    // STEP 10: Final summary
    console.log('\n========== TC059 VALIDATION SUMMARY ==========');

    console.log('Case name:', matchingCase.name);
    console.log('Case number:', matchingCase.caseNumber);
    console.log('Case status:', matchingCase.status);
    console.log('Organization ID:', matchingCase.orgId);
    console.log('Product instance ID:', matchingCase.productInstanceId);
    console.log('Assigned user:', matchingCase.assignedTo);
    console.log('Created at:', matchingCase.createdAt);

    console.log('\nAll TC059 API field validations passed.');

    console.log('\n========== TC059 COMPLETED ==========\n');

});
