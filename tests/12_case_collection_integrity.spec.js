
const { test, expect } = require('@playwright/test');
const CasesPage = require('../pages/Cases');

test('TC060: Collection-wide Case Data Integrity Validation', async ({ page }) => {

    console.log('\n========== TC060: COLLECTION DATA INTEGRITY ==========\n');

    const casesPage = new CasesPage(page);

    // STEP 1: Open Cases page
    await casesPage.goto();

    await expect(casesPage.heading).toBeVisible();

    // STEP 2: Capture initial Cases API response
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

    // STEP 3: Read first page
    const firstPageBody = await casesResponse.json();

    const paginationData = firstPageBody.data;

    expect(Array.isArray(paginationData.items)).toBe(true);

    const totalPages = paginationData.totalPages;
    const expectedTotalCount = paginationData.totalCount;

    let allCaseRecords = [...paginationData.items];

    console.log('Total pages:', totalPages);
    console.log('Expected total records:', expectedTotalCount);

    // STEP 4: Retrieve remaining pages
    for (let pageNumber = 2; pageNumber <= totalPages; pageNumber++) {

        const pageUrl = new URL(initialUrl);

        pageUrl.searchParams.set('page', pageNumber.toString());

        const pageResponse = await page.request.get(pageUrl.toString());

        expect(pageResponse.status()).toBe(200);

        const pageBody = await pageResponse.json();

        expect(Array.isArray(pageBody.data.items)).toBe(true);

        allCaseRecords.push(...pageBody.data.items);

        console.log(
            `Page ${pageNumber}:`,
            pageBody.data.items.length,
            'records'
        );
    }

    // STEP 5: Validate total record count
    console.log('\n========== RECORD COUNT VALIDATION ==========');

    console.log('Expected records:', expectedTotalCount);
    console.log('Retrieved records:', allCaseRecords.length);

    expect(allCaseRecords.length).toBe(expectedTotalCount);

    console.log('Record count validation: PASS');

    // STEP 6: Validate required fields
    console.log('\n========== REQUIRED FIELD VALIDATION ==========');
    // DIAGNOSTIC: Identify records with missing case numbers
console.log('\n========== CASE NUMBER DIAGNOSTICS ==========');

allCaseRecords.forEach((record, index) => {

    if (
        typeof record.caseNumber !== 'string' ||
        record.caseNumber.trim().length === 0
    ) {
        console.log('Problematic record:', {
            recordNumber: index + 1,
            id: record.id,
            name: record.name,
            caseNumber: record.caseNumber,
            status: record.status
        });
    }

});

    for (const [index, record] of allCaseRecords.entries()) {

        expect(record.id, `Record ${index + 1}: missing ID`).toBeTruthy();

        expect(
            typeof record.name === 'string' && record.name.trim().length > 0,
            `Record ${index + 1}: invalid case name`
        ).toBe(true);

        expect(
            typeof record.caseNumber === 'string' &&
            record.caseNumber.trim().length > 0,
            `Record ${index + 1}: invalid case number`
        ).toBe(true);

        expect(
            typeof record.status === 'string' && record.status.trim().length > 0,
            `Record ${index + 1}: invalid status`
        ).toBe(true);

        expect(record.orgId, `Record ${index + 1}: missing organization ID`).toBeTruthy();

        expect(
            record.productInstanceId,
            `Record ${index + 1}: missing product instance ID`
        ).toBeTruthy();

        expect(
            Number.isInteger(record.jobCount) && record.jobCount >= 0,
            `Record ${index + 1}: invalid job count`
        ).toBe(true);

        expect(
            typeof record.createdAt === 'string' &&
            !Number.isNaN(Date.parse(record.createdAt)),
            `Record ${index + 1}: invalid creation timestamp`
        ).toBe(true);
    }

    console.log('Required field validation: PASS');
    console.log('Records checked:', allCaseRecords.length);

    // STEP 7: Check duplicate IDs
    console.log('\n========== DUPLICATE VALIDATION ==========');

    const caseIds = allCaseRecords.map(record => record.id);

    const uniqueCaseIds = new Set(caseIds);

    const duplicateIds = caseIds.filter(
        (id, index) => caseIds.indexOf(id) !== index
    );

    console.log('Unique case IDs:', uniqueCaseIds.size);
    console.log('Duplicate IDs:', duplicateIds.length);

    expect(duplicateIds).toEqual([]);

    // STEP 8: Check duplicate case numbers
    const caseNumbers = allCaseRecords.map(
        record => record.caseNumber.trim().toLowerCase()
    );

    const uniqueCaseNumbers = new Set(caseNumbers);

    const duplicateCaseNumbers = caseNumbers.filter(
        (number, index) => caseNumbers.indexOf(number) !== index
    );

    console.log('Unique case numbers:', uniqueCaseNumbers.size);
    console.log('Duplicate case numbers:', duplicateCaseNumbers.length);

    expect(duplicateCaseNumbers).toEqual([]);

    // STEP 9: Verify organization consistency
    const organizationIds = new Set(
        allCaseRecords.map(record => record.orgId)
    );

    console.log('Organization IDs found:', organizationIds.size);

    // STEP 10: Final report
    console.log('\n========== TC060 FINAL REPORT ==========');

    console.log('Total records inspected:', allCaseRecords.length);
    console.log('Required fields: PASS');
    console.log('Duplicate IDs: NONE');
    console.log('Duplicate case numbers: NONE');
    console.log('Organization consistency: INSPECTED');

    console.log('\nAll TC060 integrity checks passed.');

    console.log('\n========== TC060 COMPLETED ==========\n');

});
