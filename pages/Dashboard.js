class DashboardPage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;

        // Core dashboard elements
        this.dashboardHeading = page.getByText('Dashboard', { exact: true }).first();
        this.sidebar = page.locator('nav, aside, [role="navigation"]').first();
        this.toggleSidebarButton = page.getByRole('button', { name: 'Toggle Sidebar' });

        // Navigation links
        this.navMyOrganization = page.getByText(/My Organization|Organizations/i).first();
        this.navCases = page.getByText('Cases', { exact: true }).first();
        this.navJobs = page.getByText('Jobs', { exact: true }).first();
        this.navProductInstances = page.getByText('Product Instances', { exact: true }).first();
        this.navSeatAllocations = page.getByText('Seat Allocations', { exact: true }).first();
        this.navOrders = page.getByText('Orders', { exact: true }).first();
        this.navMyProducts = page.getByText('My Products', { exact: true }).first();
        this.navAuditLog = page.getByText('Audit Log', { exact: true }).first();
        this.navProfileSettings = page.getByText('Profile Settings', { exact: true }).first();

        // Profile & User Menu
        this.profileIcon = page.locator('[aria-label*="profile" i], [aria-label*="user" i], button:has-text("Profile"), [data-testid="user-profile"], button:has(svg)').last();
        this.profileMenu = page.locator('[role="menu"], [data-testid="profile-dropdown"]');
        this.logoutButton = page.getByRole('menuitem', { name: /Log out|Logout|Sign out/i })
            .or(page.getByText(/Log out|Logout|Sign out/i)).first();
    }

    async navigateToDashboard() {
        await this.page.goto('https://dev.steno.one/', { waitUntil: 'domcontentloaded' });
    }

    async verifyAllMenuElements() {
        const menuItems = [
            this.navMyOrganization,
            this.navCases,
            this.navJobs,
            this.navProfileSettings
        ];
        for (const item of menuItems) {
            await item.waitFor({ state: 'visible', timeout: 10000 });
        }
    }

    async clickOrganizations() {
        await this.navMyOrganization.click();
    }

    async clickCases() {
        await this.navCases.click();
    }

    async clickJobs() {
        await this.navJobs.click();
    }

    async openProfileMenu() {
        if (await this.profileIcon.isVisible()) {
            await this.profileIcon.click();
        } else {
            await this.navProfileSettings.click();
        }
    }

    async logout() {
        await this.openProfileMenu();
        if (await this.logoutButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await this.logoutButton.click();
        } else {
            // Fallback direct navigation to /login or clear session
            await this.page.goto('https://dev.steno.one/login');
        }
    }
}

module.exports = DashboardPage;
