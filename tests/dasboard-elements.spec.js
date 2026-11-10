
const { test, expect } = require('@playwright/test');
const LoginPage = require('../pages/LoginPage');

test('Verify dashboard elements', async ({ page }) => {

    const loginPage = new LoginPage(page);

    // Step 1: Login with valid credentials
    await loginPage.navigateToLoginPage();
    await loginPage.enterEmail('test@gmail.com');
    await loginPage.enterPassword('Welcome@123');
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
