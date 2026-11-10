
const { test, expect } = require('@playwright/test');
const LoginPage = require('../pages/LoginPage');

test('Verify session remains active after dashboard refresh', async ({ page }) => {

    const loginPage = new LoginPage(page);

    // Step 1: Login with valid credentials
    await loginPage.navigateToLoginPage();
    await loginPage.enterEmail(process.env.STENO_EMAIL);
    await loginPage.enterPassword(process.env.STENO_PASSWORD);
    await loginPage.clickSignIn();

    // Step 2: Verify dashboard is loaded
    await expect(page).not.toHaveURL(/\/login(?:[/?#]|$)/);
    await expect(
        page.getByText('Dashboard', { exact: true }).first()
    ).toBeVisible();

    // Step 3: Refresh the dashboard
    await page.reload();

    // Step 4: Verify session remains active
    await expect(page).not.toHaveURL(/\/login(?:[/?#]|$)/);
    await expect(
        page.getByText('Dashboard', { exact: true }).first()
    ).toBeVisible();

    console.log('Session remains active after refresh');

});
