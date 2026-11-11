const { test, expect } = require('@playwright/test');
const LoginPage = require('../pages/Login');
const DashboardPage = require('../pages/Dashboard');
const CasesPage = require('../pages/Cases');

// All tests share one logged-in page, so they must run in order in a single worker.
test.describe.configure({ mode: 'default' });

test.describe('Module 4: Create Case (TC029 - TC044)', () => {
    /** @type {import('@playwright/test').Page} */
    let page;
    let dashboardPage;
    let casesPage;

    const stamp = process.env.TEST_RUN_ID;
    const caseName = `Case_${stamp}`;
    const caseNumber = `CN-${stamp}`;
    const updatedCaseName = `${caseName}_Updated`;
    const product = /^Publish/;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        dashboardPage = new DashboardPage(page);
        casesPage = new CasesPage(page);

        const loginPage = new LoginPage(page);
        await loginPage.navigateToLoginPage();
        await loginPage.login(process.env.STENO_EMAIL, process.env.STENO_PASSWORD);
        await expect(page).not.toHaveURL(/\/login(?:[/?#]|$)/, { timeout: 15000 });
    });

    test.afterAll(async () => {
        await page?.close();
    });

    test('TC029: Navigate to Cases', async () => {
        await dashboardPage.clickCases();
        await expect(page).toHaveURL(/\/cases$/i);
        await expect(casesPage.heading).toBeVisible();
        await expect(casesPage.newCaseButton).toBeVisible();
    });

    test.describe('Cases page', () => {
        test.beforeEach(async () => {
            await casesPage.goto();
        });

        test('TC030: Open Create Case form', async () => {
            await casesPage.openCreateCaseForm();
            await expect(casesPage.createDialog).toBeVisible();
            await expect(casesPage.caseNameInput).toBeVisible();
            await expect(casesPage.createCaseButton).toBeDisabled();
        });

        test('TC031: Create case with valid details', async () => {
            await casesPage.openCreateCaseForm();
            await casesPage.fillCaseDetails({
                name: caseName,
                description: 'Created by Playwright automation',
                number: caseNumber,
                venue: 'State of California',
                product,
            });
            await expect(casesPage.createCaseButton).toBeEnabled();
            await casesPage.submitCreate();
            await expect(casesPage.createDialog).toBeHidden();

            await casesPage.search(caseName);
            await expect(casesPage.rowFor(caseName)).toBeVisible();
        });

        test('TC032: Create case without case name', async () => {
            await casesPage.openCreateCaseForm();
            await casesPage.fillCaseDetails({ description: 'No name', product });
            await expect(casesPage.createCaseButton).toBeDisabled();
        });

        test('TC033: Create case without product', async () => {
            await casesPage.openCreateCaseForm();
            await casesPage.fillCaseDetails({ name: `${caseName}_NoProduct`, description: 'No product' });
            await expect(casesPage.createCaseButton).toBeDisabled();
        });

        test('TC034: Verify case number', async () => {
            await casesPage.search(caseNumber);
            await expect(casesPage.rowFor(caseName)).toContainText(caseNumber);
        });

        test('TC035: Verify case title', async () => {
            await casesPage.search(caseName);
            await expect(casesPage.rowFor(caseName).getByText(caseName, { exact: true })).toBeVisible();
        });

        test('TC036: Verify case type selection', async () => {
            await casesPage.openCreateCaseForm();
            await casesPage.selectMatterType('Civil');
            await expect(casesPage.matterTypeSelect).toHaveText('Civil');
        });

        test('TC037: Verify date field', async () => {
            await casesPage.openCreateCaseForm();
            await casesPage.expandMatterDetails();
            await casesPage.hearingDateInput.fill('2026-11-20');
            await expect(casesPage.hearingDateInput).toHaveValue('2026-11-20');
        });

        test('TC038: Create case without description', async () => {
            await casesPage.openCreateCaseForm();
            await casesPage.fillCaseDetails({ name: `${caseName}_NoDescription`, product });
            await expect(casesPage.createCaseButton).toBeDisabled();
        });

        test('TC039: Create duplicate case', async () => {
            await casesPage.openCreateCaseForm();
            await casesPage.fillCaseDetails({ name: caseName, description: 'Duplicate', product });
            await expect(casesPage.duplicateNameError).toBeVisible();
            await expect(casesPage.createCaseButton).toBeDisabled();
        });

        test('TC040: Cancel case creation', async () => {
            const cancelledName = `${caseName}_Cancelled`;
            await casesPage.openCreateCaseForm();
            await casesPage.fillCaseDetails({ name: cancelledName, description: 'Should not be saved' });
            await casesPage.cancel();
            await expect(casesPage.createDialog).toBeHidden();

            await casesPage.search(cancelledName);
            await expect(casesPage.noDataMessage).toBeVisible();
        });

        test('TC041: Open created case', async () => {
            await casesPage.search(caseName);
            await casesPage.openCase(caseName);
            await expect(page).toHaveURL(/\/cases\/[\w-]+$/i);
            await expect(page.getByRole('heading', { name: caseName, level: 1 })).toBeVisible();
        });

        test('TC042: Edit created case', async () => {
            await casesPage.search(caseName);
            await casesPage.editCaseName(caseName, updatedCaseName);
            await expect(casesPage.editDialog).toBeHidden();

            await casesPage.search(updatedCaseName);
            await expect(casesPage.rowFor(updatedCaseName)).toBeVisible();
        });

        test('TC043: Search for created case', async () => {
            await casesPage.search(updatedCaseName);
            await expect(casesPage.caseRows).toHaveCount(1);
            await expect(casesPage.rowFor(updatedCaseName)).toBeVisible();

            await casesPage.search(`no_match_${stamp}`);
            await expect(casesPage.noDataMessage).toBeVisible();
        });

        test('TC044: Verify case after refresh', async () => {
            await page.reload({ waitUntil: 'domcontentloaded' });
            await expect(casesPage.heading).toBeVisible();
            await casesPage.search(updatedCaseName);
            await expect(casesPage.rowFor(updatedCaseName)).toBeVisible();
        });
    });
});
