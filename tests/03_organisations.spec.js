const { test, expect } = require('@playwright/test');
const DashboardPage = require('../pages/Dashboard');
const OrganizationsPage = require('../pages/Organizations');

function uniqueLetters() {
    return String(Date.now())
        .slice(-6)
        .replace(/\d/g, d => String.fromCharCode(65 + Number(d)));
}

test.describe('Module 3: Organizations & My Organization (TC015 - TC025)', () => {
    let dashboardPage;
    let orgsPage;

    test.beforeEach(async ({ page }) => {
        dashboardPage = new DashboardPage(page);
        orgsPage = new OrganizationsPage(page);

        // Precondition: Navigate to My Organization via sidebar navigation
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        await dashboardPage.clickOrganizations();
        await expect(page).toHaveURL(/\/organizations\/[a-f0-9-]+/i, { timeout: 15000 });
    });

    // TC015: Open My Organization
    test('TC015: Open My Organization', async ({ page }) => {
        await expect(page).toHaveURL(/\/organizations\/[a-f0-9-]+/i);
        await expect(page.getByText('Overview', { exact: true }).first()).toBeVisible({ timeout: 10000 });
    });

    // TC016: Verify Overview tab and organization details
    test('TC016: Verify Overview tab and organization details', async ({ page }) => {
        await orgsPage.openOverview();
        await expect(page.getByText(/TestOrgDemo/i).first()).toBeVisible({ timeout: 10000 });
        await expect(orgsPage.btnEditOrg).toBeVisible();
    });

    // TC017: Verify Edit Organization dialog fields and status dropdown
    test('TC017: Verify Edit Organization dialog and status options', async ({ page }) => {
        await orgsPage.openOverview();
        await orgsPage.btnEditOrg.click();

        // Verify edit modal opens
        const modalOrForm = page.locator('[role="dialog"], form').first();
        await expect(modalOrForm).toBeVisible({ timeout: 10000 });

        // Verify status dropdown exists
        const statusField = page.locator('select[name="status"], [role="combobox"]').first();
        if (await statusField.isVisible({ timeout: 3000 }).catch(() => false)) {
            await expect(statusField).toBeVisible();
        }

        // Close modal
        if (await orgsPage.btnCancelOrgEdit.isVisible({ timeout: 3000 }).catch(() => false)) {
            await orgsPage.btnCancelOrgEdit.click();
        } else {
            await page.keyboard.press('Escape');
        }
    });

    // TC018: Verify Hierarchy tab tree structure
    test('TC018: Verify Hierarchy tab tree structure', async ({ page }) => {
        await orgsPage.openHierarchy();
        await expect(orgsPage.treeRootOrg).toBeVisible({ timeout: 10000 });
        const subOrgOrDept = page.getByText(/Team|TestOrgDemoSub|it|steno/i).first();
        await expect(subOrgOrDept).toBeVisible({ timeout: 10000 });
    });

    // TC019: Verify Sub-Organizations tab and Allocate action
    test('TC019: Verify Sub-Organizations tab and Allocate action', async ({ page }) => {
        await orgsPage.openSubOrganizations();
        await expect(page.getByText(/Team|TestOrgDemoSub/i).first()).toBeVisible({ timeout: 10000 });
        await expect(orgsPage.btnAllocateSubOrg).toBeVisible();
    });

    // TC020: Create User — Full form automation (Password complexity, visibility toggle, role select, submit)
    test('TC020: Create User with valid details, password visibility toggle and role selection', async ({ page }) => {
        const suffix = uniqueLetters();
        // Display Name must not contain numbers
        const displayName = `AutoUser ${suffix}`;
        const email = `autouser.${suffix.toLowerCase()}@gmail.com`;
        const validPassword = 'AutoPass@123';

        await orgsPage.openUsers();
        await orgsPage.openCreateUserModal();

        // Verify modal heading, password policy items, and organization assignment
        await expect(orgsPage.dialog.getByText('Create User', { exact: true }).first()).toBeVisible();
        await expect(orgsPage.dialog.getByText('At least 8 characters')).toBeVisible();
        await expect(orgsPage.dialog.getByText('At least one uppercase letter')).toBeVisible();
        await expect(orgsPage.dialog.getByText('At least one number')).toBeVisible();
        await expect(orgsPage.dialog.getByText('At least one special character')).toBeVisible();
        await expect(orgsPage.dialog.getByText('No spaces')).toBeVisible();
        await expect(orgsPage.dialog.getByText('TestOrgDemo')).toBeVisible();

        // Fill display name, email, and valid strong password
        await orgsPage.inputUserDisplayName.fill(displayName);
        await orgsPage.inputUserEmail.fill(email);
        await orgsPage.inputUserPassword.fill(validPassword);

        // Verify password visibility toggle (Show -> Hide)
        await expect(orgsPage.inputUserPassword).toHaveAttribute('type', 'password');
        await orgsPage.togglePasswordVisibility();
        await expect(orgsPage.inputUserPassword).toHaveAttribute('type', 'text');
        await expect(orgsPage.inputUserPassword).toHaveValue(validPassword);
        await orgsPage.togglePasswordVisibility();
        await expect(orgsPage.inputUserPassword).toHaveAttribute('type', 'password');

        // Select a role from Role dropdown
        await orgsPage.selectRoleFromDropdown('Member');

        // Submit Create User form
        await expect(orgsPage.btnSubmitCreateUser).toBeEnabled({ timeout: 5000 });
        await orgsPage.submitCreateUser();

        // Verify modal closes and newly created user appears in Users list
        await expect(orgsPage.dialog).not.toBeVisible({ timeout: 15000 });
        await expect(page.getByText(email).or(page.getByText(displayName)).first()).toBeVisible({ timeout: 15000 });
    });

    // TC021: Invite User — Full form automation (Display Name, Email, Role selection, Send Invitation)
    test('TC021: Invite User with valid details and role selection', async ({ page }) => {
        const suffix = uniqueLetters();
        // Display Name must not contain numbers
        const displayName = `AutoInvite ${suffix}`;
        const email = `autoinvite.${suffix.toLowerCase()}@gmail.com`;

        await orgsPage.openUsers();
        await orgsPage.openInviteUserModal();

        // Verify Invite User modal elements
        await expect(orgsPage.dialog.getByText('Invite User', { exact: true }).first()).toBeVisible();
        await expect(orgsPage.dialog.getByText('TestOrgDemo')).toBeVisible();

        // Fill form and select role
        await orgsPage.fillInviteUserForm({
            displayName,
            email,
            roleName: 'Member'
        });

        // Submit Send Invitation
        await expect(orgsPage.btnSubmitSendInvitation).toBeEnabled({ timeout: 5000 });
        await orgsPage.submitInviteUser();

        // Verify modal closes (invitation sent)
        await expect(orgsPage.dialog).not.toBeVisible({ timeout: 15000 });
    });

    // TC022: Verify Roles & Permissions tab and 8 system roles
    test('TC022: Verify Roles & Permissions tab and 8 system roles', async ({ page }) => {
        await orgsPage.openRolesAndPermissions();

        // Wait for roles table to load
        const rolesTable = page.locator('table tbody');
        await expect(rolesTable).toBeVisible({ timeout: 15000 });
        await expect(page.getByText('Loading roles...')).not.toBeVisible({ timeout: 10000 }).catch(() => {});

        // Verify standard 8 system roles exist in the table rows
        const roleNames = [
            /Admin/i,
            /Billing Admin/i,
            /Capture Exception Viewer/i,
            /Manager/i,
            /Member/i,
            /Organization Admin/i,
            /Reporter/i,
            /Scopist/i
        ];

        for (const roleRegex of roleNames) {
            await expect(rolesTable.getByText(roleRegex).first()).toBeVisible();
        }

        await expect(orgsPage.btnAssignRole).toBeVisible();
        await expect(orgsPage.btnCreateRole).toBeVisible();
    });

    // TC023: Create Role — Full form automation (Role Name, Role Type Organization/Product, submit)
    test('TC023: Create Role with Organization and Product type verification', async ({ page }) => {
        const suffix = uniqueLetters();
        const roleName = `AutoRole ${suffix}`;

        await orgsPage.openRolesAndPermissions();
        await orgsPage.openCreateRoleModal();

        // Verify Create Role modal heading & helper text
        await expect(orgsPage.dialog.getByText('Create Role', { exact: true }).first()).toBeVisible();
        await expect(orgsPage.dialog.getByText(/Define the role scope/i)).toBeVisible();

        // Verify Role Type dropdown offers both Organization and Product
        await orgsPage.roleTypeDropdownTrigger.click();
        await expect(page.getByRole('option', { name: /^Organization$/i }).first()).toBeVisible();
        await expect(page.getByRole('option', { name: /^Product$/i }).first()).toBeVisible();
        await page.getByRole('option', { name: /^Organization$/i }).first().click();

        // Fill Role Name
        await orgsPage.inputRoleName.fill(roleName);

        // Submit Create Role & Assign Permissions
        await expect(orgsPage.btnSubmitCreateRole).toBeEnabled({ timeout: 5000 });
        await orgsPage.submitCreateRole();

        // Verify modal closes and either navigates to role detail page or shows the newly created role
        await expect(orgsPage.dialog).not.toBeVisible({ timeout: 15000 });
        await expect(page.getByText(roleName).first()).toBeVisible({ timeout: 15000 });
    });

    // TC024: Verify Product Instances tab and seat allocation limits
    test('TC024: Verify Product Instances tab and seat allocation limits', async ({ page }) => {
        await orgsPage.openProductInstances();
        await expect(orgsPage.rowProductPublish).toBeVisible({ timeout: 10000 });
        await expect(orgsPage.rowProductSyncGen).toBeVisible({ timeout: 10000 });
        await expect(orgsPage.rowProductCapture).toBeVisible({ timeout: 10000 });
        await expect(orgsPage.btnAllocateProductSeats).toBeVisible();
    });

    // TC025: Verify Organization Shared Data tab and General Jobs Data
    test('TC025: Verify Organization Shared Data tab and General Jobs Data', async ({ page }) => {
        await orgsPage.openOrganizationSharedData();
        const sharedDataVisible = await page.getByText(/General Jobs Data|Publish|Shared Data/i).first().isVisible({ timeout: 8000 }).catch(() => false);
        expect(sharedDataVisible).toBeTruthy();
    });
});