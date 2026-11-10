
const { test, expect } = require('@playwright/test');
const LoginPage = require('../pages/LoginPage');

test('Verify password visibility toggle', async ({ page }) => {

    const loginPage = new LoginPage(page);

    await loginPage.navigateToLoginPage();

    const testPassword = 'TestPassword123';
    const passwordInput = page.locator('#password');

    // Enter password
    await loginPage.enterPassword(testPassword);

    // Verify password is initially hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Verify entered value
    await expect(passwordInput).toHaveValue(testPassword);

    // Click Show password
    await loginPage.clickPasswordVisibility();

    // Verify password is visible
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await expect(passwordInput).toHaveValue(testPassword);

    // Click Hide password
    await page.getByRole('button', {
        name: 'Hide password'
    }).click();

    // Verify password is hidden again
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(passwordInput).toHaveValue(testPassword);

});
