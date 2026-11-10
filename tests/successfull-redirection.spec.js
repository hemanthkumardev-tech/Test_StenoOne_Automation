
const { test, expect } = require('@playwright/test');
const LoginPage = require('../pages/LoginPage');

test('Verify successful redirection to dashboard', async ({ page }) => {

    const loginPage = new LoginPage(page);

    // Navigate to login page
    await loginPage.navigateToLoginPage();

    // Verify login page URL
    await expect(page).toHaveURL(/\/login/);

    // Enter valid credentials
    await loginPage.enterEmail(process.env.STENO_EMAIL);
    await loginPage.enterPassword(process.env.STENO_PASSWORD);

    // Click Sign In
    await loginPage.clickSignIn();

    // Verify successful redirection
    await expect(page).not.toHaveURL(/\/login(?:[/?#]|$)/);

    // Verify dashboard content
    await expect(
        page.getByText('Dashboard', { exact: true }).first()
    ).toBeVisible();

    console.log('Successfully redirected to dashboard');

});
