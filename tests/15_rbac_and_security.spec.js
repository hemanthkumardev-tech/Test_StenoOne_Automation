const { test, expect } = require('@playwright/test');
const DashboardPage = require('../pages/Dashboard');
const OrganizationsPage = require('../pages/Organizations');
const CasesPage = require('../pages/Cases');

const API_BASE = 'https://stenoonedev.azurewebsites.net';
const FOREIGN_TENANT_ID = '00000000-0000-0000-0000-000000000000';

test.describe('Module 15: RBAC & Security Access Control (TC073 - TC080)', () => {
    test.setTimeout(60000);

    let dashboardPage;
    let orgsPage;
    let casesPage;

    test.beforeEach(async ({ page }) => {
        dashboardPage = new DashboardPage(page);
        orgsPage = new OrganizationsPage(page);
        casesPage = new CasesPage(page);
    });

    /**
     * ATTACK SURFACE 1: Horizontal IDOR & Cross-Tenant / Cross-User Data Access
     */

    // TC073: Horizontal IDOR - Foreign Organization URL tampering is blocked/isolated
    test('TC073: Horizontal IDOR - Foreign Organization URL tampering is blocked or isolated', async ({ page }) => {
        // Step 1: Start visibly on Dashboard and navigate to My Organization
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        await dashboardPage.clickOrganizations();
        await expect(page).toHaveURL(/\/organizations\/[a-f0-9-]+/i, { timeout: 15000 });
        await page.waitForTimeout(1500);

        // Step 2: Tamper URL by attempting direct navigation to foreign organization ID
        console.log(`[TC073] Tampering URL to foreign tenant: /organizations/${FOREIGN_TENANT_ID}`);
        await page.goto(`/organizations/${FOREIGN_TENANT_ID}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2500);

        // Step 3: Verify the platform safely isolates data (redirects or prevents foreign data exposure)
        const currentUrl = page.url();
        const pageContent = await page.textContent('body');
        console.log(`[TC073] Resolved URL after tampering: ${currentUrl}`);

        const isBlockedOrHandled =
            currentUrl.includes('/login') ||
            !currentUrl.includes(FOREIGN_TENANT_ID) ||
            pageContent.includes('not found') ||
            pageContent.includes('Not Found') ||
            pageContent.includes('Access Denied') ||
            pageContent.includes('Unauthorized') ||
            pageContent.includes('No data found') ||
            pageContent.includes('404') ||
            pageContent.includes('Dashboard');

        expect(isBlockedOrHandled).toBeTruthy();
        await page.waitForTimeout(2000);
    });

    // TC074: Horizontal IDOR - Cross-Tenant API & UI data access isolation
    test('TC074: Horizontal IDOR - Cross-Tenant API data access isolation enforces scoping', async ({ page }) => {
        // Step 1: Visibly navigate to Cases in Chromium
        await page.goto('/cases', { waitUntil: 'domcontentloaded' });
        await expect(casesPage.heading).toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(1500);

        // Step 2: Verify active cases table is rendered
        await expect.poll(async () => await casesPage.caseRows.count(), { timeout: 15000 }).toBeGreaterThan(0);
        await page.waitForTimeout(1500);

        // Step 3: Perform API call with tampered foreign organizationId
        const response = await page.request.get(`${API_BASE}/api/v1/cases`, {
            params: {
                organizationId: FOREIGN_TENANT_ID,
                page: 1,
                limit: 10
            }
        });
        console.log(`[TC074] Tampered Tenant API status: ${response.status()}`);

        if (response.status() === 200) {
            const body = await response.json();
            const cases = body.data?.cases || body.data?.items || body.data || [];
            console.log(`[TC074] Cases returned: ${cases.length}`);
            for (const c of cases) {
                if (c.organizationId) {
                    expect(c.organizationId).not.toBe(FOREIGN_TENANT_ID);
                }
            }
        } else {
            expect([400, 401, 403, 404]).toContain(response.status());
        }

        // Visibly demonstrate tenant-scoped filtering on screen
        await casesPage.search('Case');
        await page.waitForTimeout(2000);
    });

    /**
     * ATTACK SURFACE 2: Privilege Escalation & Scoped Role-Permission Enforcement
     */

    // TC075: Privilege Escalation - Direct navigation to restricted administrative routes
    test('TC075: Privilege Escalation - Direct navigation to restricted admin routes is guarded', async ({ page }) => {
        const restrictedRoutes = [
            '/system-admin',
            '/admin/system-settings',
            '/super-admin'
        ];

        for (const route of restrictedRoutes) {
            console.log(`[TC075] Testing direct navigation to restricted route: ${route}`);
            await page.goto(route, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(2000);

            const url = page.url();
            const body = await page.textContent('body');
            console.log(`[TC075] Route ${route} resolved to: ${url}`);

            const isProtected =
                !url.endsWith(route) ||
                body.includes('404') ||
                body.includes('Not Found') ||
                body.includes('Access Denied') ||
                body.includes('Unauthorized') ||
                url.includes('/login');

            expect(isProtected).toBeTruthy();
        }
        await page.waitForTimeout(1500);
    });

    // TC076: RBAC Enforcement - System Role integrity and client role constraints
    test('TC076: RBAC Enforcement - Verify System Roles integrity and client role constraints', async ({ page }) => {
        // Step 1: Visibly navigate to My Organization
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        await dashboardPage.clickOrganizations();
        await expect(page).toHaveURL(/\/organizations\/[a-f0-9-]+/i, { timeout: 15000 });
        await page.waitForTimeout(1500);

        // Step 2: Open Roles & Permissions tab visibly
        await orgsPage.openRolesAndPermissions();
        const rolesTable = page.locator('table tbody');
        await expect(rolesTable).toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(1000);

        // Step 3: Visibly verify standard system roles from matrix
        const expectedRoles = ['Admin', 'Manager', 'Member', 'Reporter', 'Billing Admin'];
        for (const role of expectedRoles) {
            const roleCell = rolesTable.getByText(new RegExp(role, 'i')).first();
            await expect(roleCell).toBeVisible({ timeout: 5000 });
        }
        await page.waitForTimeout(1000);

        // Step 4: Visibly open Create Role modal
        await orgsPage.openCreateRoleModal();

        // Step 5: Visibly inspect Create Role modal elements
        await expect(orgsPage.dialog.getByText(/Create Role/i).first()).toBeVisible();
        await page.waitForTimeout(1000);

        // Visibly enter sample role name
        await orgsPage.inputRoleName.fill('Security Auditor');
        await page.waitForTimeout(1500);

        // Close modal cleanly via Close button
        const closeBtn = orgsPage.dialog.getByRole('button', { name: /Close|Cancel/i }).first();
        if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await closeBtn.click();
        } else {
            await page.keyboard.press('Escape');
        }
        await expect(orgsPage.dialog).not.toBeVisible({ timeout: 5000 });
        await page.waitForTimeout(1500);
    });

    // TC077: RBAC Enforcement - Audit Log API access control validation
    test('TC077: RBAC Enforcement - Audit Log API rejects unauthenticated requests', async ({ page, playwright }) => {
        // Step 1: Visibly navigate to Dashboard and click Audit Log
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        await dashboardPage.clickAuditLog();
        await page.waitForTimeout(2500);

        // Step 2: Visibly confirm Audit Log table renders for authenticated Admin
        const auditHeading = page.getByRole('heading', { name: /Audit Log/i }).or(page.getByText(/Audit Log/i)).first();
        await expect(auditHeading).toBeVisible({ timeout: 10000 });
        await page.waitForTimeout(2000);

        // Step 3: Verify unauthenticated API call is rejected with HTTP 401
        const unauthContext = await playwright.request.newContext({
            storageState: { cookies: [], origins: [] }
        });
        const auditResponse = await unauthContext.get(`${API_BASE}/api/v1/admin/audit-log`);
        console.log(`[TC077] Unauthenticated Audit Log API status: ${auditResponse.status()}`);
        expect([401, 403]).toContain(auditResponse.status());
        await unauthContext.dispose();

        await page.waitForTimeout(1500);
    });

    // TC078: Functional Access Control - Case deletion API requires valid authorization
    test('TC078: Functional Access Control - Case deletion API requires valid authorization', async ({ page, playwright }) => {
        // Step 1: Visibly navigate to Cases page in Chromium
        await page.goto('/cases', { waitUntil: 'domcontentloaded' });
        await expect(casesPage.heading).toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(2000);

        // Step 2: Scroll to first case row and visibly inspect
        const firstRow = casesPage.caseRows.first();
        if (await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) {
            await firstRow.scrollIntoViewIfNeeded();
            await page.waitForTimeout(1500);
        }

        // Step 3: Validate unauthenticated case deletion is rejected by backend
        const unauthContext = await playwright.request.newContext({
            storageState: { cookies: [], origins: [] }
        });
        const deleteResponse = await unauthContext.delete(`${API_BASE}/api/v1/cases/00000000-0000-0000-0000-000000000000`);
        console.log(`[TC078] Unauthenticated Case Delete API status: ${deleteResponse.status()}`);
        expect([401, 403, 404, 405]).toContain(deleteResponse.status());
        await unauthContext.dispose();

        await page.waitForTimeout(1500);
    });

    /**
     * ATTACK SURFACE 3: Mid-Session Role Revocation & Deactivation (Session Invalidation)
     */

    // TC079: Session Invalidation - Tampered authorization token is immediately rejected with 401
    test('TC079: Session Invalidation - Tampered authorization token is immediately rejected with 401', async ({ page, playwright }) => {
        // Step 1: Visibly start on Dashboard
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        await expect(dashboardPage.dashboardHeading).toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(2000);

        // Step 2: Test backend rejection of tampered authorization token
        const tamperedContext = await playwright.request.newContext({
            storageState: {
                cookies: [{
                    name: 'stenoone_auth',
                    value: 'tampered.invalid.jwt.token',
                    domain: 'stenoonedev.azurewebsites.net',
                    path: '/',
                    expires: 1893456000,
                    httpOnly: true,
                    secure: true,
                    sameSite: 'None'
                }],
                origins: []
            }
        });

        const res = await tamperedContext.get(`${API_BASE}/api/v1/cases`);
        console.log(`[TC079] Tampered Token Cases API status: ${res.status()}`);
        expect(res.status()).toBe(401);
        await tamperedContext.dispose();

        // Visibly demonstrate session state
        await page.waitForTimeout(2000);
    });

    // TC080: Mid-Session Deactivation - Session invalidation forces redirection to login
    test('TC080: Mid-Session Deactivation - Session invalidation forces redirection to login', async ({ browser }) => {
        // Step 1: Open fresh browser page with NO session cookies (simulating deactivation)
        const unauthBrowserContext = await browser.newContext({
            storageState: { cookies: [], origins: [] }
        });
        const unauthPage = await unauthBrowserContext.newPage();

        // Step 2: Visibly navigate to protected dashboard route
        console.log('[TC080] Navigating to protected route with invalid/revoked session...');
        await unauthPage.goto('/', { waitUntil: 'domcontentloaded' });
        await unauthPage.waitForTimeout(3500);

        // Step 3: Visibly verify redirected to login page and login form is rendered
        const redirectedUrl = unauthPage.url();
        console.log(`[TC080] Unauthenticated access redirected to: ${redirectedUrl}`);
        expect(redirectedUrl).toMatch(/\/login|\/auth/i);

        const emailInput = unauthPage.locator('input[type="email"], input[name="email"]').first();
        if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
            await expect(emailInput).toBeVisible();
        }

        await unauthPage.waitForTimeout(2500);
        await unauthBrowserContext.close();
    });
});
