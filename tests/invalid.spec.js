
const { test, expect } = require('@playwright/test');
const LoginPage = require('../pages/LoginPage');

test('Verify login with invalid email and valid password', async ({ page }) => {

    const loginPage = new LoginPage(page);

    // Navigate to login page
    await loginPage.navigateToLoginPage();

    // Enter invalid email and valid password
    await loginPage.enterEmail('invaliduser@email.com');
    await loginPage.enterPassword(process.env.STENO_PASSWORD);

    // Click Sign In
    await loginPage.clickSignIn();

    // Verify login was unsuccessful
    await expect(page).toHaveURL(/\/login(?:[/?#]|$)/);

    // Inspect application response
    console.log('Current URL:', page.url());
    console.log('Page text:', await page.locator('body').innerText());

});
