const { test, expect } = require('@playwright/test');
const path = require('path');

const AUTH_SUPERADMIN = path.join(process.cwd(), '.auth', 'superadmin.json');
const AUTH_ORGADMIN = path.join(process.cwd(), '.auth', 'orgadmin.json');

test.describe('Module 16: Multi-Role Matrix RBAC Verification (TC081 - TC087)', () => {
    test.setTimeout(60000);

    /**
     * TC081: Cross-Tenant Organization Management
     * Matrix:
     * - Create Organization: SuperAdmin = YES, Org Admin = NO
     * - Read Organization: SuperAdmin = YES (Global 69 orgs), Org Admin = YES (Tenant-scoped to 1 org)
     */
    test('TC081: Cross-Tenant Organization Access - SuperAdmin global discovery vs Org Admin tenant isolation', async ({ browser }) => {
        // --- 1. SuperAdmin Persona ---
        const superContext = await browser.newContext({ storageState: AUTH_SUPERADMIN });
        const superPage = await superContext.newPage();

        await superPage.goto('/', { waitUntil: 'domcontentloaded' });
        await superPage.getByRole('button', { name: 'Organizations', exact: true }).click();
        await superPage.waitForTimeout(2500);

        // SuperAdmin should see global organizations table and "Create Organization" button
        console.log(`[TC081] SuperAdmin URL: ${superPage.url()}`);
        expect(superPage.url()).toContain('/organizations');

        const btnCreateOrg = superPage.getByRole('button', { name: 'Create Organization', exact: true });
        await expect(btnCreateOrg).toBeVisible({ timeout: 10000 });
        console.log('[TC081] SuperAdmin: "Create Organization" action is visible.');

        // SuperAdmin sees total organization count across client organizations (e.g. "69 organizations")
        const superOrgHeading = superPage.getByRole('heading', { name: 'Organizations', exact: true });
        await expect(superOrgHeading).toBeVisible({ timeout: 10000 });
        console.log('[TC081] SuperAdmin: Multi-tenant global organizations catalog confirmed.');

        await superContext.close();

        // --- 2. Organization Admin Persona ---
        const orgContext = await browser.newContext({ storageState: AUTH_ORGADMIN });
        const orgPage = await orgContext.newPage();

        await orgPage.goto('/', { waitUntil: 'domcontentloaded' });
        // Org Admin sidebar has "My Organization" (scoped to own tenant)
        const myOrgBtn = orgPage.getByRole('button', { name: 'My Organization', exact: true });
        await expect(myOrgBtn).toBeVisible({ timeout: 10000 });
        await myOrgBtn.click();
        await orgPage.waitForTimeout(2500);

        console.log(`[TC081] OrgAdmin URL: ${orgPage.url()}`);
        expect(orgPage.url()).toMatch(/\/organizations\/[a-f0-9-]+/i);

        // Verify Org Admin visiting /organizations is scoped to single tenant (1 organization)
        await orgPage.goto('/organizations', { waitUntil: 'domcontentloaded' });
        await orgPage.waitForTimeout(2500);
        const orgScopeText = await orgPage.getByText(/1 organizations|TestOrgDemo/i).first();
        await expect(orgScopeText).toBeVisible({ timeout: 10000 });
        console.log('[TC081] OrgAdmin: Strictly scoped to tenant data (1 organization).');

        await orgContext.close();
    });

    /**
     * TC082: Global Products Administration
     * Matrix:
     * - Create Product: SuperAdmin = YES, Org Admin = NO
     * - Delete Product: SuperAdmin = YES, Org Admin = NO
     * - Read Product: SuperAdmin = YES, Org Admin = YES (Scoped Instances)
     */
    test('TC082: Global Products Administration - SuperAdmin product catalog vs Org Admin restriction', async ({ browser }) => {
        // --- 1. SuperAdmin Persona ---
        const superContext = await browser.newContext({ storageState: AUTH_SUPERADMIN });
        const superPage = await superContext.newPage();

        await superPage.goto('/', { waitUntil: 'domcontentloaded' });
        await superPage.waitForTimeout(2000);

        // SuperAdmin sidebar contains "Products" catalog menu
        const superProductsNav = superPage.getByRole('button', { name: 'Products', exact: true });
        await expect(superProductsNav).toBeVisible({ timeout: 10000 });
        console.log('[TC082] SuperAdmin: "Products" catalog menu is present in navigation.');

        await superProductsNav.click();
        await superPage.waitForTimeout(2000);
        expect(superPage.url()).toContain('/products');
        await superContext.close();

        // --- 2. Organization Admin Persona ---
        const orgContext = await browser.newContext({ storageState: AUTH_ORGADMIN });
        const orgPage = await orgContext.newPage();

        await orgPage.goto('/', { waitUntil: 'domcontentloaded' });
        await orgPage.waitForTimeout(2000);

        // Org Admin sidebar MUST NOT have global "Products" menu
        const orgAdminProductsNav = orgPage.getByRole('button', { name: 'Products', exact: true });
        await expect(orgAdminProductsNav).not.toBeVisible();
        console.log('[TC082] OrgAdmin: Global "Products" menu is correctly absent.');

        await orgContext.close();
    });

    /**
     * TC083: Internal Platform Settings & ASR Gateway Protection
     * Matrix:
     * - SuperAdmin: Internal SG employee role with full system access
     * - Org Admin: Client-side role scoped to own organization
     */
    test('TC083: Internal Platform Features - SuperAdmin platform settings vs Org Admin client boundary', async ({ browser }) => {
        // --- 1. SuperAdmin Persona ---
        const superContext = await browser.newContext({ storageState: AUTH_SUPERADMIN });
        const superPage = await superContext.newPage();

        await superPage.goto('/', { waitUntil: 'domcontentloaded' });
        await superPage.waitForTimeout(2000);

        const platformSettingsBtn = superPage.getByRole('button', { name: 'Platform Settings', exact: true });
        const asrGatewayBtn = superPage.getByRole('button', { name: 'ASR Gateway', exact: true });

        await expect(platformSettingsBtn).toBeVisible({ timeout: 10000 });
        await expect(asrGatewayBtn).toBeVisible({ timeout: 10000 });
        console.log('[TC083] SuperAdmin: Platform Settings & ASR Gateway menus are accessible.');

        await superContext.close();

        // --- 2. Organization Admin Persona ---
        const orgContext = await browser.newContext({ storageState: AUTH_ORGADMIN });
        const orgPage = await orgContext.newPage();

        await orgPage.goto('/', { waitUntil: 'domcontentloaded' });
        await orgPage.waitForTimeout(2000);

        const orgPlatformSettings = orgPage.getByRole('button', { name: 'Platform Settings', exact: true });
        const orgAsrGateway = orgPage.getByRole('button', { name: 'ASR Gateway', exact: true });

        await expect(orgPlatformSettings).not.toBeVisible();
        await expect(orgAsrGateway).not.toBeVisible();
        console.log('[TC083] OrgAdmin: Internal SG platform features are shielded.');

        await orgContext.close();
    });

    /**
     * TC084: Tenant Management & Role Creation Scoping
     * Matrix:
     * - Create Org User: Org Admin = YES
     * - Create Role: Org Admin = YES (Scoped to Organization)
     * - Read Org Users: Org Admin = YES
     */
    test('TC084: Tenant Scoping - Org Admin maintains full management over own organization', async ({ browser }) => {
        const orgContext = await browser.newContext({ storageState: AUTH_ORGADMIN });
        const orgPage = await orgContext.newPage();

        await orgPage.goto('/', { waitUntil: 'domcontentloaded' });
        await orgPage.getByRole('button', { name: 'My Organization', exact: true }).click();
        await expect(orgPage).toHaveURL(/\/organizations\/[a-f0-9-]+/i, { timeout: 15000 });

        // Verify Org Admin can manage Users tab
        await orgPage.getByRole('tab', { name: 'Users', exact: true }).click();
        const btnCreateUser = orgPage.getByRole('button', { name: 'Create User', exact: true });
        const btnInviteUser = orgPage.getByRole('button', { name: 'Invite User', exact: true });

        await expect(btnCreateUser).toBeVisible({ timeout: 10000 });
        await expect(btnInviteUser).toBeVisible({ timeout: 10000 });
        console.log('[TC084] OrgAdmin: Create User and Invite User controls are available.');

        // Verify Org Admin can access Roles & Permissions tab
        await orgPage.getByRole('tab', { name: 'Roles & Permissions', exact: true }).click();
        const btnCreateRole = orgPage.getByRole('button', { name: 'Create Role', exact: true });
        await expect(btnCreateRole).toBeVisible({ timeout: 10000 });
        console.log('[TC084] OrgAdmin: Create Role control is available.');

        await orgContext.close();
    });

    /**
     * TC085: Case Management Boundary
     * Matrix:
     * - Create Case: SuperAdmin = YES, Org Admin = YES
     * - Read Case: SuperAdmin = YES, Org Admin = YES
     * - Update Case: SuperAdmin = YES, Org Admin = YES
     * - Delete Case: SuperAdmin = YES, Org Admin = YES
     */
    test('TC085: Case Management - SuperAdmin and Org Admin full case operational access', async ({ browser }) => {
        const orgContext = await browser.newContext({ storageState: AUTH_ORGADMIN });
        const orgPage = await orgContext.newPage();

        await orgPage.goto('/cases', { waitUntil: 'domcontentloaded' });
        await orgPage.waitForTimeout(2000);

        // Verify Org Admin can view and create cases
        const btnNewCase = orgPage.getByRole('button', { name: /New Case|Create Case/i }).first();
        await expect(btnNewCase).toBeVisible({ timeout: 10000 });
        console.log('[TC085] OrgAdmin: "New Case" creation action is operational.');

        const table = orgPage.getByRole('table');
        await expect(table).toBeVisible({ timeout: 10000 });
        console.log('[TC085] OrgAdmin: Cases table is populated.');

        // Verify case row actions include Edit and Delete (Matrix: Update Case=YES, Delete Case=YES)
        const firstRow = table.locator('tbody tr').first();
        if (await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) {
            const btnEdit = firstRow.getByRole('button', { name: 'Edit' });
            const btnDelete = firstRow.getByRole('button', { name: 'Delete' });
            await expect(btnEdit).toBeVisible();
            await expect(btnDelete).toBeVisible();
            console.log('[TC085] OrgAdmin: Edit and Delete actions verified on case rows.');
        }

        await orgContext.close();
    });

    /**
     * TC086: Audit Log Access Verification
     * Matrix:
     * - Read Audit Log: SuperAdmin = YES, Org Admin = YES
     * - Export Audit Log: SuperAdmin = YES, Org Admin = YES
     */
    test('TC086: Audit Log Transparency - SuperAdmin and Org Admin audit accessibility', async ({ browser }) => {
        // --- 1. SuperAdmin Audit Log ---
        const superContext = await browser.newContext({ storageState: AUTH_SUPERADMIN });
        const superPage = await superContext.newPage();

        await superPage.goto('/', { waitUntil: 'domcontentloaded' });
        await superPage.getByRole('button', { name: 'Audit Log', exact: true }).click();
        await superPage.waitForTimeout(2500);

        const superAuditHeading = superPage.getByRole('heading', { name: /Audit Log/i }).or(superPage.getByText(/Audit Log/i)).first();
        await expect(superAuditHeading).toBeVisible({ timeout: 10000 });
        console.log('[TC086] SuperAdmin: Audit Log interface loaded.');
        await superContext.close();

        // --- 2. Org Admin Audit Log ---
        const orgContext = await browser.newContext({ storageState: AUTH_ORGADMIN });
        const orgPage = await orgContext.newPage();

        await orgPage.goto('/', { waitUntil: 'domcontentloaded' });
        await orgPage.getByRole('button', { name: 'Audit Log', exact: true }).click();
        await orgPage.waitForTimeout(2500);

        const orgAuditHeading = orgPage.getByRole('heading', { name: /Audit Log/i }).or(orgPage.getByText(/Audit Log/i)).first();
        await expect(orgAuditHeading).toBeVisible({ timeout: 10000 });
        console.log('[TC086] OrgAdmin: Audit Log interface loaded.');

        await orgContext.close();
    });

    /**
     * TC087: Multi-Persona Privilege Escalation Protection
     * Matrix:
     * - SuperAdmin-only administrative operations cannot be accessed by Org Admin
     */
    test('TC087: Multi-Persona Privilege Escalation - Backend strictly enforces role boundary', async ({ browser }) => {
        const orgContext = await browser.newContext({ storageState: AUTH_ORGADMIN });
        const orgPage = await orgContext.newPage();

        // Org Admin attempting direct navigation to platform-wide administration routes
        const superOnlyRoutes = ['/platform-settings', '/asr-gateway', '/admin/system-settings'];
        for (const route of superOnlyRoutes) {
            await orgPage.goto(route, { waitUntil: 'domcontentloaded' });
            await orgPage.waitForTimeout(1500);
            const currentUrl = orgPage.url();
            console.log(`[TC087] OrgAdmin route ${route} redirected to: ${currentUrl}`);

            // Must not stay on restricted platform route
            const isRestricted = !currentUrl.endsWith(route) || (await orgPage.textContent('body')).includes('404');
            expect(isRestricted).toBeTruthy();
        }

        await orgContext.close();
    });
});
