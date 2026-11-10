
const { test, expect } = require('@playwright/test');
const LoginPage = require('../pages/LoginPage');

test('Verify dashboard navigation options', async ({ page }) => {

    const loginPage = new LoginPage(page);

    // Step 1: Navigate to login page
    await loginPage.navigateToLoginPage();

    // Step 2: Read credentials from .env
    const email = process.env.STENO_EMAIL;
    const password = process.env.STENO_PASSWORD;

    // Step 3: Validate credentials
    if (!email || !password) {
        throw new Error('Login credentials are missing from .env');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('STENO_EMAIL is not a valid email address');
    }

    console.log('Email loaded:', Boolean(email));
    console.log('Password loaded:', Boolean(password));

    // Step 4: Enter valid credentials
    await loginPage.enterEmail('test@gmail.com');
    await loginPage.enterPassword('Welcome@123');

    // Step 5: Click Sign In
    await loginPage.clickSignIn();

    // Step 6: Verify successful dashboard navigation
    await expect(page).not.toHaveURL(/\/login(?:[/?#]|$)/);

    await expect(
        page.getByText('Dashboard', { exact: true }).first()
    ).toBeVisible({ timeout: 3000 });

    // Step 7: Verify sidebar navigation options
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

    console.log('Dashboard navigation options verified successfully');

});
