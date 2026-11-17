const { test, expect } = require('@playwright/test');
const LoginPage = require('../pages/Login');
const DashboardPage = require('../pages/Dashboard');

test.describe('Module 2: Dashboard (TC009 - TC014)', () => {

    let loginPage;
    let dashboardPage;

    // Reuse the authenticated browser session
    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        dashboardPage = new DashboardPage(page);

        await page.goto('/', { waitUntil: 'domcontentloaded' });
        await expect(dashboardPage.dashboardHeading).toBeVisible({ timeout: 15000 });
    });

    // TC009: Verify dashboard loading
    test('TC009: Verify dashboard loading', async ({ page }) => {
        await expect(dashboardPage.dashboardHeading).toBeVisible();
        await expect(page).toHaveURL('https://dev.steno.one/');
    });

    // TC010: Verify dashboard elements
    test('TC010: Verify dashboard elements', async ({ page }) => {
        await dashboardPage.verifyAllMenuElements();
        await expect(page).toHaveTitle(/Stenograph One Portal|Steno/i);
    });

    // TC011: Verify organisation navigation
    test('TC011: Verify organisation navigation', async ({ page }) => {
        await dashboardPage.clickOrganizations();
        await expect(page).toHaveURL(/organizations/i, { timeout: 15000 });
    });

    // TC012: Verify dashboard navigation
    test('TC012: Verify dashboard navigation', async ({ page }) => {
        await dashboardPage.clickOrganizations();
        await expect(page).toHaveURL(/organizations/i, { timeout: 15000 });

        await dashboardPage.dashboardHeading.click();
        await expect(page).toHaveURL('https://dev.steno.one/', { timeout: 15000 });
        await expect(dashboardPage.dashboardHeading).toBeVisible();
    });

    // TC013: Verify user profile settings navigation
    test('TC013: Verify user profile settings navigation', async ({ page }) => {
        await dashboardPage.clickProfileSettings();
        await expect(page).toHaveURL(/change-password/i, { timeout: 15000 });
        await expect(page.getByRole('heading', { name: 'Change Password', exact: true })).toBeVisible();
        await expect(page.getByLabel('Current Password', { exact: true })).toBeVisible();
        await expect(page.getByLabel('New Password', { exact: true })).toBeVisible();
        await expect(page.getByLabel('Confirm New Password', { exact: true })).toBeVisible();
    });

    // TC014: Verify Organization Preview 'View' card action navigates to My Organization
    test('TC014A: Verify Organization Preview View card action', async ({ page }) => {
        await dashboardPage.clickOrganizationPreviewView();
        await expect(page).toHaveURL(/\/organizations\/[a-f0-9-]+/i, { timeout: 15000 });
    });

    // TC014B: Verify Seat Utilization 'Manage' card action navigates to Product Instances
    test('TC014B: Verify Seat Utilization Manage card action', async ({ page }) => {
        await dashboardPage.clickSeatUtilizationManage();
        await expect(page).toHaveURL(/organizations\/.*[?&]tab=products/i, { timeout: 15000 });
    });

    // TC014C: Verify Recent Activity 'View Full Audit Log' card action navigates to Audit Log
    test('TC014C: Verify Recent Activity View Full Audit Log card action', async ({ page }) => {
        await dashboardPage.clickViewFullAuditLog();
        await expect(page).toHaveURL(/\/audit-log/i, { timeout: 15000 });
    });

    // TC014D: Verify logout from dashboard
    test('TC014D: Verify logout from dashboard', async ({ page }) => {
        await dashboardPage.logout();
        await expect(page).toHaveURL(/login/i, { timeout: 15000 });
        await expect(loginPage.signInButton).toBeVisible();
    });
});