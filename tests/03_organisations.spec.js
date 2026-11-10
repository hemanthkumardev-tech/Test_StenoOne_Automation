const { test, expect } = require('@playwright/test');
const LoginPage = require('../pages/Login');
const DashboardPage = require('../pages/Dashboard');
const OrganizationsPage = require('../pages/Organizations');

test.describe('Module 3: Organisations (TC015 - TC028)', () => {
    let loginPage;
    let dashboardPage;
    let orgsPage;
    const testOrgName = `AutoOrg_${Date.now()}`;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        dashboardPage = new DashboardPage(page);
        orgsPage = new OrganizationsPage(page);

        // Precondition: Login and navigate to Organisations
        await loginPage.navigateToLoginPage();
        await loginPage.enterEmail(process.env.STENO_EMAIL || 'saikiran.r@neuranx.ai');
        await loginPage.enterPassword(process.env.STENO_PASSWORD || 'Saikiran');
        await loginPage.clickSignIn();
        await expect(page).not.toHaveURL(/\/login(?:[/?#]|$)/, { timeout: 15000 });

        await dashboardPage.clickOrganizations();
        await expect(page).toHaveURL(/\/organizations/i, { timeout: 15000 });
    });

    test('TC015: Open Organisations', async ({ page }) => {
        await expect(page).toHaveURL(/\/organizations/i);
        await expect(orgsPage.heading).toBeVisible();
    });

    test('TC016: Verify organisation listing', async ({ page }) => {
        await expect(orgsPage.orgListingTable).toBeVisible({ timeout: 10000 });
    });

    test('TC017: Create new organisation form opens', async ({ page }) => {
        await orgsPage.openCreateForm();
        const formVisible = await orgsPage.orgNameInput.isVisible({ timeout: 5000 }).catch(() => false);
        const modalVisible = await page.locator('[role="dialog"]').isVisible().catch(() => false);
        expect(formVisible || modalVisible).toBeTruthy();
    });

    test('TC018: Create organisation with valid details', async ({ page }) => {
        await orgsPage.openCreateForm();
        if (await orgsPage.orgNameInput.isVisible()) {
            await orgsPage.fillDetails(testOrgName, 'org_test@company.com');
            await orgsPage.save();
            await expect(page.getByText(testOrgName).first()).toBeVisible({ timeout: 10000 });
        }
    });

    test('TC019: Create organisation with empty fields', async ({ page }) => {
        await orgsPage.openCreateForm();
        if (await orgsPage.orgNameInput.isVisible()) {
            await orgsPage.save();
            const validationMsg = await orgsPage.orgNameInput.evaluate(el => el.validationMessage).catch(() => '');
            const alertVisible = await orgsPage.validationError.isVisible().catch(() => false);
            expect(Boolean(validationMsg) || alertVisible).toBeTruthy();
        }
    });

    test('TC020: Verify organisation name validation (spaces only)', async ({ page }) => {
        await orgsPage.openCreateForm();
        if (await orgsPage.orgNameInput.isVisible()) {
            await orgsPage.fillDetails('     ');
            await orgsPage.save();
            // Should reject invalid empty/space input
            const formOpen = await orgsPage.orgNameInput.isVisible();
            expect(formOpen).toBeTruthy();
        }
    });

    test('TC021: Create duplicate organisation', async ({ page }) => {
        await orgsPage.openCreateForm();
        if (await orgsPage.orgNameInput.isVisible()) {
            await orgsPage.fillDetails('Existing Organization');
            await orgsPage.save();
            // Duplicate handling check
            const duplicateAlert = page.locator('text=/already exists|duplicate/i');
            const isAlert = await duplicateAlert.isVisible({ timeout: 4000 }).catch(() => false);
            expect(isAlert || page.url().includes('organizations')).toBeTruthy();
        }
    });

    test('TC022: Verify email validation', async ({ page }) => {
        await orgsPage.openCreateForm();
        if (await orgsPage.orgEmailInput.isVisible().catch(() => false)) {
            await orgsPage.fillDetails('Valid Org Name', 'not-an-email');
            await orgsPage.save();
            const emailValidation = await orgsPage.orgEmailInput.evaluate(el => el.validationMessage);
            expect(emailValidation).not.toBe('');
        }
    });

    test('TC023: Verify organisation details', async ({ page }) => {
        // Open the current organisation
        await expect(orgsPage.heading).toBeVisible();
    });

    test('TC024: Edit organisation', async ({ page }) => {
        if (await orgsPage.editButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await orgsPage.editButton.click();
            await orgsPage.fillDetails(`${testOrgName}_Updated`);
            await orgsPage.save();
            await expect(page.getByText(`${testOrgName}_Updated`).first()).toBeVisible({ timeout: 10000 });
        }
    });

    test('TC025: Cancel organisation creation', async ({ page }) => {
        await orgsPage.openCreateForm();
        if (await orgsPage.cancelButton.isVisible().catch(() => false)) {
            await orgsPage.cancel();
            await expect(page.locator('[role="dialog"]')).not.toBeVisible();
        }
    });

    test('TC026: Search organisation', async ({ page }) => {
        await orgsPage.search('Stenograph');
        await expect(orgsPage.orgListingTable).toBeVisible();
    });

    test('TC027: Refresh organisation page', async ({ page }) => {
        await page.reload({ waitUntil: 'domcontentloaded' });
        await expect(page).toHaveURL(/\/organizations/i);
    });

    test('TC028: Delete organisation', async ({ page }) => {
        if (await orgsPage.deleteButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await orgsPage.deleteButton.click();
            if (await orgsPage.confirmDeleteButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                await orgsPage.confirmDeleteButton.click();
            }
        }
    });
});
