const { test, expect } = require('@playwright/test');
const LoginPage = require('../pages/Login');

test.describe('Module 1: Login to Website (TC001 - TC008)', () => {
    let loginPage;
    const validEmail = process.env.STENO_EMAIL || 'saikiran.r@neuranx.ai';
    const validPassword = process.env.STENO_PASSWORD || 'Saikiran';
    const loginUrl = process.env.STENO_BASE_URL || 'https://dev.steno.one/login';

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
    });

    test('TC001: Verify website login page', async ({ page }) => {
        await loginPage.navigateToLoginPage(loginUrl);
        await expect(page).toHaveURL(/\/login/);
        await expect(loginPage.emailInput).toBeVisible();
        await expect(loginPage.passwordInput).toBeVisible();
        await expect(loginPage.signInButton).toBeVisible();
    });

    test('TC002: Login with valid credentials', async ({ page }) => {
        await loginPage.navigateToLoginPage(loginUrl);
        await loginPage.enterEmail(validEmail);
        await loginPage.enterPassword(validPassword);
        await loginPage.clickSignIn();
        await expect(page).not.toHaveURL(/\/login(?:[/?#]|$)/, { timeout: 15000 });
        await expect(loginPage.dashboardHeader).toBeVisible({ timeout: 15000 });
    });

    test('TC003: Login with invalid email', async ({ page }) => {
        await loginPage.navigateToLoginPage(loginUrl);
        await loginPage.enterEmail('invalid_user_9999@test.com');
        await loginPage.enterPassword(validPassword);
        await loginPage.clickSignIn();
        await expect(page).toHaveURL(/\/login(?:[/?#]|$)/);
        await expect(loginPage.dashboardHeader).not.toBeVisible();
        await expect(loginPage.signInButton).toBeVisible();
    });

    test('TC004: Login with incorrect password', async ({ page }) => {
        await loginPage.navigateToLoginPage(loginUrl);
        await loginPage.enterEmail(validEmail);
        await loginPage.enterPassword('IncorrectPassword123!');
        await loginPage.clickSignIn();
        await expect(page).toHaveURL(/\/login(?:[/?#]|$)/);
        await expect(loginPage.dashboardHeader).not.toBeVisible();
        await expect(loginPage.signInButton).toBeVisible();
    });

    test('TC005: Login with empty fields', async ({ page }) => {
        await loginPage.navigateToLoginPage(loginUrl);
        await loginPage.clickSignIn();

        const emailValidation = await loginPage.emailInput.evaluate(el => el.validationMessage);
        const isEmailRequired = await loginPage.emailInput.getAttribute('required');

        if (emailValidation) {
            expect(emailValidation).not.toBe('');
        } else {
            expect(isEmailRequired).not.toBeNull();
        }
        await expect(page).toHaveURL(/\/login(?:[/?#]|$)/);
    });

    test('TC006: Verify password visibility', async ({ page }) => {
        await loginPage.navigateToLoginPage(loginUrl);
        const samplePassword = 'TestPassword123!';
        await loginPage.enterPassword(samplePassword);

        await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
        await loginPage.clickPasswordVisibility();
        await expect(loginPage.passwordInput).toHaveAttribute('type', 'text');
        await expect(loginPage.passwordInput).toHaveValue(samplePassword);

        await loginPage.clickPasswordVisibility();
        await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    });

    test('TC007: Verify successful redirection', async ({ page }) => {
        await loginPage.navigateToLoginPage(loginUrl);
        await expect(page).toHaveURL(/\/login/);
        await loginPage.enterEmail(validEmail);
        await loginPage.enterPassword(validPassword);
        await loginPage.clickSignIn();
        await expect(page).not.toHaveURL(/\/login(?:[/?#]|$)/, { timeout: 15000 });
        await expect(loginPage.dashboardHeader).toBeVisible({ timeout: 15000 });
    });

    test('TC008: Refresh after login', async ({ page }) => {
        await loginPage.navigateToLoginPage(loginUrl);
        await loginPage.enterEmail(validEmail);
        await loginPage.enterPassword(validPassword);
        await loginPage.clickSignIn();
        await expect(page).not.toHaveURL(/\/login(?:[/?#]|$)/, { timeout: 15000 });
        await expect(loginPage.dashboardHeader).toBeVisible({ timeout: 15000 });

        await page.reload({ waitUntil: 'domcontentloaded' });
        await expect(page).not.toHaveURL(/\/login(?:[/?#]|$)/);
        await expect(loginPage.dashboardHeader).toBeVisible({ timeout: 15000 });
    });
});
