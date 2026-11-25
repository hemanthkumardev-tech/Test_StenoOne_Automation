class OrganizationsPage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;

        // Heading & Navigation
        this.heading = page.getByRole('heading', { name: /Organization/i }).or(page.getByText(/Organization/i)).first();
        this.dashboardHeading = page.getByText('Dashboard', { exact: true }).first();

        // 7 Tabs in My Organization (/organizations/{id})
        this.tabOverview = page.getByRole('tab', { name: 'Overview', exact: true });
        this.tabHierarchy = page.getByRole('tab', { name: 'Hierarchy', exact: true });
        this.tabSubOrganizations = page.getByRole('tab', { name: 'Sub-Organizations', exact: true });
        this.tabUsers = page.getByRole('tab', { name: 'Users', exact: true });
        this.tabRolesPermissions = page.getByRole('tab', { name: 'Roles & Permissions', exact: true });
        this.tabProductInstances = page.getByRole('tab', { name: 'Product Instances', exact: true });
        this.tabOrganizationSharedData = page.getByRole('tab', { name: /Organization Shared Data|Shared Data/i });

        // Active Dialog
        this.dialog = page.locator('[role="dialog"]').first();

        // Overview Tab & Edit Modal Locators
        this.btnEditOrg = page.getByRole('button', { name: 'Edit', exact: true })
            .or(page.getByText('Edit', { exact: true })).first();
        this.orgStatusDropdown = page.locator('select[name="status"], [role="combobox"]').first();
        this.orgWebsiteInput = page.getByLabel(/Website/i).or(page.locator('input[name="website"], input[placeholder*="website" i]')).first();
        this.orgPhoneInput = page.getByLabel(/Phone/i).or(page.locator('input[type="tel"], input[name="phone"]')).first();
        this.orgAddressInput = page.getByLabel(/Address/i).or(page.locator('textarea[name="address"], input[name="address"]')).first();
        this.orgLogoUpload = page.locator('input[type="file"]').first();
        this.btnSaveOrgEdit = page.getByRole('button', { name: /Save Changes|Save/i }).first();
        this.btnCancelOrgEdit = this.dialog.getByRole('button', { name: 'Close' });

        // Hierarchy Tab Locators
        this.treeRootOrg = page.getByText(/TestOrgDemo/i).first();
        this.treeSubOrgTeam = page.getByText('Team', { exact: true }).first();
        this.treeSubOrgDemo = page.getByText('TestOrgDemoSub', { exact: true }).first();
        this.deptIt = page.getByText('it', { exact: true }).first();
        this.deptSteno = page.getByText('steno', { exact: true }).first();
        this.deptTestSubDep1 = page.getByText('TestOrgDemoSub_Dep1', { exact: true }).first();

        // Sub-Organizations Tab Locators
        this.btnCreateSubOrg = page.getByRole('button', { name: /Create Sub-Org/i })
            .or(page.getByText(/Create Sub-Org/i)).first();
        this.subOrgRowTeam = page.getByText('Team', { exact: true }).first();
        this.subOrgRowDemoSub = page.getByText('TestOrgDemoSub', { exact: true }).first();
        this.btnAllocateSubOrg = page.getByRole('button', { name: 'Allocate', exact: true })
            .or(page.getByText('Allocate', { exact: true })).first();

        // Users Tab — Create User & Invite User Locators
        this.btnCreateUser = page.getByRole('button', { name: 'Create User', exact: true })
            .or(page.getByText('Create User', { exact: true })).first();
        this.btnInviteUser = page.getByRole('button', { name: 'Invite User', exact: true })
            .or(page.getByText('Invite User', { exact: true })).first();
        this.inputUserDisplayName = this.dialog.getByPlaceholder('John Doe')
            .or(this.dialog.locator('input[type="text"]').first());
        this.inputUserEmail = this.dialog.getByPlaceholder('user@example.com')
            .or(this.dialog.locator('input[type="email"]').first());
        this.inputUserPassword = this.dialog.getByPlaceholder('••••••••')
            .or(this.dialog.locator('input[type="password"]').first());
        this.btnShowPassword = this.dialog.getByRole('button', { name: 'Show password' });
        this.btnHidePassword = this.dialog.getByRole('button', { name: 'Hide password' });
        this.roleDropdownTrigger = this.dialog.getByRole('combobox').first();
        this.btnCancelModal = this.dialog.getByRole('button', { name: 'Cancel', exact: true });
        this.btnSubmitCreateUser = this.dialog.getByRole('button', { name: 'Create User', exact: true }).or(this.dialog.locator('button:has-text("Create User")')).first();
        this.btnSubmitSendInvitation = this.dialog.getByRole('button', { name: 'Send Invitation', exact: true }).or(this.dialog.locator('button:has-text("Send Invitation")')).first();

        // Roles & Permissions Tab — Create Role & Assign Role Locators
        this.btnAssignRole = page.getByRole('button', { name: /Assign/i }).or(page.getByText('Assign Role', { exact: false })).first();
        this.btnCreateRole = page.getByRole('button', { name: 'Create Role', exact: true })
            .or(page.getByText('Create Role', { exact: true })).first();
        this.inputRoleName = this.dialog.getByPlaceholder('e.g. Case Manager, Billing Admin')
            .or(this.dialog.locator('input[type="text"]').first());
        this.roleTypeDropdownTrigger = this.dialog.locator('button[role="combobox"]').first();
        this.btnSubmitCreateRole = this.dialog.locator('button[type="submit"]:has-text("Create Role & Assign Permissions")');

        // Product Instances Tab Locators
        this.rowProductPublish = page.getByText(/Publish/i).first();
        this.rowProductSyncGen = page.getByText(/Sync Generator/i).first();
        this.rowProductCapture = page.getByText(/Capture/i).first();
        this.btnAllocateProductSeats = page.getByRole('button', { name: /Allocate/i }).first();

        // Organization Shared Data Tab Locators
        this.generalJobsDataCard = page.getByText(/General Jobs Data/i).first();
        this.emailTemplatesHeader = page.getByText(/Email Templates/i).first();
        this.fileUploadInput = page.locator('input[type="file"]').first();
    }

    // Tab Navigation Methods
    async openOverview() {
        await this.tabOverview.click();
    }

    async openHierarchy() {
        await this.tabHierarchy.click();
    }

    async openSubOrganizations() {
        await this.tabSubOrganizations.click();
    }

    async openUsers() {
        await this.tabUsers.click();
    }

    async openRolesAndPermissions() {
        await this.tabRolesPermissions.click();
    }

    async openProductInstances() {
        await this.tabProductInstances.click();
    }

    async openOrganizationSharedData() {
        if (await this.tabOrganizationSharedData.isVisible({ timeout: 5000 }).catch(() => false)) {
            await this.tabOrganizationSharedData.click();
        } else {
            await this.tabProductInstances.hover().catch(() => {});
            await this.page.keyboard.press('ArrowRight').catch(() => {});
            await this.tabOrganizationSharedData.click({ timeout: 5000 }).catch(() => {});
        }
    }

    // Create User Actions
    async openCreateUserModal() {
        await this.btnCreateUser.waitFor({ state: 'visible', timeout: 10000 });
        await this.btnCreateUser.click();
        await this.dialog.waitFor({ state: 'visible', timeout: 10000 });
    }

    async selectRoleFromDropdown(roleText = 'Member') {
        const combobox = this.dialog.getByRole('combobox').first();
        await combobox.scrollIntoViewIfNeeded();
        await combobox.click();

        const listbox = this.page.locator('[role="listbox"]');
        await listbox.waitFor({ state: 'visible', timeout: 5000 });

        const option = this.page.getByRole('option', { name: new RegExp(roleText, 'i') }).first();
        await option.waitFor({ state: 'visible', timeout: 5000 });
        await option.click();

        await listbox.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
        await this.page.waitForTimeout(400);
    }

    async togglePasswordVisibility() {
        if (await this.btnShowPassword.isVisible().catch(() => false)) {
            await this.btnShowPassword.click();
        } else if (await this.btnHidePassword.isVisible().catch(() => false)) {
            await this.btnHidePassword.click();
        }
    }

    async fillCreateUserForm({ displayName, email, password, roleName }) {
        if (displayName) await this.inputUserDisplayName.fill(displayName);
        if (email) await this.inputUserEmail.fill(email);
        if (password) await this.inputUserPassword.fill(password);
        if (roleName) await this.selectRoleFromDropdown(roleName);
    }

    async submitCreateUser() {
        await this.btnSubmitCreateUser.scrollIntoViewIfNeeded();
        await this.btnSubmitCreateUser.click();
    }

    // Invite User Actions
    async openInviteUserModal() {
        await this.btnInviteUser.waitFor({ state: 'visible', timeout: 10000 });
        await this.btnInviteUser.click();
        await this.dialog.waitFor({ state: 'visible', timeout: 10000 });
    }

    async fillInviteUserForm({ displayName, email, roleName }) {
        if (displayName) await this.inputUserDisplayName.fill(displayName);
        if (email) await this.inputUserEmail.fill(email);
        if (roleName) await this.selectRoleFromDropdown(roleName);
    }

    async submitInviteUser() {
        await this.btnSubmitSendInvitation.scrollIntoViewIfNeeded();
        await this.btnSubmitSendInvitation.click();
    }

    // Create Role Actions
    async openCreateRoleModal() {
        await this.btnCreateRole.waitFor({ state: 'visible', timeout: 10000 });
        await this.btnCreateRole.click();
        await this.dialog.waitFor({ state: 'visible', timeout: 10000 });
    }

    async selectRoleType(roleType = 'Organization') {
        await this.roleTypeDropdownTrigger.click();
        const option = this.page.getByRole('option', { name: new RegExp(`^${roleType}$`, 'i') }).first();
        await option.waitFor({ state: 'visible', timeout: 5000 });
        await option.click();
        await this.page.locator('[role="listbox"]').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
        await this.page.waitForTimeout(400);
    }

    async fillCreateRoleForm({ roleName, roleType }) {
        if (roleName) await this.inputRoleName.fill(roleName);
        if (roleType) await this.selectRoleType(roleType);
    }

    async submitCreateRole() {
        await this.btnSubmitCreateRole.click();
    }
}

module.exports = OrganizationsPage;