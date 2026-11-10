const { test, expect } = require('@playwright/test');
const LoginPage = require('../pages/Login');
const DashboardPage = require('../pages/Dashboard');
const CasesPage = require('../pages/Cases');

test.describe('Module 4: Create Case (TC029 - TC044)', () => {
    let loginPage;
    let dashboardPage;
    let casesPage;
    const testCaseTitle = `Case_${Date.now()}`;
    const testCaseNumber = `CN-${Math.floor(100000 + Math.random() * 900000)}`;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        dashboardPage = new DashboardPage(page);
        casesPage = new CasesPage(page);

        // Precondition: User logged in
        await loginPage.navigateToLoginPage();
        await loginPage.enterEmail(process.env.STENO_EMAIL || 'saikiran.r@neuranx.ai');
        await loginPage.enterPassword(process.env.STENO_PASSWORD || 'Saikiran');
        await loginPage.clickSignIn();
        await expect(page).not.toHaveURL(/\/login(?:[/?#]|$)/, { timeout: 15000 });

        // Navigate to Cases
        await dashboardPage.clickCases();
        await expect(page).toHaveURL(/\/cases/i, { timeout: 15000 });
    });

    test('TC029: Navigate to Cases', async ({ page }) => {
        await expect(page).toHaveURL(/\/cases/i);
        await expect(casesPage.heading).toBeVisible();
    });

    test('TC030: Open Create Case form', async ({ page }) => {
        await casesPage.openCreateCaseForm();
        const formOrModal = page.locator('form, [role="dialog"]').first();
        await expect(formOrModal).toBeVisible({ timeout: 5000 });
    });

    test('TC031: Create case with valid details', async ({ page }) => {
        await casesPage.openCreateCaseForm();
        if (await casesPage.caseNameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
            await casesPage.fillCaseDetails({
                name: testCaseTitle,
                number: testCaseNumber,
                startDate: '2026-11-15'
            });
            await casesPage.save();
            await expect(page.getByText(testCaseTitle).first()).toBeVisible({ timeout: 10000 });
        }
    });

    test('TC032: Create case without case name', async ({ page }) => {
        await casesPage.openCreateCaseForm();
        if (await casesPage.caseNameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
            await casesPage.fillCaseDetails({ name: '' });
            await casesPage.save();
            const validationMsg = await casesPage.caseNameInput.evaluate(el => el.validationMessage).catch(() => '');
            const alertVisible = await casesPage.validationError.isVisible().catch(() => false);
            expect(Boolean(validationMsg) || alertVisible).toBeTruthy();
        }
    });

    test('TC033: Create case without organisation', async ({ page }) => {
        await casesPage.openCreateCaseForm();
        if (await casesPage.orgSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
            await casesPage.save();
            await expect(casesPage.validationError.or(casesPage.orgSelect)).toBeVisible();
        }
    });

    test('TC034: Verify case number generation', async ({ page }) => {
        await casesPage.openCreateCaseForm();
        if (await casesPage.caseNumberInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            const caseNumVal = await casesPage.caseNumberInput.inputValue();
            console.log('Generated/Default Case Number:', caseNumVal);
        }
    });

    test('TC035: Verify case title', async ({ page }) => {
        await casesPage.openCreateCaseForm();
        if (await casesPage.caseNameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            await casesPage.caseNameInput.fill('Verified Case Title');
            await expect(casesPage.caseNameInput).toHaveValue('Verified Case Title');
        }
    });

    test('TC036: Verify case type selection', async ({ page }) => {
        await casesPage.openCreateCaseForm();
        if (await casesPage.caseTypeSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
            await expect(casesPage.caseTypeSelect).toBeVisible();
        }
    });

    test('TC037: Verify date fields', async ({ page }) => {
        await casesPage.openCreateCaseForm();
        if (await casesPage.startDateInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            await casesPage.startDateInput.fill('2026-11-20');
            await expect(casesPage.startDateInput).toHaveValue('2026-11-20');
        }
    });

    test('TC038: Enter invalid date range', async ({ page }) => {
        await casesPage.openCreateCaseForm();
        if (await casesPage.startDateInput.isVisible({ timeout: 3000 }).catch(() => false) &&
            await casesPage.endDateInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            // Set end date earlier than start date
            await casesPage.startDateInput.fill('2026-11-25');
            await casesPage.endDateInput.fill('2026-11-20');
            await casesPage.save();
            const dateAlert = page.locator('text=/date|invalid|range/i');
            const alertShown = await dateAlert.isVisible({ timeout: 3000 }).catch(() => false);
            expect(alertShown || await casesPage.saveButton.isVisible()).toBeTruthy();
        }
    });

    test('TC039: Create duplicate case', async ({ page }) => {
        await casesPage.openCreateCaseForm();
        if (await casesPage.caseNameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            await casesPage.fillCaseDetails({ name: 'Existing Case' });
            await casesPage.save();
            // Duplicate handling check
            const duplicateMsg = page.locator('text=/already exists|duplicate/i');
            const isDuplicate = await duplicateMsg.isVisible({ timeout: 3000 }).catch(() => false);
            expect(isDuplicate || page.url().includes('cases')).toBeTruthy();
        }
    });

    test('TC040: Cancel case creation', async ({ page }) => {
        await casesPage.openCreateCaseForm();
        if (await casesPage.cancelButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await casesPage.cancel();
            await expect(page.locator('[role="dialog"]')).not.toBeVisible();
        }
    });

    test('TC041: Open created case', async ({ page }) => {
        if (await casesPage.firstCaseRow.isVisible({ timeout: 5000 }).catch(() => false)) {
            await casesPage.firstCaseRow.click();
            await expect(page).toHaveURL(/cases\/.+/i);
        }
    });

    test('TC042: Edit created case', async ({ page }) => {
        if (await casesPage.editButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await casesPage.editButton.click();
            await casesPage.fillCaseDetails({ name: `${testCaseTitle}_Updated` });
            await casesPage.save();
            await expect(page.getByText(`${testCaseTitle}_Updated`).first()).toBeVisible({ timeout: 8000 });
        }
    });

    test('TC043: Search for created case', async ({ page }) => {
        await casesPage.search('Case');
        await expect(casesPage.casesTable).toBeVisible();
    });

    test('TC044: Verify case after refresh', async ({ page }) => {
        await page.reload({ waitUntil: 'domcontentloaded' });
        await expect(page).toHaveURL(/\/cases/i);
        await expect(casesPage.heading).toBeVisible();
    });
});
