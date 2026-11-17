class DashboardPage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;

        // Dashboard heading
        this.dashboardHeading = page
            .getByText('Dashboard', { exact: true })
            .first();

        // Sidebar
        this.sidebar = page
            .locator('nav, aside, [role="navigation"]')
            .first();

        this.toggleSidebarButton = page.getByRole('button', {
            name: 'Toggle Sidebar'
        });

        // Dashboard navigation elements in sidebar
        this.navMyOrganization = page
            .getByText(/My Organization|Organizations/i)
            .first();

        this.navCases = page
            .getByText('Cases', { exact: true })
            .first();

        this.navJobs = page
            .getByText('Jobs', { exact: true })
            .first();

        this.navProductInstances = page
            .getByText('Product Instances', { exact: true })
            .first();

        this.navSeatAllocations = page
            .getByText('Seat Allocations', { exact: true })
            .first();

        this.navOrders = page
            .getByText('Orders', { exact: true })
            .first();

        this.navMyProducts = page
            .getByText('My Products', { exact: true })
            .first();

        this.navAuditLog = page
            .getByText('Audit Log', { exact: true })
            .first();

        this.navProfileSettings = page
            .getByText('Profile Settings', { exact: true })
            .first();

        // Dashboard Summary Cards
        this.usersSummaryCard = page.locator('text=/USERS/i').first();
        this.casesSummaryCard = page.locator('text=/CASES/i').first();
        this.seatsSummaryCard = page.locator('text=/SEATS/i').first();
        this.invitesSummaryCard = page.locator('text=/INVITES/i').first();

        // Quick Action Buttons
        this.btnNewUser = page.getByRole('button', { name: 'New User', exact: true })
            .or(page.getByText('New User', { exact: true })).first();
        this.btnInviteUser = page.getByRole('button', { name: 'Invite User', exact: true })
            .or(page.getByText('Invite User', { exact: true })).first();
        this.btnNewCase = page.getByRole('button', { name: 'New Case', exact: true })
            .or(page.getByText('New Case', { exact: true })).first();
        this.btnAssignSeat = page.getByRole('button', { name: 'Assign Seat', exact: true })
            .or(page.getByText('Assign Seat', { exact: true })).first();
        this.btnManageRoles = page.getByRole('button', { name: 'Manage Roles', exact: true })
            .or(page.getByText('Manage Roles', { exact: true })).first();

        // Deep Navigation buttons on Dashboard cards
        this.orgPreviewViewButton = page.getByRole('button', { name: 'View', exact: true })
            .or(page.getByText('View', { exact: true })).first();

        this.seatUtilizationManageButton = page.getByRole('button', { name: 'Manage', exact: true })
            .or(page.getByText('Manage', { exact: true })).first();

        this.viewFullAuditLogButton = page.getByText('View Full Audit Log', { exact: false }).first();

        // Profile menu
        this.profileIcon = page.locator(
            '[aria-label*="profile" i], ' +
            '[aria-label*="user" i], ' +
            'button:has-text("Profile"), ' +
            '[data-testid="user-profile"]'
        ).last();

        this.profileMenu = page.locator(
            '[role="menu"], [data-testid="profile-dropdown"]'
        );

        // Confirmed logout button
        this.logoutButton = page.locator('button[title="Logout"]').or(page.getByText(/Log out|Logout|Sign out/i)).first();
    }

    // Navigate to Dashboard
    async navigateToDashboard() {
        await this.page.goto('/', {
            waitUntil: 'domcontentloaded'
        });

        await this.dashboardHeading.waitFor({
            state: 'visible',
            timeout: 15000
        });
    }

    // Verify Dashboard heading
    async verifyDashboardHeading() {
        await this.dashboardHeading.waitFor({
            state: 'visible',
            timeout: 10000
        });
    }

    // Verify all nine navigation elements
    async verifyAllMenuElements() {
        const menuItems = [
            this.navMyOrganization,
            this.navCases,
            this.navJobs,
            this.navProductInstances,
            this.navSeatAllocations,
            this.navOrders,
            this.navMyProducts,
            this.navAuditLog,
            this.navProfileSettings
        ];

        for (const item of menuItems) {
            await item.waitFor({
                state: 'visible',
                timeout: 10000
            });
        }
    }

    // Sidebar navigation methods
    async clickOrganizations() {
        await this.navMyOrganization.click();
    }

    async clickCases() {
        await this.navCases.click();
    }

    async clickJobs() {
        await this.navJobs.click();
    }

    async clickProductInstances() {
        await this.navProductInstances.click();
    }

    async clickSeatAllocations() {
        await this.navSeatAllocations.click();
    }

    async clickOrders() {
        await this.navOrders.click();
    }

    async clickMyProducts() {
        await this.navMyProducts.click();
    }

    async clickAuditLog() {
        await this.navAuditLog.click();
    }

    async clickProfileSettings() {
        await this.navProfileSettings.click();
    }

    // Deep Navigation Methods from Dashboard Cards
    async clickOrganizationPreviewView() {
        await this.orgPreviewViewButton.waitFor({ state: 'visible', timeout: 10000 });
        await this.orgPreviewViewButton.click();
    }

    async clickSeatUtilizationManage() {
        await this.seatUtilizationManageButton.waitFor({ state: 'visible', timeout: 10000 });
        await this.seatUtilizationManageButton.click();
    }

    async clickViewFullAuditLog() {
        await this.viewFullAuditLogButton.waitFor({ state: 'visible', timeout: 10000 });
        await this.viewFullAuditLogButton.click();
    }

    async openProfileMenu() {
        await this.profileIcon.waitFor({
            state: 'visible',
            timeout: 5000
        });
        await this.profileIcon.click();
        await this.profileMenu.waitFor({
            state: 'visible',
            timeout: 5000
        });
    }

    async logout() {
        await this.logoutButton.waitFor({
            state: 'visible',
            timeout: 10000
        });
        await this.logoutButton.click();
    }
}

module.exports = DashboardPage;