const { test, expect } = require('@playwright/test');
const LoginPage = require('../pages/Login');

test('Verify dashboard elements', async ({ page }) => {

    const loginPage = new LoginPage(page);
    const email = (process.env.STENO_EMAIL || '').trim();
    const password = (process.env.STENO_PASSWORD || '').trim();

    if (!email || !password) {
        throw new Error('STENO_EMAIL and STENO_PASSWORD must be set in the .env file');
    }

    // Step 1: Login with valid credentials
    await loginPage.navigateToLoginPage();
    await loginPage.enterEmail(email);
    await loginPage.enterPassword(password);
    await loginPage.clickSignIn();

    // Step 2: Verify dashboard
    await expect(
        page.getByText('Dashboard', { exact: true }).first()
    ).toBeVisible();

    // Step 3: Verify sidebar navigation options
    const menuOptions = [
        'My Organization',
        'Cases',
        'Jobs',
        'Product Instances',
        'Seat Allocations',
        'Orders',
        'My Products',
        'Audit Log',
        'Profile Settings'
    ];

    for (const option of menuOptions) {

        await expect(
            page.getByText(option, { exact: true }).first()
        ).toBeVisible();

        console.log(`Verified menu: ${option}`);
    }

    // Step 4: Verify application title
    await expect(page).toHaveTitle('Stenograph One Portal');

    console.log('Dashboard elements verified successfully');

});