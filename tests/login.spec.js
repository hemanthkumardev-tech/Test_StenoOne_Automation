const { test, expect } = require('@playwright/test');
const LoginPage = require('../pages/Login');

test.describe('Steno Login Test Suite (TC001 - TC008)', () => {
    let loginPage;
    const validEmail = process.env.STENO_EMAIL || 'saikiran.r@neuranx.ai';
    const validPassword = process.env.STENO_PASSWORD || 'Saikiran';
    const loginUrl = process.env.STENO_BASE_URL || 'https://dev.steno.one/login';

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
    });

    // ─────────────────────────────────────────────────────────────
    // TC001: Verify website login page
    // ─────────────────────────────────────────────────────────────
    test('TC001: Verify website login page loads correctly', async ({ page }) => {
        // Open website URL
        await loginPage.navigateToLoginPage(loginUrl);

        // Login page should load
        await expect(page).toHaveURL(/\/login/);
        await expect(loginPage.emailInput).toBeVisible();
        await expect(loginPage.passwordInput).toBeVisible();
        await expect(loginPage.signInButton).toBeVisible();
    });

    // ─────────────────────────────────────────────────────────────
    // TC002: Login with valid credentials
    // ─────────────────────────────────────────────────────────────
    test('TC002: Login with valid credentials', async ({ page }) => {
        await loginPage.navigateToLoginPage(loginUrl);

        // Enter valid email and password, click Login
        await loginPage.enterEmail(validEmail);
        await loginPage.enterPassword(validPassword);
        await loginPage.clickSignIn();

        // User should log in successfully
        await expect(page).not.toHaveURL(/\/login(?:[/?#]|$)/, { timeout: 15000 });
        await expect(loginPage.dashboardHeader).toBeVisible({ timeout: 15000 });
    });

    // ─────────────────────────────────────────────────────────────
    // TC003: Login with invalid email
    // ─────────────────────────────────────────────────────────────
    test('TC003: Login with invalid email', async ({ page }) => {
        await loginPage.navigateToLoginPage(loginUrl);

        // Enter invalid email and valid password
        await loginPage.enterEmail('invalid_user_9999@test.com');
        await loginPage.enterPassword(validPassword);
        await loginPage.clickSignIn();

        // Appropriate error should appear / user stays on login page
        await expect(page).toHaveURL(/\/login(?:[/?#]|$)/);
        await expect(loginPage.dashboardHeader).not.toBeVisible();

        // Check for error notification or alert
        const errorAlert = page.getByRole('alert')
            .or(page.locator('.error, [data-testid="error-message"], [role="status"]'))
            .or(page.getByText(/invalid|not found|does not exist|failed/i))
            .first();

        // If an explicit error alert is displayed, verify it
        if (await errorAlert.isVisible({ timeout: 3000 }).catch(() => false)) {
            await expect(errorAlert).toBeVisible();
        } else {
            // Otherwise verify login form remains unauthenticated
            await expect(loginPage.signInButton).toBeVisible();
        }
    });

    // ─────────────────────────────────────────────────────────────
    // TC004: Login with incorrect password
    // ─────────────────────────────────────────────────────────────
    test('TC004: Login with incorrect password', async ({ page }) => {
        await loginPage.navigateToLoginPage(loginUrl);

        // Enter valid email and incorrect password
        await loginPage.enterEmail(validEmail);
        await loginPage.enterPassword('IncorrectPassword123!');
        await loginPage.clickSignIn();

        // Login should fail: user stays on login page, dashboard not visible
        await expect(page).toHaveURL(/\/login(?:[/?#]|$)/);
        await expect(loginPage.dashboardHeader).not.toBeVisible();

        // Check for error notification or alert
        const errorAlert = page.getByRole('alert')
            .or(page.locator('.error, [data-testid="error-message"], [role="status"]'))
            .or(page.getByText(/invalid|incorrect|failed/i))
            .first();

        if (await errorAlert.isVisible({ timeout: 3000 }).catch(() => false)) {
            await expect(errorAlert).toBeVisible();
        } else {
            await expect(loginPage.signInButton).toBeVisible();
        }
    });

    // ─────────────────────────────────────────────────────────────
    // TC005: Login with empty fields
    // ─────────────────────────────────────────────────────────────
    test('TC005: Login with empty fields (required-field validation)', async ({ page }) => {
        await loginPage.navigateToLoginPage(loginUrl);

        // Click Login without entering details
        await loginPage.clickSignIn();

        // Required-field validation should appear (browser HTML5 validation or form alert)
        const emailValidation = await loginPage.emailInput.evaluate(el => el.validationMessage);
        const isEmailRequired = await loginPage.emailInput.getAttribute('required');

        if (emailValidation) {
            expect(emailValidation).not.toBe('');
        } else {
            expect(isEmailRequired).not.toBeNull();
        }

        // Verify user stays on login page
        await expect(page).toHaveURL(/\/login(?:[/?#]|$)/);
    });

    // ─────────────────────────────────────────────────────────────
    // TC006: Verify password visibility
    // ─────────────────────────────────────────────────────────────
    test('TC006: Verify password visibility toggle', async ({ page }) => {
        await loginPage.navigateToLoginPage(loginUrl);

        const samplePassword = 'TestPassword123!';
        await loginPage.enterPassword(samplePassword);

        // Password visibility should initially be hidden
        await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');

        // Click password visibility icon
        await loginPage.clickPasswordVisibility();
        // Password visibility should toggle to text
        await expect(loginPage.passwordInput).toHaveAttribute('type', 'text');
        await expect(loginPage.passwordInput).toHaveValue(samplePassword);

        // Click again to hide
        await loginPage.clickPasswordVisibility();
        await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    });

    // ─────────────────────────────────────────────────────────────
    // TC007: Verify successful redirection
    // ─────────────────────────────────────────────────────────────
    test('TC007: Verify successful redirection to dashboard', async ({ page }) => {
        await loginPage.navigateToLoginPage(loginUrl);

        // Login successfully
        await loginPage.enterEmail(validEmail);
        await loginPage.enterPassword(validPassword);
        await loginPage.clickSignIn();

        // User should be redirected to dashboard
        await expect(page).not.toHaveURL(/\/login(?:[/?#]|$)/, { timeout: 15000 });
        await expect(loginPage.dashboardHeader).toBeVisible({ timeout: 15000 });
    });

    // ─────────────────────────────────────────────────────────────
    // TC008: Refresh after login
    // ─────────────────────────────────────────────────────────────
    test('TC008: Refresh the dashboard and verify user remains authenticated', async ({ page }) => {
        await loginPage.navigateToLoginPage(loginUrl);

        // Login successfully
        await loginPage.enterEmail(validEmail);
        await loginPage.enterPassword(validPassword);
        await loginPage.clickSignIn();

        // Confirm dashboard is reached
        await expect(page).not.toHaveURL(/\/login(?:[/?#]|$)/, { timeout: 15000 });
        await expect(loginPage.dashboardHeader).toBeVisible({ timeout: 15000 });

        // Refresh the dashboard
        await page.reload({ waitUntil: 'domcontentloaded' });

        // User should remain authenticated
        await expect(page).not.toHaveURL(/\/login(?:[/?#]|$)/);
        await expect(loginPage.dashboardHeader).toBeVisible({ timeout: 15000 });
    });
});
