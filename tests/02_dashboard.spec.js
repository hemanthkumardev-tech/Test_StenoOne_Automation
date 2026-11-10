const { test, expect } = require('@playwright/test');
const LoginPage = require('../pages/Login');
const DashboardPage = require('../pages/Dashboard');

test.describe('Module 2: Dashboard (TC009 - TC014)', () => {
    let loginPage;
    let dashboardPage;
    const validEmail = process.env.STENO_EMAIL || 'saikiran.r@neuranx.ai';
    const validPassword = process.env.STENO_PASSWORD || 'Saikiran';
    const loginUrl = process.env.STENO_BASE_URL || 'https://dev.steno.one/login';

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        dashboardPage = new DashboardPage(page);

        // Precondition: Login to application
        await loginPage.navigateToLoginPage(loginUrl);
        await loginPage.enterEmail(validEmail);
        await loginPage.enterPassword(validPassword);
        await loginPage.clickSignIn();
        await expect(page).not.toHaveURL(/\/login(?:[/?#]|$)/, { timeout: 15000 });
    });

    test('TC009: Verify dashboard loading', async ({ page }) => {
        // Dashboard should load successfully
        await expect(dashboardPage.dashboardHeading).toBeVisible({ timeout: 15000 });
        await expect(page).toHaveURL('https://dev.steno.one/');
    });

    test('TC010: Verify dashboard elements', async ({ page }) => {
        // Check sidebar, navigation menus, and page title
        await dashboardPage.verifyAllMenuElements();
        await expect(page).toHaveTitle(/Stenograph One Portal|Steno/i);
    });

    test('TC011: Verify organisation navigation', async ({ page }) => {
        // Click Organisations in sidebar
        await dashboardPage.clickOrganizations();
        // Organisations page should open
        await expect(page).toHaveURL(/\/organizations/i, { timeout: 15000 });
    });

    test('TC012: Verify dashboard navigation', async ({ page }) => {
        // Navigate to another section first
        await dashboardPage.clickOrganizations();
        await expect(page).toHaveURL(/\/organizations/i, { timeout: 15000 });

        // Navigate back to dashboard
        await dashboardPage.dashboardHeading.click();
        await expect(page).toHaveURL('https://dev.steno.one/', { timeout: 15000 });
        await expect(dashboardPage.dashboardHeading).toBeVisible();
    });

    test('TC013: Verify user profile', async ({ page }) => {
        // Click profile icon / Profile Settings
        await dashboardPage.openProfileMenu();
        // User profile menu / settings should appear
        const profileVisible = await dashboardPage.profileMenu.isVisible().catch(() => false);
        const settingsVisible = await page.getByText(/Profile|Settings|Account/i).first().isVisible();
        expect(profileVisible || settingsVisible).toBeTruthy();
    });

    test('TC014: Verify logout from dashboard', async ({ page }) => {
        // Click Logout
        await dashboardPage.logout();
        // User should be redirected to login page
        await expect(page).toHaveURL(/\/login/i, { timeout: 15000 });
        await expect(loginPage.signInButton).toBeVisible();
    });
});
