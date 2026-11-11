
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const LoginPage = require('../pages/Login');

test('authenticate once and save session', async ({ page }) => {
    const loginPage = new LoginPage(page);

    const email = (process.env.STENO_EMAIL || '').trim();
    const password = (process.env.STENO_PASSWORD || '').trim();

    if (!email || !password) {
        throw new Error('Email or password missing in .env');
    }

    console.log('Email loaded:', Boolean(email));
    console.log('Password loaded:', Boolean(password));

    await loginPage.navigateToLoginPage();

    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();

    await loginPage.enterEmail(email);
    await loginPage.enterPassword(password);

    console.log('Email entered:', await loginPage.emailInput.inputValue() !== '');
    console.log('Password entered:', await loginPage.passwordInput.inputValue() !== '');
// Monitor browser console errors
page.on('console', message => {
    if (message.type() === 'error') {
        console.log('BROWSER CONSOLE ERROR:', message.text());
    }
});

// Monitor failed network requests
page.on('requestfailed', request => {
    console.log(
        'FAILED REQUEST:',
        request.method(),
        request.url(),
        request.failure()?.errorText
    );
});

// Monitor login-related HTTP responses
page.on('response', async response => {
    if (/login|auth|token|session/i.test(response.url())) {
        console.log(
            'AUTH RESPONSE:',
            response.status(),
            response.url()
        );
    }
});
    await loginPage.clickSignIn();

    // Wait for either successful navigation or a visible login error
    await Promise.race([
        page.waitForURL(url => !url.pathname.includes('/login'), {
            timeout: 20000
        }).catch(() => null),

        loginPage.errorMessage.waitFor({
            state: 'visible',
            timeout: 20000
        }).catch(() => null)
    ]);

    console.log('Current URL:', page.url());

    const errorVisible = await loginPage.errorMessage.isVisible().catch(() => false);

    if (errorVisible) {
        console.log(
            'Login error:',
            await loginPage.errorMessage.innerText()
        );
    }

    const dashboardVisible = await loginPage.dashboardHeader
        .isVisible()
        .catch(() => false);

    console.log('Dashboard visible:', dashboardVisible);

    if (!dashboardVisible) {
        throw new Error(
            'Login was not successful. Check the browser and diagnostic output.'
        );
    }

    const authDirectory = path.join(process.cwd(), '.auth');

    fs.mkdirSync(authDirectory, { recursive: true });

    await page.context().storageState({
        path: path.join(authDirectory, 'user.json')
    });

    console.log('Authentication state saved successfully.');
});
