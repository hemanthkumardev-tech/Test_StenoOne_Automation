const { test, expect } = require('@playwright/test');
const DashboardPage = require('../pages/Dashboard');
const OrganizationsPage = require('../pages/Organizations');
const CasesPage = require('../pages/Cases');

function uniqueLetters() {
    return String(Date.now())
        .slice(-6)
        .replace(/\d/g, d => String.fromCharCode(65 + Number(d)));
}

async function loadDashboardWithApiData(page, dashboardPage, useSpaClick = false) {
    // Dashboard specifically requests users with pageSize=500 and cases with pageSize=200
    const usersBodyPromise = page.waitForResponse(
        res => {
            const u = new URL(res.url());
            return u.pathname === '/api/v1/users' &&
                u.searchParams.get('pageSize') === '500' &&
                res.request().method() === 'GET' &&
                res.status() === 200;
        },
        { timeout: 60000 }
    ).then(res => res.json());

    const casesBodyPromise = page.waitForResponse(
        res => {
            const u = new URL(res.url());
            return u.pathname === '/api/v1/cases' &&
                u.searchParams.get('pageSize') === '200' &&
                res.request().method() === 'GET' &&
                res.status() === 200;
        },
        { timeout: 60000 }
    ).then(res => res.json());

    if (useSpaClick && await dashboardPage.dashboardHeading.isVisible().catch(() => false)) {
        await dashboardPage.dashboardHeading.click();
    } else {
        await dashboardPage.navigateToDashboard();
    }

    const [usersBody, casesBody] = await Promise.all([usersBodyPromise, casesBodyPromise]);
    await dashboardPage.waitForKpiCardsLoaded();

    const userItems = usersBody?.data?.items || [];
    const totalUsers = usersBody?.data?.totalCount ?? userItems.length;
    const activeUsers = userItems.filter(u => u.status === 'Active').length;
    const pendingUsers = userItems.filter(u => /pending/i.test(u.status || '')).length;

    const caseItems = casesBody?.data?.items || [];
    const openCasesCount = caseItems.filter(c => /active|open/i.test(c.status || '')).length;
    const totalCasesCount = casesBody?.data?.totalCount ?? caseItems.length;

    return {
        totalUsers,
        activeUsers,
        pendingUsers,
        openCasesCount,
        totalCasesCount
    };
}

test.describe('Dashboard Elements & Summary KPI Cards (TC062 - TC072)', () => {
    // Retry once on transient dev.steno.one Cloudflare 522/5xx errors
    test.describe.configure({ retries: 1 });

    let dashboardPage;

    test.beforeEach(async ({ page }) => {
        test.setTimeout(90000);
        dashboardPage = new DashboardPage(page);
    });

    // TC062: Verify dashboard sidebar navigation elements & title
    test('TC062: Verify dashboard elements and sidebar menu options', async ({ page }) => {
        await dashboardPage.navigateToDashboard();
        await expect(dashboardPage.dashboardHeading).toBeVisible();

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
            await expect(page.getByText(option, { exact: true }).first()).toBeVisible();
            console.log(`Verified menu: ${option}`);
        }

        await expect(page).toHaveTitle('Stenograph One Portal');
        console.log('Dashboard elements verified successfully');
    });

    // TC063: Verify Users card visibility
    test('TC063: Verify Users card visibility', async ({ page }) => {
        await dashboardPage.navigateToDashboard();
        await dashboardPage.waitForKpiCardsLoaded();

        await expect(dashboardPage.usersCard).toBeVisible();
        await expect(dashboardPage.usersCard.locator('p', { hasText: /^Users$/i })).toBeVisible();
        await expect(dashboardPage.usersCard.locator('p.text-3xl')).toBeVisible();
        await expect(dashboardPage.usersCard.locator('p.text-xs')).toBeVisible();
    });

    // TC064: Verify total users count
    test('TC064: Verify total users count matches underlying user data', async ({ page }) => {
        const apiData = await loadDashboardWithApiData(page, dashboardPage);
        const uiUsers = await dashboardPage.getUsersCardMetrics();

        console.log('TC064 Users KPI:', { uiUsers, apiTotal: apiData.totalUsers, apiActive: apiData.activeUsers });

        expect(uiUsers.active).toBe(apiData.activeUsers);
        expect(uiUsers.total).toBe(apiData.totalUsers);
        expect(uiUsers.active + uiUsers.pending).toBe(uiUsers.total);
    });

    // TC065: Verify pending users count
    test('TC065: Verify pending users count is correct', async ({ page }) => {
        const apiData = await loadDashboardWithApiData(page, dashboardPage);
        const uiUsers = await dashboardPage.getUsersCardMetrics();

        console.log('TC065 Pending Users KPI:', { uiPending: uiUsers.pending, apiPending: apiData.pendingUsers });

        expect(uiUsers.pending).toBe(apiData.pendingUsers);
        if (apiData.pendingUsers > 0) {
            expect(uiUsers.subtitle).toContain(`${apiData.pendingUsers} pending`);
        }
    });

    // TC066: Verify Open Cases card
    test('TC066: Verify Open Cases card visibility and displayed count', async ({ page }) => {
        await dashboardPage.navigateToDashboard();
        await dashboardPage.waitForKpiCardsLoaded();

        await expect(dashboardPage.casesCard).toBeVisible();
        await expect(dashboardPage.casesCard.locator('p', { hasText: /^Cases$/i })).toBeVisible();

        const uiCases = await dashboardPage.getCasesCardMetrics();
        expect(Number.isInteger(uiCases.openCases)).toBe(true);
        expect(uiCases.openCases).toBeGreaterThanOrEqual(0);
        expect(uiCases.subtitle.toLowerCase()).toContain('open cases');
    });

    // TC067: Verify open cases count
    test('TC067: Verify open cases count matches active/open cases data', async ({ page }) => {
        const apiData = await loadDashboardWithApiData(page, dashboardPage);
        const uiCases = await dashboardPage.getCasesCardMetrics();

        console.log('TC067 Cases KPI:', {
            uiOpenCases: uiCases.openCases,
            apiOpenCases: apiData.openCasesCount,
            apiTotalCases: apiData.totalCasesCount
        });

        expect(uiCases.openCases).toBe(apiData.openCasesCount);
    });

    // TC068: Verify Invites card
    test('TC068: Verify Invites card visibility', async ({ page }) => {
        await dashboardPage.navigateToDashboard();
        await dashboardPage.waitForKpiCardsLoaded();

        await expect(dashboardPage.invitesCard).toBeVisible();
        await expect(dashboardPage.invitesCard.locator('p', { hasText: /^Invites$/i })).toBeVisible();
        await expect(dashboardPage.invitesCard.locator('p.text-3xl')).toBeVisible();
        await expect(dashboardPage.invitesCard.locator('p.text-xs')).toContainText(/pending/i);
    });

    // TC069: Verify pending invitations
    test('TC069: Verify pending invitations count is correct', async ({ page }) => {
        const apiData = await loadDashboardWithApiData(page, dashboardPage);
        const uiInvites = await dashboardPage.getInvitesCardMetrics();
        const uiUsers = await dashboardPage.getUsersCardMetrics();

        console.log('TC069 Invites KPI:', {
            uiInvitesPending: uiInvites.pending,
            uiUsersPending: uiUsers.pending,
            apiPendingUsers: apiData.pendingUsers
        });

        expect(uiInvites.pending).toBe(apiData.pendingUsers);
        expect(uiInvites.pending).toBe(uiUsers.pending);
    });

    // TC070: Verify dashboard count after creating a user
    test('TC070: Verify dashboard count updates after creating a user', async ({ page }) => {
        const orgsPage = new OrganizationsPage(page);

        await loadDashboardWithApiData(page, dashboardPage);
        const beforeUsers = await dashboardPage.getUsersCardMetrics();
        console.log('TC070 Before Create User:', beforeUsers);

        // Navigate to My Organization -> Users and create a new user
        const suffix = uniqueLetters();
        const displayName = `KpiUser ${suffix}`;
        const email = `kpiuser.${suffix.toLowerCase()}@gmail.com`;

        await dashboardPage.clickOrganizations();
        await expect(page).toHaveURL(/\/organizations\/[a-f0-9-]+/i, { timeout: 15000 });
        await orgsPage.openUsers();
        await orgsPage.openCreateUserModal();
        await orgsPage.fillCreateUserForm({
            displayName,
            email,
            password: 'AutoPass@123',
            roleName: 'Member'
        });
        await expect(orgsPage.btnSubmitCreateUser).toBeEnabled({ timeout: 5000 });
        await orgsPage.submitCreateUser();
        await expect(orgsPage.dialog).not.toBeVisible({ timeout: 15000 });

        // Return to Dashboard via SPA click and verify Users KPI increased and matches live API
        const apiAfter = await loadDashboardWithApiData(page, dashboardPage, true);
        await expect.poll(
            async () => (await dashboardPage.getUsersCardMetrics()).active,
            { timeout: 15000 }
        ).toBeGreaterThanOrEqual(beforeUsers.active + 1);

        const afterUsers = await dashboardPage.getUsersCardMetrics();
        console.log('TC070 After Create User:', { afterUsers, apiAfter });
        expect(afterUsers.active).toBe(apiAfter.activeUsers);
        expect(afterUsers.total).toBe(apiAfter.totalUsers);
        expect(afterUsers.total).toBeGreaterThanOrEqual(beforeUsers.total + 1);
    });

    // TC071: Verify dashboard count after creating a case
    test('TC071: Verify dashboard count updates after creating a case', async ({ page }) => {
        const casesPage = new CasesPage(page);

        await loadDashboardWithApiData(page, dashboardPage);
        const beforeCases = await dashboardPage.getCasesCardMetrics();
        console.log('TC071 Before Create Case:', beforeCases);

        // Navigate to Cases via SPA click and create a new active case
        const stamp = Date.now().toString();
        const caseName = `KPI_Case_${stamp}`;
        const caseNumber = `CN-KPI-${stamp}`;

        await dashboardPage.clickCases();
        await expect(casesPage.heading).toBeVisible({ timeout: 15000 });
        await casesPage.openCreateCaseForm();
        await casesPage.fillCaseDetails({
            name: caseName,
            number: caseNumber,
            description: `KPI card validation case ${stamp}`,
            product: /^Publish/
        });
        await casesPage.submitCreate();
        await expect(casesPage.rowFor(caseName)).toBeVisible({ timeout: 15000 });

        // Return to Dashboard via SPA click and verify Open Cases KPI increased and matches live API
        const apiAfter = await loadDashboardWithApiData(page, dashboardPage, true);
        await expect.poll(
            async () => (await dashboardPage.getCasesCardMetrics()).openCases,
            { timeout: 15000 }
        ).toBeGreaterThanOrEqual(beforeCases.openCases + 1);

        const afterCases = await dashboardPage.getCasesCardMetrics();
        console.log('TC071 After Create Case:', { afterCases, apiAfter });
        expect(afterCases.openCases).toBe(apiAfter.openCasesCount);
    });

    // TC072: Verify dashboard count after sending an invitation
    test('TC072: Verify dashboard count updates after sending an invitation', async ({ page }) => {
        const orgsPage = new OrganizationsPage(page);

        await loadDashboardWithApiData(page, dashboardPage);
        const beforeInvites = await dashboardPage.getInvitesCardMetrics();
        const beforeUsers = await dashboardPage.getUsersCardMetrics();
        console.log('TC072 Before Send Invitation:', { beforeInvites, beforeUsers });

        // Navigate to My Organization -> Users and send an invitation
        const suffix = uniqueLetters();
        const displayName = `KpiInvite ${suffix}`;
        const email = `kpiinvite.${suffix.toLowerCase()}@gmail.com`;

        await dashboardPage.clickOrganizations();
        await expect(page).toHaveURL(/\/organizations\/[a-f0-9-]+/i, { timeout: 15000 });
        await orgsPage.openUsers();
        await orgsPage.openInviteUserModal();
        await orgsPage.fillInviteUserForm({
            displayName,
            email,
            roleName: 'Member'
        });
        await expect(orgsPage.btnSubmitSendInvitation).toBeEnabled({ timeout: 5000 });
        await orgsPage.submitInviteUser();
        await expect(orgsPage.dialog).not.toBeVisible({ timeout: 15000 });

        // Return to Dashboard via SPA click and verify Invites & Users pending/total KPI counts increased and match live API
        const apiAfter = await loadDashboardWithApiData(page, dashboardPage, true);
        await expect.poll(
            async () => (await dashboardPage.getInvitesCardMetrics()).pending,
            { timeout: 15000 }
        ).toBeGreaterThanOrEqual(beforeInvites.pending + 1);

        const afterInvites = await dashboardPage.getInvitesCardMetrics();
        const afterUsers = await dashboardPage.getUsersCardMetrics();
        console.log('TC072 After Send Invitation:', { afterInvites, afterUsers, apiAfter });

        expect(afterInvites.pending).toBe(apiAfter.pendingUsers);
        expect(afterUsers.pending).toBe(apiAfter.pendingUsers);
        expect(afterUsers.total).toBe(apiAfter.totalUsers);
        expect(afterUsers.pending).toBeGreaterThanOrEqual(beforeUsers.pending + 1);
        expect(afterUsers.total).toBeGreaterThanOrEqual(beforeUsers.total + 1);
    });
});